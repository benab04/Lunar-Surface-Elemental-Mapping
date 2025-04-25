import os
import requests
import json
from urllib.parse import urljoin
import shutil
import base64
from astropy.io import fits
from django.conf import settings
from filelock import FileLock
from .views  import GaussianArray
from fp_solver.fit import XRFAnalyzer
import json

SCRAPING_CONTROLLER = os.path.join(settings.BASE_DIR, "scraping_controller.json")
# Constants
URL = "https://pradan.issdc.gov.in/ch2/protected/browse.xhtml"
HEADERS={}

if os.path.exists(SCRAPING_CONTROLLER):
    with open(SCRAPING_CONTROLLER, "r") as file:
        data = json.load(file)
        
        # Only proceed if status is TRUE
        if data.get("status") == "TRUE":
            jsessionid1 = data.get("JSESSIONID1", "")
            jsessionid2 = data.get("JSESSIONID2", "")
            fgtserver = data.get("FGTServer", "")
            oauth_token = data.get("OAuth_Token_Request_State", "")
            
            # Dynamically populate HEADERS
            HEADERS = {
                "Accept": "application/xml, text/xml, */*; q=0.01",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "User-Agent": data.get("User-Agent", ""),
                "Cookie": (
                    f"FGTServer={fgtserver}; "
                    f"JSESSIONID={jsessionid1}; "
                    f"JSESSIONID={jsessionid2}; "
                    f"OAuth_Token_Request_State={oauth_token}"
                ),
                "faces-request": "partial/ajax",
            }

            print("HEADERS created successfully:")   

# Define directories
DOWNLOAD_FOLDER = "fits_downloads"
LINKS_FOLDER = "fits_links"
LINKS_JSON = os.path.join(LINKS_FOLDER, "links.json")
START_ROW_FILE = "start_row.txt"  # File to store the start row for the next iteration
NUM_ROWS_TO_BE_FETCHED = 20
BACKGROUND_FILE = os.path.join(settings.BASE_DIR,"fp_solver","ch2_cla_l1_20230902T064630474_20230902T064638474_BKG.pha")
PKL_FILES=os.path.join(settings.BASE_DIR,".pkl_files")

# Ensure download folder exists
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
os.makedirs(LINKS_FOLDER, exist_ok=True)

def read_start_row():
    """
    Read the start row from the file.
    """
    
    if os.path.exists(START_ROW_FILE):
        with open(START_ROW_FILE, "r") as f:
            return int(f.read().strip())  # Read and return the current start_row from the file
    return 1000  # Default start row if the file doesn't exist

def update_start_row(new_start_row):
    """
    Update the start row in the file.
    """
    with open(START_ROW_FILE, "w") as f:
        f.write(str(new_start_row))  # Save the new start_row to the file

def erase_download_folder():
    """
    Erase the contents of the download folder before every run.
    """
    if os.path.exists(DOWNLOAD_FOLDER):
        # Remove all contents in the DOWNLOAD_FOLDER
        shutil.rmtree(DOWNLOAD_FOLDER)
    os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

def fetch_page_data(start_row, rows):
    """
    Fetch XML data for a given range of rows starting at start_row.
    """
    data = {
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": "tableForm:lazyDocTable",
        "javax.faces.partial.execute": "tableForm:lazyDocTable",
        "javax.faces.partial.render": "tableForm:lazyDocTable",
        "tableForm:lazyDocTable": "tableForm:lazyDocTable",
        "tableForm:lazyDocTable_pagination": "true",
        "tableForm:lazyDocTable_first": str(start_row),
        "tableForm:lazyDocTable_rows": str(rows),
        "tableForm:lazyDocTable_skipChildren": "true",
        "tableForm:lazyDocTable_encodeFeature": "true",
        "tableForm": "tableForm",
        "tableForm:lazyDocTable_rppDD": str(rows),
        "tableForm:lazyDocTable_selection": "",
        "tableForm:docDetail_scrollState": "0,0",
    }

    response = requests.post(URL, data=data, headers=HEADERS)
    if response.status_code == 200:
        print(f"Fetched data starting at row {start_row} successfully.")
        return response.text
    else:
        print(f"Failed to fetch data starting at row {start_row}. Status code: {response.status_code}")
        return None

