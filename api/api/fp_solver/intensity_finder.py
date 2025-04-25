import numpy as np
from astropy.io import fits
from scipy.optimize import curve_fit
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
import os
from .preprocessing import clean_signal

class XRFSpectrumAnalyzer:
    def __init__(self):
        """Initialize the XRF spectrum analyzer with characteristic line energies"""
        # Updated spectrum parameters for 2048 channels
        self.n_channels = 2048
        self.kev_per_channel = 0.0135  # KeV per channel
        
        # Create energy scale
        self.energies = np.arange(self.n_channels) * self.kev_per_channel
        
        # Dictionary of characteristic XRF line energies (in keV)
        self.characteristic_lines = {
            'O':  {'Ka': 0.525},
            'Na': {'Ka': 1.041},
            'Mg': {'Ka': 1.254},
            'Al': {'Ka': 1.487},
            'Si': {'Ka': 1.740},
            'P':  {'Ka': 2.014},
            'S':  {'Ka': 2.308},
            'K':  {'Ka': 3.314},
            'Ca': {'Ka': 3.692},
            'Ti': {'Ka': 4.511, 'Kb': 4.932},
            'Cr': {'Ka': 5.415, 'Kb': 5.947},
            'Mn': {'Ka': 5.899, 'Kb': 6.490},
            'Fe': {'Ka': 6.404, 'Kb': 7.058}
        }

    def load_fits_spectrum(self, fits_file: str) -> np.ndarray:
        """
        Load spectrum data from a FITS file
        
        Args:
            fits_file: Path to the FITS file
            
        Returns:
            Array of counts
        """
        try:
            with fits.open(fits_file) as hdul:
                # Get data from the first extension (HDU[1])
                data = hdul[1].data
                
                if data is None:
                    raise ValueError(f"No data found in FITS file extension: {fits_file}")
                
                # Extract COUNTS column
                if 'COUNTS' not in data.dtype.names:
                    raise ValueError(f"No COUNTS column found in FITS file: {fits_file}")
                
                counts = np.array(data['COUNTS'], dtype=np.float64)
                
                if len(counts) == 1024:
                    counts = np.concatenate((counts, [0] * 1024))
                # Verify number of channels
                if len(counts) != self.n_channels:
                    raise ValueError(
                        f"Expected {self.n_channels} channels, got {len(counts)} "
                        f"in file: {fits_file}"
                    )
                
                return counts
                
        except Exception as e:
            raise IOError(f"Error reading FITS file {fits_file}: {str(e)}")

    def load_pha_spectrum(self, pha_file: str) -> np.ndarray:
        """
        Load spectrum data from a PHA file
        
        Args:
            pha_file: Path to the PHA file
            
        Returns:
            Array of counts
        """
        try:
            with fits.open(pha_file) as hdul:
                data = hdul[1].data  # Changed to HDU[1]
                
                if data is None:
                    raise ValueError(f"No data found in PHA file extension: {pha_file}")
                
                # Extract COUNTS column
                if 'COUNTS' not in data.dtype.names:
                    raise ValueError(f"No COUNTS column found in PHA file: {pha_file}")
                
                counts = np.array(data['COUNTS'], dtype=np.float64)
                
                # Verify number of channels
                if len(counts) != self.n_channels:
                    raise ValueError(
                        f"Expected {self.n_channels} channels, got {len(counts)} "
                        f"in file: {pha_file}"
                    )
                
                return counts
                
        except Exception as e:
            raise IOError(f"Error reading PHA file {pha_file}: {str(e)}")
    
    def load_spectrum(self, file_path: str) -> np.ndarray:
        """
        Load spectrum data from either FITS or PHA file
        
        Args:
            file_path: Path to the spectrum file
            
        Returns:
            Array of counts
        """
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pha':
            return self.load_pha_spectrum(file_path)
        elif file_ext in ['.fits', '.fit']:
            return self.load_fits_spectrum(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
    
    def subtract_background(self, 
                          sample_counts: np.ndarray, 
                          background_counts: np.ndarray,
                          scaling_factor: float = 0.1) -> np.ndarray:
        """
        Subtract background spectrum from sample spectrum
        
        Args:
            sample_counts: Sample spectrum counts
            background_counts: Background spectrum counts
            scaling_factor: Factor to scale background before subtraction
            
        Returns:
            Background-subtracted spectrum
        """
        # Verify array lengths
        if len(sample_counts) != self.n_channels or len(background_counts) != self.n_channels:
            raise ValueError("Sample and background must have same length")
        
        # Subtract scaled background and ensure no negative values
        return np.maximum(sample_counts - scaling_factor * background_counts, 0)
    
    def gaussian(self, x: np.ndarray, amplitude: float, center: float, sigma: float) -> np.ndarray:
        """Gaussian function for peak fitting"""
        return amplitude * np.exp(-(x - center)**2 / (2 * sigma**2))
    
    def fit_peak(self, 
                counts: np.ndarray, 
                line_energy: float,
                fit_window: float = 0.10) -> Tuple[float, float, float]:
        """
        Fit a Gaussian to a spectral peak
        
        Args:
            counts: Count values
            line_energy: Expected line energy in keV
            fit_window: Energy window around peak for fitting in keV
            
        Returns:
            Tuple of (amplitude, center, sigma) for fitted Gaussian
        """
        # Convert energy to channel numbers
        center_channel = int(line_energy / self.kev_per_channel)
        window_channels = int(fit_window / self.kev_per_channel)
        
        # Select data within fitting window
        start_channel = max(0, center_channel - window_channels)
        end_channel = min(self.n_channels, center_channel + window_channels)
        
        x_fit = self.energies[start_channel:end_channel]
        y_fit = counts[start_channel:end_channel]
        
        if len(x_fit) < 3:
            raise ValueError(f"Too few points for fitting around {line_energy} keV")
        
        # Initial parameter guesses
        p0 = [
            np.max(y_fit),                    # amplitude
            line_energy,                      # center
            fit_window/5                      # sigma
        ]
        
        try:
            popt, pcov = curve_fit(self.gaussian, x_fit, y_fit, p0=p0)
            perr = np.sqrt(np.diag(pcov))
            uncertanity = (abs(perr[0]/popt[0]) + abs(perr[2]/popt[2]))
            # if sigma is too large, return 0 as amplitude
            if popt[2] > 0.15:
                return (0, line_energy, fit_window/5, 0)
            if popt[0] == 0:
                return (0, 0, 0, 0)
            return (popt[0], popt[1], popt[2], uncertanity)
        except RuntimeError:
            # print(f"Warning: Failed to fit peak at {line_energy} keV")
            return (0, line_energy, fit_window/5, 0)
    
    def calculate_peak_intensity(self, amplitude: float, sigma: float) -> float:
        """Calculate peak intensity (area under Gaussian)"""
        return amplitude * sigma * np.sqrt(2 * np.pi)
    
    def analyze_spectrum(self, 
                        sample_file: str, 
                        background_file: r'scripts\fp_solver\ch2_cla_l1_20230902T064630474_20230902T064638474_BKG.pha',
                        use_background: bool = True,
                        use_y: bool = False,
                        y_file: np.ndarray = None,
                        bg_scaling_factor: float = 0.1,
                        plot_results: bool = False,
                        verbose: int = 1) -> Dict[str, float]:
        """
        Analyze XRF spectrum and extract element intensities
        
        Args:
            sample_file: Path to sample spectrum file
            background_file: Path to background spectrum file
            bg_scaling_factor: Factor to scale background before subtraction
            plot_results: Whether to plot fitting results
            
        Returns:
            Dictionary of element intensities
        """
        # Load spectra
        if use_y:
            sample_counts = y_file
        else:
            sample_counts = self.load_spectrum(sample_file)
        sample_counts = clean_signal(sample_counts)
        if use_background:
            background_counts = self.load_spectrum(background_file)
            background_counts = clean_signal(background_counts)
        
            # Subtract background
            net_counts = self.subtract_background(
                sample_counts, 
                background_counts,
                scaling_factor=bg_scaling_factor
            )
        else:
            net_counts = sample_counts
        
        # Dictionary to store results
        intensities = {}
        uncertanities = {}
        
        if plot_results:
            plt.figure(figsize=(15, 8))
            plt.plot(self.energies, net_counts, 'b-', label='Net spectrum')
            plt.xlim(0, 10)  # Limit plot to 0-10 keV range
            # plt.plot(self.energies, background_counts * bg_scaling_factor, 
            #         'r--', alpha=0.5, label='Scaled background')
        
        # Fit peaks for each element
        for element, lines in self.characteristic_lines.items():
            element_intensity = 0
            element_uncertanity = 0
            
            for line_type, energy in lines.items():
                try:
                    amplitude, center, sigma, uncertanity = self.fit_peak(net_counts, energy)
                    intensity = self.calculate_peak_intensity(amplitude, sigma)
                    element_intensity += intensity
                    element_uncertanity += uncertanity
                    
                    if plot_results:
                        x_plot = np.linspace(center - 3*sigma, center + 3*sigma, 100)
                        plt.plot(x_plot, self.gaussian(x_plot, amplitude, center, sigma),
                               '--', label=f'{element} {line_type}')
                
                except ValueError as e:
                    print(f"Warning: {e}")
                    continue
            if element_intensity > 0:
                intensities[element] = element_intensity
            else:
                intensities[element] = 0
            uncertanities[element] = element_uncertanity
        
        if plot_results:
            plt.xlabel('Energy (keV)')
            plt.ylabel('Counts')
            plt.title('XRF Spectrum Analysis')
            plt.legend()
            plt.grid(True)
            plt.show()
        
        return intensities, uncertanities

# Example usage:
if __name__ == "__main__":
    analyzer = XRFSpectrumAnalyzer()
    
    # Example usage (replace with actual file paths)
    intensities = analyzer.analyze_spectrum(
        r'scripts\fp_solver\ch2_cla_l1_20240221T230106660_20240221T230114659.fits',
        r'scripts\fp_solver\ch2_cla_l1_20230902T064630474_20230902T064638474_BKG.pha',
        bg_scaling_factor=0.1,
        plot_results=True
    )
    
    print("\nCalculated intensities:")
    for element, intensity in intensities.items():
        print(f"{element}: {intensity:.2f}")