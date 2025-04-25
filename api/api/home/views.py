import matplotlib
matplotlib.use('Agg') 
import os
import base64
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json
import numpy as np
from astropy.io import fits
from PIL import Image
from filelock import FileLock
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import pickle
from skimage.draw import polygon
from datetime import datetime
from fp_solver.fit import XRFAnalyzer
import shutil

# Define path to the modified.txt file and the folder where tiles are stored
MODIFIED_FILE_PATH = os.path.join(settings.BASE_DIR, "modified.txt")
TILES_FOLDER_PATH = os.path.join(settings.BASE_DIR, "element_tiles")
COORDINATES_DATA_FOLDER_PATH = os.path.join(settings.BASE_DIR, "coordinate_csv_files")
PKL_FILES=os.path.join(settings.BASE_DIR,".pkl_files")
SCALING_FACTOR_FILE=os.path.join(settings.BASE_DIR,"elemental_map_scaling_factors","minmax_values.csv")
LOGS_FILE_PATH = os.path.join(settings.BASE_DIR,"logs","logs.txt")
BACKGROUND_FILE = os.path.join(settings.BASE_DIR,"fp_solver","ch2_cla_l1_20230902T064630474_20230902T064638474_BKG.pha")
TEMP_FITS_DIR = os.path.join(settings.BASE_DIR, "temporary_fits")
SCRAPING_CONTROLLER = os.path.join(settings.BASE_DIR, "scraping_controller.json")

def clear_folder_contents(folder_path):
    # Check if the folder exists
    if os.path.exists(folder_path):
        # Iterate through the files and subdirectories in the folder
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            
            # Check if it is a file or directory
            if os.path.isfile(file_path):
                os.remove(file_path)  # Delete the file
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)  # Delete the subdirectory recursively
        print(f"Contents of {folder_path} have been cleared.")
    else:
        print(f"The folder {folder_path} does not exist.")