def extract_links(xml_data):
    """
    Extract .fits and .xml links from the XML data.
    """
    base_url = "https://pradan.issdc.gov.in"
    fits_links = []
    xml_links = []

    # Extract links
    for line in xml_data.splitlines():
        if 'href="' in line:
            start_idx = line.find('href="') + 6
            end_idx = line.find('"', start_idx)
            link = line[start_idx:end_idx].replace("&amp;", "&")
            full_link = urljoin(base_url, link)

            # Remove query parameters before checking the file extension
            file_name = full_link.split("?")[0].lower()  # Remove query string and convert to lowercase

            # Check if the link ends with .fits or .xml
            if file_name.endswith(".fits"):
                fits_links.append(full_link)
            elif file_name.endswith(".xml"):
                xml_links.append(full_link)

    return {"fits": fits_links, "xml": xml_links}

def save_links_to_json(links, file_path):
    """
    Save links to a JSON file.
    """
    with open(file_path, "w") as json_file:
        json.dump(links, json_file, indent=2)
    # print(f"Links saved to {file_path}")

def download_file(url):
    """
    Download a file from the given URL and save it in the downloads folder.
    Removes query parameters like '?class' from the file name.
    """
    try:
        # Extract file name and sanitize it
        file_name = url.split("/")[-1].split("?")[0]
        file_path = os.path.join(DOWNLOAD_FOLDER, file_name)

        # Make the request with headers and save the file
        response = requests.get(url, headers=HEADERS, stream=True)
        response.raise_for_status()

        with open(file_path, "wb") as file:
            for chunk in response.iter_content(chunk_size=1024):
                file.write(chunk)

        print(f"Downloaded: {file_path}")
    except requests.RequestException as e:
        print(f"Failed to download {url}: {e}")
        
def download_all_links(links):
    """
    Download all files from the links.
    """
    for fits_link in links["fits"]:
        download_file(fits_link)
    # Uncomment below to download XML files as well, if needed
    # for xml_link in links["xml"]:
    #     download_file(xml_link)

def main():
    """
    Main function to fetch, process, and download links every 30 minutes.
    """
    # Read the current start_row from the file
    start_row = read_start_row()

    erase_download_folder()  # Erase the download folder before each run

    rows_to_fetch = NUM_ROWS_TO_BE_FETCHED  # Number of rows to fetch per iteration
    try:
        xml_data = fetch_page_data(start_row, rows_to_fetch)  # Fetch XML data for the given start_row
        if xml_data:
            # Extract links
            links = extract_links(xml_data)

            # Save links to JSON in the new directory
            save_links_to_json(links, LINKS_JSON)

            # Download files
            download_all_links(links)

            # After downloading, update the start_row
            new_start_row = start_row + len(links["fits"]) + 1  # Update the start_row for the next iteration
            update_start_row(new_start_row)  # Save the new start_row to the file
            
        fits_files = [os.path.join(DOWNLOAD_FOLDER, file) for file in os.listdir(DOWNLOAD_FOLDER) if file.endswith('.fits')]
        process_fits_files_and_save_indices(fits_files)
    except Exception as e:
        print( e)    
    allowed_elements = ['Fe', 'Si', 'Ca', 'Mg', 'Al']
    
    for file_path in fits_files:
        analyzer =   XRFAnalyzer() 
        intensities, concentrations, uncertanity = analyzer.analyze_sample(
                    file_path,
                    BACKGROUND_FILE,
                    plot_results=True,
                    use_background = True
                )
        
        for element in allowed_elements:
            if element == "Ca":
                element_file = "CAO"
            elif element =="Si":
                element_file = "SIO2"
            elif element =="Mg":
                element_file = "MGO"
            elif element =="Al":
                element_file = "AL2O3"
            else:
                element_file="FEO"
                
            abundance_map_file = os.path.join(PKL_FILES, f"W_{element_file}_map.pkl")
            coverage_map_file = os.path.join(PKL_FILES,  f"W_{element_file}_count.pkl")
            block_lat = [-90, 90, 90, -90]
            block_lon = [-180, -180, 180, 180]
            try:
                # Read the FITS file
                with fits.open(file_path) as hdulist:
                    # print(file_path)
                    header = hdulist[1].header  # Extract the header of the primary HDU
                    v0_lat = header.get("V0_LAT", "Not found")  # Retrieve V0_LAT if it exists
                    v1_lat = header.get("V1_LAT", "Not found")  # Retrieve V0_LAT if it exists
                    v2_lat = header.get("V2_LAT", "Not found")  # Retrieve V0_LAT if it exists
                    v3_lat = header.get("V3_LAT", "Not found")  # Retrieve V0_LAT if it exists
                    v0_lon = header.get("V0_LON", "Not found")  # Retrieve V0_LAT if it exists
                    v1_lon = header.get("V1_LON", "Not found")  # Retrieve V0_LAT if it exists
                    v2_lon = header.get("V2_LON", "Not found")  # Retrieve V0_LAT if it exists
                    v3_lon = header.get("V3_LON", "Not found")  # Retrieve V0_LAT if it exists
                    
                    # Append the extracted header and V0_LAT value
                    """ header_data.append({
                        "v0_lat": v0_lat,
                        "v1_lat": v1_lat,
                        "v2_lat": v2_lat,
                        "v3_lat": v3_lat,
                        "v0_lon": v0_lon,
                        "v1_lon": v1_lon,
                        "v2_lon": v2_lon,
                        "v3_lon": v3_lon,
                    }) """
                    
                    
                    img_lat = [v0_lat, v1_lat, v2_lat, v3_lat]
                    img_lon = [v0_lon, v1_lon, v2_lon, v3_lon]
                    
                    im_lat = img_lat
                    im_lon = img_lon
                    # prev_ratios = get_ratios(file) # Uncomment this
                
                    map_instance = GaussianArray(abundance_map_file = abundance_map_file, coverage_file=coverage_map_file, is_map=True)
                    # print(map_instance.arr[:,:,0])
                    img_lat, img_lon = map_instance.convert_coords_to_indices(img_lat, img_lon, block_lat, block_lon)
                    
                    cell_width = map_instance.arr.shape[0] / 48
                    cell_height = map_instance.arr.shape[1] / 48
                    grids = []
                    
                    for i in range(4):
                        x_ind = int(img_lat[i] / cell_width)
                        y_ind = int(img_lon[i] / cell_height)
                        
                        if (x_ind, y_ind) not in grids:
                            grids.append((x_ind, y_ind))        
                    max_value = concentrations[element]
                    
                    map_instance.add_gaussian_box(img_lat, img_lon, block_lat, block_lon, max_value = max_value, plot=True) #To replace calculate_pipeline with function to calculate pipeline
                    
                    img_lat = [v0_lat, v1_lat, v2_lat, v3_lat]
                    img_lon = [v0_lon, v1_lon, v2_lon, v3_lon]
                    
                    # prev_ratios = get_ratios(file) # Uncomment this
                    img_lat, img_lon = map_instance.convert_coords_to_indices(img_lat, img_lon, block_lat, block_lon)
                    
                    cell_width = map_instance.arr.shape[0] / 48
                    cell_height = map_instance.arr.shape[1] / 48
                    
                    for i in range(4):
                        x_ind = int(img_lat[i] / cell_width)
                        y_ind = int(img_lon[i] / cell_height)
                        
                        if (x_ind, y_ind) not in grids:
                            grids.append((x_ind, y_ind))
                            
                    for grid in grids:
                        file_name = os.path.join(element,"48x48",str(grid[0] + (grid[1] * 48)) + '.png')
                        print(f"Tile {grid[0] + (grid[1] * 48)} changed for {element}")
                        map_instance.export_grid_png(grid[0], grid[1], file_name)
                        
                    map_instance.export_map_pkl(abundance_map_file)
                    map_instance.export_coverage(coverage_map_file)


            except Exception as e:
                print(e)
                pass
        print("Processing done successfully")
    