class GaussianArray:
    def __init__(self, grid_size=(64, 64), abundance_map_file = None, coverage_file = None, is_map=False):
        if is_map:
            if abundance_map_file is not None and coverage_file is not None:
                with open(coverage_file, 'rb') as f:
                    count_map = pickle.load(f)
                with open(abundance_map_file, 'rb') as f:
                    abundance_map = pickle.load(f)
                self.grid_size = abundance_map.shape
                self.arr = np.zeros((self.grid_size[0], self.grid_size[1], 2))
                self.arr[:, :, 0] = abundance_map
                self.arr[:, :, 1] = count_map
            else:
                raise ValueError("Abundance map and count file must be provided")
        else:
          self.grid_size = grid_size
          self.arr = np.zeros((grid_size[0], grid_size[1], 2))  # Initialize array based on grid_size

    def in_block_or_not(self, img_lat, img_lon, block_lat, block_lon):
        return (block_lat[0] <= min(img_lat) <= block_lat[2] and
                block_lat[0] <= max(img_lat) <= block_lat[2] and
                block_lon[0] <= min(img_lon) <= block_lon[2] and
                block_lon[0] <= max(img_lon) <= block_lon[2])

    def convert_coords_to_indices(self, lat, lon, block_lat, block_lon):
        lat_scale = (self.grid_size[0] - 1) / (block_lat[2] - block_lat[0])
        lon_scale = (self.grid_size[1] - 1) / (block_lon[2] - block_lon[0])

        lat_indices = [(lat[i] - block_lat[0]) * lat_scale for i in range(4)]
        lon_indices = [(lon[i] - block_lon[0]) * lon_scale for i in range(4)]

        lat_indices = list(map(int, lat_indices))
        lon_indices = list(map(int, lon_indices))

        return lat_indices, lon_indices

    def calculate_diagonal_length(self, lat_indices, lon_indices):
        diag1 = np.sqrt((lat_indices[2] - lat_indices[0]) ** 2 + (lon_indices[2] - lon_indices[0]) ** 2)
        diag2 = np.sqrt((lat_indices[3] - lat_indices[1]) ** 2 + (lon_indices[3] - lon_indices[1]) ** 2)
        return (diag1 + diag2) / 2

    def generate_gaussian_distribution(self, shape, center, sigma):
        x = np.arange(0, shape[0], 1, float)
        y = np.arange(0, shape[1], 1, float)
        x, y = np.meshgrid(x, y)
        gauss = (np.exp(-((x - center[0]) ** 2 + (y - center[1]) ** 2) / (2 * sigma ** 2))) / (2 * np.pi * sigma ** 2)
        if np.max(gauss) == 0:
            return gauss
        return gauss/np.max(gauss)

    def fill_up_the_array(self, img_lat, img_lon, block_lat, block_lon, max_value, target_diagonal=17.625, base_value=2.1739):
        if self.in_block_or_not(img_lat, img_lon, block_lat, block_lon):
            #img_lat_indices, img_lon_indices = self.convert_coords_to_indices(img_lat, img_lon, block_lat, block_lon)
            img_lat_indices = img_lat
            img_lon_indices = img_lon
            poly_points = np.array([img_lat_indices, img_lon_indices]).T
            min_y, min_x = np.min(poly_points, axis=0)
            max_y, max_x = np.max(poly_points, axis=0)

            avg_diagonal = self.calculate_diagonal_length(img_lat_indices, img_lon_indices)
            scale_factor = target_diagonal / avg_diagonal
            sigma = base_value * scale_factor

            height, width = max_y - min_y + 1, max_x - min_x + 1
            gaussian_values = self.generate_gaussian_distribution((height, width), (height // 2, width // 2), sigma) * max_value
            
            if np.isnan(gaussian_values).any():
                #print("NaN values in gaussian values")
                return

            # Mask the Gaussian to only fit inside the quadrilateral
            rr, cc = polygon(poly_points[:, 0] - min_y, poly_points[:, 1] - min_x, gaussian_values.shape)

            for r, c in zip(rr, cc):
                x, y = r + min_y, c + min_x
                if self.arr[x, y, 1] == 0:  # If cell hasn't been assigned a value yet
                    self.arr[x, y, 0] = gaussian_values[r, c]
                    self.arr[x, y, 1] = 1
                else:
                    count = self.arr[x, y, 1]
                    self.arr[x, y, 0] = (self.arr[x, y, 0] * count + gaussian_values[r, c]) / (count + 1)
                    self.arr[x, y, 1] += 1

    def add_gaussian_box(self, img_lat, img_lon, block_lat, block_lon, max_value, target_diagonal=17.625, base_value=2.1739, plot=False):
        self.fill_up_the_array(img_lat, img_lon, block_lat, block_lon, max_value, target_diagonal, base_value)
        # if plot:
        #     self.visualize_heatmap()

    def visualize_heatmap(self):
        heatmap_data = self.arr[:, :, 0]
        plt.figure(figsize=(10, 8))
        sns.heatmap(heatmap_data, cmap='viridis')
        plt.title('Heatmap of arr Layer 0 with Gaussian Distributions')
        plt.xlabel('X-axis')
        plt.ylabel('Y-axis')
        plt.show()
      
    def visualize_counts(self):
        heatmap_data = self.arr[:, :, 1]
        plt.figure(figsize=(10, 8))
        sns.heatmap(heatmap_data, cmap='viridis')
        plt.title('Heatmap of Number of Overlapping Fits')
        plt.xlabel('X-axis')
        plt.ylabel('Y-axis')
        plt.show()
    
    def export_map_pkl(self, f_name, dpi=192, resize_fact=1, plt_show=False):
        arr = self.arr[:, :, 0]
        fig = plt.figure(frameon=False)
        fig.set_size_inches(arr.shape[1]/dpi, arr.shape[0]/dpi)
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        ax.imshow(arr)
        #plt.savefig(f_name, dpi=(dpi * resize_fact))
        with open(f_name, 'wb') as f:
            pickle.dump(arr, f)
        if plt_show:
            plt.show()
        else:
            plt.close()
      
    def export_coverage(self, f_name, dpi=192, resize_fact=1, plt_show=False):
        arr = self.arr[:, :, 1]
        fig = plt.figure(frameon=False)
        fig.set_size_inches(arr.shape[1]/dpi, arr.shape[0]/dpi)
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        ax.imshow(arr)
        #plt.savefig(f_name, dpi=(dpi * resize_fact))
        with open(f_name, 'wb') as f:
            pickle.dump(arr, f)
        if plt_show:
            plt.show()
        else:
            plt.close()  
        
 

    def export_map_png(self, f_name, dpi=192, cmap='YlOrRd', resize_fact=1, plt_show=False):
        arr = self.arr[:, :, 0]  # Assuming this is a 2D array
        fig = plt.figure(frameon=False)
        fig.set_size_inches(arr.shape[1] / dpi, arr.shape[0] / dpi)
        
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        
        # Apply colormap here
        im = ax.imshow(arr, cmap=cmap)
      
        folder = TILES_FOLDER_PATH
        
        # Ensure the folder exists
        if not os.path.exists(folder):
            os.makedirs(folder)
        
        # Construct the full file path
        file_path = os.path.join(folder, f_name)
        
        # Save the figure with the desired dpi
        plt.savefig(file_path, dpi=(dpi * resize_fact), bbox_inches='tight', pad_inches=0)
        
        if plt_show:
            plt.show()
        else:
            plt.close()

    def export_grid_png(self, grid_x, grid_y, f_name, dpi=192, cmap='YlOrRd', resize_fact=1, plt_show=False):
        """
        Exports PNG of a specific grid from 48x48 division of lunar map.
        
        Inputs:
        - grid_x: x coordinate of grid (0-47)
        - grid_y: y coordinate of grid (0-47)
        - f_name: output filename for PNG
        - dpi: resolution of output image (default 192)
        - cmap: colormap for visualization (default 'YlOrRd')
        - resize_fact: factor to resize the output image (default 1)
        - plt_show: whether to display the plot (default False)
        """
        # Calculate grid cell size
        cell_height = self.arr.shape[0] / 48
        cell_width = self.arr.shape[1] / 48
        
        # Calculate pixel indices
        start_x = int(grid_x * cell_width)
        start_y = int(grid_y * cell_height)
        end_x = int((grid_x + 1) * cell_width)
        end_y = int((grid_y + 1) * cell_height)
        
        # Extract grid section
        grid_section = self.arr[start_y:end_y, start_x:end_x, 0]
        
        # Create figure without frame
        fig = plt.figure(frameon=False)
        fig.set_size_inches(grid_section.shape[1]/dpi, grid_section.shape[0]/dpi)
        
        # Set up axes without borders or labels
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        
        # Plot and save
        ax.imshow(grid_section, cmap=cmap)
        ax.set_xticks([])
        ax.set_yticks([])
        
        folder = TILES_FOLDER_PATH
        os.makedirs(folder, exist_ok=True)
        file_path = os.path.join(folder, f_name)
        
        plt.savefig(file_path, dpi=(dpi * resize_fact), bbox_inches='tight', pad_inches=0)
        
        if plt_show:
            plt.show()
        else:
            plt.close()

    def check_coverage(self):
        coverage = np.sum(self.arr[:, :, 1] > 0) / np.prod(self.grid_size)
        return coverage
    
def create_json_response_for_latlon(img_lat, img_lon, current_ratios, prev_ratios, filename, flare_type, rock_details):
    # Create the coordinates dictionary
    coordinates = {f"Lat{i}": img_lat[i] for i in range(len(img_lat))}
    coordinates.update({f"Lon{i}": img_lon[i] for i in range(len(img_lon))})

    # Safely get data from current_ratios and prev_ratios using .get() to avoid KeyError
    current_data = {f"{key}": value for key, value in current_ratios.items()}
    
    # Update current_data with Rocks details if available
    current_data["Rocks"] = rock_details
    
    # Initialize previous data with ratios
    previous_data = {f"{key}": value for key, value in prev_ratios.items()}
    
    # Update previous_data with Rocks details if available
    previous_data["Rocks"] = {}


    # Create the final JSON structure
    response = {
        "coordinates": coordinates,
        "current_data": current_data,
        "previous_data": previous_data,
        "fileinfo": {
            filename: {
                "flare_type": flare_type
            }
        }
    }

    # Return the response as a JSON string
    # return json.dumps(response, separators=(',', ':'))
    return response


def read_modified_indices():
    if os.path.exists(MODIFIED_FILE_PATH):
        lock = FileLock(MODIFIED_FILE_PATH + ".lock")
        with lock:
            with open(MODIFIED_FILE_PATH, "r") as f:
                content = f.read().strip()  # Read the content and strip any surrounding whitespace
                if content:  # If the content is not empty
                    # Split the string by commas and filter out any empty strings
                    indices = filter(None, content.split(','))
                    return set(map(int, indices))  # Convert to set of integers
                else:
                    return set()  # Return an empty set if the content is empty
    return set()  # Return an empty set if the file doesn't exist


# Helper function to encode an image to base64
def encode_image_to_base64(image_path):
    try:
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')  # Convert image to base64
        return encoded_image
    except Exception as e:
        print(f"Error encoding image {image_path}: {e}")
        return None

# View to handle the POST request with tile indices
@csrf_exempt  # Disable CSRF check for simplicity (you should add proper CSRF handling in production)
def process_tile_indices(request):
    if request.method == "POST":
        try:
            # Parse the JSON body
            data = json.loads(request.body)
            
            if not data:  # Check if no data is received
                return JsonResponse({"error": "Request body is empty"}, status=400)

            # Parse the 'tile_indices' from the data
            tile_indices = data.get('tile_indices', {})
            element = data.get('element')
            mapType = data.get('mapType')
            element_folder_name = f'{element}_{mapType}'
            print(element_folder_name)
            # print(tile_indices)

            

            # Check if tile_indices is a dictionary
            if not isinstance(tile_indices, dict):
                return JsonResponse({"error": "Invalid tile_indices format"}, status=400)

            # Read the current modified indices from the modified.txt file
            modified_indices = read_modified_indices()

            # Prepare arrays to store the results
            final_modified = []  # To store the final list of modified indices
            tile_indices_required_array = []  # To store the indices for which images need to be returned

            # Process each tile index in the received data
            for tile_index_str, is_needed in tile_indices.items():
                # Ensure tile_index is a valid number
                if not tile_index_str.isdigit():
                    print(f"Invalid tile index: {tile_index_str}. Skipping...")
                    continue

                tile_index = int(tile_index_str)

                # Find intersection: If it's in both the modified.txt and the request, add to final_modified
                if tile_index in modified_indices:
                    final_modified.append(tile_index)
                    modified_indices.remove(tile_index)  # Remove from modified list

                # Add to tile_indices_required_array if it's "false" or already modified
                if is_needed.lower() == "false" or tile_index in final_modified:
                    tile_indices_required_array.append(tile_index)

            # Prepare the response images
            response_images = {}

            # Process the required tiles (those in tile_indices_required_array)
            for tile_index in tile_indices_required_array:
                image_filename = f"{tile_index}.png"
                image_path = os.path.join(TILES_FOLDER_PATH,element_folder_name, "48x48", image_filename)
                # print(image_path)
                if os.path.exists(image_path):
                    base64_image = encode_image_to_base64(image_path)
                    if base64_image:
                        response_images[tile_index] = base64_image
                else:
                    print(f"Image for tile index {tile_index} not found.")

            # After processing, update modified.txt by saving the remaining indices
            lock = FileLock(MODIFIED_FILE_PATH + ".lock")
            with lock:
                # if '22' in tile_indices:
                    with open(MODIFIED_FILE_PATH, "w" ) as f:
                        if modified_indices:
                            f.write(",".join(map(str, modified_indices)))
                        else:
                            f.write("")  # Optionally write a placeholder or comment, e.g., "# No modified indices")


            # Prepare the final response data
            response_data = {
                "images": response_images,  # Base64 images of the required tiles
                "modified": final_modified  # The final modified indices (intersection + false ones)
            }
            print(final_modified)
            return JsonResponse(response_data, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format in request body"}, status=400)
        
        except Exception as e:
            print(f"Error processing request: {e}")
            return JsonResponse({"error": "Internal server error"}, status=500)

    # Return error for invalid HTTP method
    return JsonResponse({"error": "Invalid HTTP method"}, status=405)

@csrf_exempt
def process_fits(request):
    # Check if the request method is POST
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method. Only POST requests are allowed."})

    # Get the uploaded files (multiple files can be uploaded)
    files = request.FILES.getlist("file")
    element = request.POST.get("element")
    mapType = request.POST.get("mapType")
    element_folder_name = f'{element}_{mapType}'
    

    print("Files saved temporarily")
    
    if element == "Ca":
        element_file = "CAO"
    elif element =="Si":
        element_file = "SIO2"
    elif element =="Mg":
        element_file = "MGO"
    elif element =="Al":
        element_file = "AL2O3"
    elif element=="Fe":
        element_file="FEO"
        
    analyzer =   XRFAnalyzer() 
    abundance_map_file = os.path.join(PKL_FILES, f"W_{element_file}_map.pkl")
    coverage_map_file = os.path.join(PKL_FILES,  f"W_{element_file}_count.pkl")
    
    header_data = []  # To store extracted headers and V0_LAT values
    
    
    block_lat = [-90, 90, 90, -90]
    block_lon = [-180, -180, 180, 180]
    
    map_instance = GaussianArray(abundance_map_file = abundance_map_file, coverage_file=coverage_map_file, is_map=True)
    grids = []
    response_data=[]
    processed_data_response=[]
    image_response_data = []
    
    for file in files:
        try:
            # Read the FITS file
            with fits.open(file) as hdulist:
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
                
                
                img_lat = [v0_lat, v1_lat, v2_lat, v3_lat]
                img_lon = [v0_lon, v1_lon, v2_lon, v3_lon]
                
                im_lat = img_lat
                im_lon = img_lon
                # prev_ratios = get_ratios(file) # Uncomment this
                prev_ratios = {}
                print(map_instance.arr[:,:,0])
                img_lat, img_lon = map_instance.convert_coords_to_indices(img_lat, img_lon, block_lat, block_lon)
                
                cell_width = map_instance.arr.shape[0] / 48
                cell_height = map_instance.arr.shape[1] / 48
                
                for i in range(4):
                    x_ind = int(img_lat[i] / cell_width)
                    y_ind = int(img_lon[i] / cell_height)
                    
                    if (x_ind, y_ind) not in grids:
                        grids.append((x_ind, y_ind))
                
                # max_value = calculate_pipeline(file) #Uncomment this
                file_path = os.path.join(TEMP_FITS_DIR, file.name)
                print(file_path)
                with open(file_path, "wb") as temp_file:
                    for chunk in file.chunks():
                        temp_file.write(chunk)
                intensities, concentrations, uncertanity = analyzer.analyze_sample(
                    file_path,
                    BACKGROUND_FILE,
                    plot_results=True,
                    use_background = True
                )
                max_value = concentrations[element]
                map_instance.add_gaussian_box(img_lat, img_lon, block_lat, block_lon, max_value = max_value, plot=True) #To replace calculate_pipeline with function to calculate pipeline
                
                # current_ratios = get_ratios(file) # Uncomment this
                
                current_ratios = {}
                
                for key, value in concentrations.items():
                    if key != 'Si' and value != 0 and intensities[key]!=0 and  intensities['Si']!=0 :
                        ratio = value/concentrations['Si']
                        ratio = round(ratio, 5) 
                        # error = ratio * ((uncertanity[key]/intensities[key]) +(uncertanity['Si']/intensities['Si'])) 
                        error = ratio * ((uncertanity[key]) +(uncertanity['Si'])) 
                        error = round(error, 5)
                        current_ratios[f'{key}/Si']=f'{ratio} ± {error}'
                    elif value == 0:
                        current_ratios[f'{key}/Si']=f'Insignificant'
                        
                # flare = flare_type(file) #Uncomment this
                flare ='' 
                coordinate_columns = ['MIN_LAT','MAX_LAT','MIN_LON','MAX_LON']
                ratio_columns = ['mg',	'ca',	'si',	'ti'	,'al'	,'fe']
                rock_composition_columns = ['rock_type',	'plagioclase',	'orthopyroxene',	'clinopyroxene',	'olivine']
                
                
                
                # Determine the file range based on lat and long
                # Assumption: the lat and long ranges are given in discrete steps, for example, 10 degrees
                file_found = False
                for file_name in os.listdir(COORDINATES_DATA_FOLDER_PATH):
                    # Assuming the file is named as start_lat-end_lat-start_long-end_long.csv
                    if file_name.endswith(".csv"):
                        parts = file_name.replace('.csv', '').split('_')
                        start_lat, end_lat, start_long, end_long = map(int, parts)
                        avg_lat = sum(img_lat) / len(img_lat)
                        avg_lon = sum(img_lon) / len(img_lon)
                        # Check if the coordinates fall within the range of this file
                        if start_lat <= avg_lat <= end_lat and start_long <= avg_lon <= end_long:
                            # Read the corresponding CSV file using pandas
                            file_path = os.path.join(COORDINATES_DATA_FOLDER_PATH, file_name)
                            df = pd.read_csv(file_path)
                            # Optionally: You can filter or process the dataframe as required
                            file_found = True
                            break
                
                if file_found:
                    # Filter rows based on the coordinate range
                    row = df[
                        (df['MIN_LAT'] <= avg_lat) & (df['MAX_LAT'] >= avg_lat) &
                        (df['MIN_LON'] <= avg_lon) & (df['MAX_LON'] >= avg_lon)
                    ]
                    
                    # if row.empty:
                    #     return JsonResponse({"error": "No data found for the given coordinates"}, status=404)
                    
                    # Extract data from the row
                    row = row.iloc[0]  # Assuming there's only one row that matches
                    si_value = row['si']
                    # Prepare the response structure
                    response = {
                        "coordinates":{col: row[col] for col in coordinate_columns},
                        "ratios": {f'{col}/si': row[col] / si_value for col in ratio_columns if col != 'si'},  # No 'else' part, only divide if it's not 'si'
                        "rock_compositions": {col: row[col] for col in rock_composition_columns}
                    }
                try:
                    json_response = create_json_response_for_latlon(im_lat, im_lon, current_ratios, prev_ratios, file.name, flare, response["rock_compositions"])
                    print(json_response)
                    processed_data_response.append(json_response)
                except Exception as e:
                    print(str(e))
             
        except Exception as e:
            print(str(e))
            return JsonResponse({"error": f"Failed to process file '{file.name}'. Error: {str(e)}"})
        
    for grid in grids:
        file_name = os.path.join(element_folder_name,"48x48",str(grid[0] + (grid[1] * 48)) + '.png')
        map_instance.export_grid_png(grid[0], grid[1], file_name)
    
    map_instance.export_map_pkl(abundance_map_file)
    map_instance.export_coverage(coverage_map_file)
    
    def calculate_tile_indices(header_data):
        tile_indices = []
        existing_indices = set() 
        
        num_rows = 48
        
        for entry in header_data:
            lat_indices = []
            lon_indices = []
            
            for i in range(4):  # Iterate through the 4 sets of lat/lon
                lat = entry[f'v{i}_lat']
                lon = entry[f'v{i}_lon']
                
                # Calculate latIndex and lonIndex for each set
                lat_index = max(0, min(num_rows, int((90 - lat) / (180/num_rows))))
                lon_index = max(0, min(num_rows, int(((lon + 180 + 360) % 360) / (360/num_rows))))
                
                lat_indices.append(lat_index)
                lon_indices.append(lon_index)
            
            # Consolidate indices (e.g., average, majority, or other aggregation logic)
            # Here, taking the average to generate a single index
            consolidated_lat_index = int(sum(lat_indices) / len(lat_indices))
            consolidated_lon_index = int(sum(lon_indices) / len(lon_indices))
            final_index= num_rows*consolidated_lon_index + consolidated_lat_index
            # Append the single consolidated index for the entry
            if final_index not in existing_indices:
                tile_indices.append(final_index)
                existing_indices.add(final_index)
        
        return tile_indices


    # Call the function and store the result
    tile_indices = calculate_tile_indices(header_data)
    # print(tile_indices)
    # Check if any files are uploaded
    if not files:
        return JsonResponse({"error": "No .fits files uploaded."})

    
    # Directory where the map tiles are stored
    map_tiles_dir = os.path.join(TILES_FOLDER_PATH, element_folder_name, "48x48")
    
    # Check if the directory exists
    if not os.path.exists(map_tiles_dir):
        return JsonResponse({"error": "Map tiles directory not found."})

    # Generate the list of images as Base64 corresponding to the selected tile indices
    for tile_index in tile_indices:
        image_filename = f"{tile_index}.png"
        image_path = os.path.join(map_tiles_dir, image_filename)
        
        # Check if the image file exists
        if not os.path.exists(image_path):
            return JsonResponse({"error": f"Tile image '{image_filename}' not found in map_tiles directory."})
        
        # Open the image and encode it to base64
        with open(image_path, "rb") as img_file:
            encoded_image = base64.b64encode(img_file.read()).decode("utf-8")
        
        # Add the tile index and base64 image data to the response data
        image_response_data.append({
            "tileIndex": tile_index,
            "image": encoded_image,
        })
    response_data.append({
        "images":image_response_data,
        "data":processed_data_response
    })
    # Return the response data as JSON
    clear_folder_contents(TEMP_FITS_DIR)
    return JsonResponse(response_data, safe=False)


@csrf_exempt
def coordinate_data(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request type"}, status=400)
    
    try:
        # Parse the data from the request body
        data = json.loads(request.body)
        
        # Extract and validate latitude and longitude
        lat = data.get('lat')
        long = data.get('long')
        
        if lat is None or long is None:
            return JsonResponse({"error": "Latitude or Longitude not provided"}, status=400)
        
        try:
            lat = int(lat)
            long = int(long)
        except ValueError:
            return JsonResponse({"error": "Latitude and Longitude must be integers"}, status=400)
        
        print(f"Received coordinates: {lat}, {long}")
        
        coordinate_columns = ['MIN_LAT','MAX_LAT','MIN_LON','MAX_LON']
        ratio_columns = ['mg',	'ca',	'si',	'ti'	,'al'	,'fe']
        rock_composition_columns = ['rock_type',	'plagioclase',	'orthopyroxene',	'clinopyroxene',	'olivine']
        
        
        
        # Determine the file range based on lat and long
        # Assumption: the lat and long ranges are given in discrete steps, for example, 10 degrees
        file_found = False
        for file_name in os.listdir(COORDINATES_DATA_FOLDER_PATH):
            # Assuming the file is named as start_lat-end_lat-start_long-end_long.csv
            if file_name.endswith(".csv"):
                parts = file_name.replace('.csv', '').split('_')
                start_lat, end_lat, start_long, end_long = map(int, parts)
                
                # Check if the coordinates fall within the range of this file
                if start_lat <= lat <= end_lat and start_long <= long <= end_long:
                    # Read the corresponding CSV file using pandas
                    file_path = os.path.join(COORDINATES_DATA_FOLDER_PATH, file_name)
                    df = pd.read_csv(file_path)
                    # Optionally: You can filter or process the dataframe as required
                    file_found = True
                    break
        
        if file_found:
            # Filter rows based on the coordinate range
            row = df[
                (df['MIN_LAT'] <= lat) & (df['MAX_LAT'] >= lat) &
                (df['MIN_LON'] <= long) & (df['MAX_LON'] >= long)
            ]
            
            if row.empty:
                return JsonResponse({"error": "No data found for the given coordinates"}, status=404)
            
            # Extract data from the row
            row = row.iloc[0]  # Assuming there's only one row that matches
            si_value = row['si']
            # Prepare the response structure
            response = {
                "coordinates":{col: row[col] for col in coordinate_columns},
                "ratios": {f'{col}/si': row[col] / si_value for col in ratio_columns if col != 'si'},  # No 'else' part, only divide if it's not 'si'
                "rock_compositions": {col: row[col] for col in rock_composition_columns}
            }
            
            return JsonResponse(response, status=200)
        
        else:
            return JsonResponse({"error": "No file found for the given coordinates"}, status=404)

    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

@csrf_exempt
def get_scale_values(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request type"}, status=400)
    
    try:
        # Parse the data from the request body
        data = json.loads(request.body)
        element = data.get('element')
        mapType = data.get('mapType')
        # print(element, mapType)
        df = pd.read_csv(SCALING_FACTOR_FILE)
        
        if(mapType=="inferno"):
            file_name = f'{element}.pkl'
        else:
            file_name = f'{element}_{mapType}.pkl'
            
        
        # Find the row where the 'element' column matches the provided value
        row = df.loc[df['Filename'] == file_name]
        
        if row.empty:
            return JsonResponse({"error": f"No data found for element: {element}"}, status=404)
        
        # Extract Min Value and Max Value
        min_value = row['Min Value'].values[0]
        max_value = row['Max Value'].values[0]
        
        return JsonResponse({"min": min_value, "max": max_value}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
def store_logs(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request type"}, status=400)
    try:
        data = json.loads(request.body)
        login_data = data.get("loginData")
        
        with open(LOGS_FILE_PATH, 'a') as f:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_entry = (
                f"\n[{timestamp}]\n"
                f"IP: {login_data.get('ipAddress', 'Unknown')}\n"
                f"User Agent: {login_data.get('userAgent', 'Unknown')}\n"
                f"Login Time: {login_data.get('timeOfLogin', 'Unknown')}\n"
                f"Location Data: {json.dumps(login_data.get('location', {}), indent=2)}\n"
                f"{'-' * 50}\n"
            )
            f.write(log_entry)
            
        return JsonResponse({"message": "success"}, status=200)
        
    except Exception as e:
        print(f"Error storing logs: {str(e)}")
        return JsonResponse({"error": "some error occured"}, status=500)
    
@csrf_exempt
def change_scraping_status(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request type"}, status=400)
    
    try:
        incoming_data = json.loads(request.body)

        if os.path.exists(SCRAPING_CONTROLLER):
            with open(SCRAPING_CONTROLLER, "r") as file:
                existing_data = json.load(file)
        else:
            existing_data = {}

        for key, value in incoming_data.items():
            if value != "":
                existing_data[key] = value

        with open(SCRAPING_CONTROLLER, "w") as file:
            json.dump(existing_data, file, indent=4)
        
        return JsonResponse({"message": "Scraping status updated successfully!"}, status=200)
    
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    
@csrf_exempt
def home_view(request):
    return JsonResponse({"message":"Server running"}, status =200)