def process_fits_files_and_save_indices(files):
    header_data = []

    # Iterate over the provided FITS files
    for file in files:
        
        try:
            # Read the FITS file
            with fits.open(file) as hdulist:
                header = hdulist[1].header  # Extract the header of the primary HDU
                v0_lat = header.get("V0_LAT", "Not found")  # Retrieve V0_LAT if it exists
                v1_lat = header.get("V1_LAT", "Not found")  # Retrieve V1_LAT if it exists
                v2_lat = header.get("V2_LAT", "Not found")  # Retrieve V2_LAT if it exists
                v3_lat = header.get("V3_LAT", "Not found")  # Retrieve V3_LAT if it exists
                v0_lon = header.get("V0_LON", "Not found")  # Retrieve V0_LON if it exists
                v1_lon = header.get("V1_LON", "Not found")  # Retrieve V1_LON if it exists
                v2_lon = header.get("V2_LON", "Not found")  # Retrieve V2_LON if it exists
                v3_lon = header.get("V3_LON", "Not found")  # Retrieve V3_LON if it exists
                
                # Append the extracted header and lat/lon values
                header_data.append({
                    "v0_lat": v0_lat,
                    "v1_lat": v1_lat,
                    "v2_lat": v2_lat,
                    "v3_lat": v3_lat,
                    "v0_lon": v0_lon,
                    "v1_lon": v1_lon,
                    "v2_lon": v2_lon,
                    "v3_lon": v3_lon,
                })
        except Exception as e:
            print(f"Failed to process file . Error: {str(e)}")
            continue  # Skip to the next file if there's an error with the current one

    # print(header_data)  # Log the extracted header data

    def calculate_tile_indices(header_data):
        tile_indices = []
        existing_indices = set()  # To ensure uniqueness of tile indices
        
        num_rows = 48  # Number of rows in the grid (adjust as needed)
        
        for entry in header_data:
            lat_indices = []
            lon_indices = []

            for i in range(4):  # Iterate through the 4 sets of lat/lon
                lat = entry[f'v{i}_lat']
                lon = entry[f'v{i}_lon']
                
                # Handle cases where lat/lon are strings or invalid values
                try:
                    lat = float(lat)
                    lon = float(lon)
                except ValueError:
                    continue  # If lat/lon is not a number, skip the calculation for this entry

                # Calculate latIndex and lonIndex for each set
                lat_index = max(0, min(num_rows, int((90 - lat) / (180/num_rows))))
                lon_index = max(0, min(num_rows, int(((lon + 180 + 360) % 360) / (360/num_rows))))
                
                lat_indices.append(lat_index)
                lon_indices.append(lon_index)
            
            # Consolidate indices (e.g., average, majority, or other aggregation logic)
            consolidated_lat_index = int(sum(lat_indices) / len(lat_indices))  # Average lat index
            consolidated_lon_index = int(sum(lon_indices) / len(lon_indices))  # Average lon index
            final_index = num_rows * consolidated_lon_index + consolidated_lat_index  # Final index

            if final_index not in existing_indices:
                tile_indices.append(final_index)
                existing_indices.add(final_index)
        
        return tile_indices

    # Process and calculate tile indices
    tile_indices = calculate_tile_indices(header_data)
    
    # Define the file where the indices will be saved
    modified_txt_file = os.path.join(settings.BASE_DIR, "modified.txt")
    
    # Read the existing indices from the file to avoid duplicates
    existing_indices = set()
    if os.path.exists(modified_txt_file):
        with open(modified_txt_file, "r") as f:
            existing_indices.update(f.read().strip().split(','))  # Read and split the indices as a set
    
    # Filter the new indices to only include those that aren't already in the file
    new_indices = [str(index) for index in tile_indices if str(index) not in existing_indices]
    # print(new_indices)
    # Append only new indices to the file
    if new_indices:
        try:
            lock = FileLock(modified_txt_file + ".lock")  # Lock file extension for locking
            with lock:
                with open(modified_txt_file, "a") as f:
                    
                    f.write( ","+",".join(new_indices) + ",")  # Append the indices as comma-separated
                # print(f"Tile indices saved to {modified_txt_file}")
        except Exception as e:
            print(f"Failed to write tile indices. Error: {str(e)}")


if __name__ == "__main__":
    main()
