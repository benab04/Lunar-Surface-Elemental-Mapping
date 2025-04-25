# Moon Visualization Application

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Key Components](#key-components)
- [Rendering Pipeline](#rendering-pipeline)
- [State Management](#state-management)
- [Interactive Features](#interactive-features)
- [Advanced Features](#advanced-features)
- [Setup and Dependencies](#setup-and-dependencies)
- [Performance Optimizations](#performance-optimizations)

## Overview

This application is a 3D visualization system for lunar data analysis, built using React and Three.js. It features a wide array of features, including static rendering of map plots, dynamic and interactive mapping of various elements and a live mode where data is fetched from the pradan website periodically and processed to update the maps. It provides a detailed overview of the chemical composition at various places on the moon and includes important landing sites and craters. Different camera views including the point of view of Chandrayaan - 2 is also simulated in this application.

## Core Features

1. **3D Moon Rendering**

   - Creates a high resolution 3D map of the lunar surface with normal maps to show the elevations on the surface.
   - An interactive moon where the user can move and zoom into different places is built.
   - Physically-based rendering (PBR) materials
   - The geometry is adjusted such the oblateness of the moon is accounted.
   - Dynamic lighthing systems to simulate various phases of the moon and also an ambient mode is included.

2. **Dynamic Data Visualization**

   - Chemical composition overlays (Al, Ca, Fe, etc.) and uncertainty maps are rendered
   - Tile-based rendering system is followed at different zoom levels to improve performance
   - Real-time data processing is possible by live fetching from the pradan website and updating the concerned tiles periodically

3. **Interactive Navigation**

   - Orbital camera controls
   - Satellite view simulation
   - A set of coordinates can be given which animates it to that area and displays the element and rock composition.
   - Landmark identification system

4. **Analysis Tools**
   - Chemical composition analysis
   - Real-time coordinate tracking is possible upon hovering over the moon.
   - A Control panel is used to switch the live fetching on and off

## Technical Architecture

### Rendering System

The application uses a multi-layered rendering approach:

1. **Base Layer**

   - Uses `THREE.SphereGeometry` with custom UV mapping
   - Handles oblate spheroid deformation
   - Different layers are placed on each other to show the highlighted areas and the elemental maps.

2. **Overlay System**

   - Dynamic texture loading based on selected chemical elements
   - Custom shader implementation for blending
   - Tile-based rendering for optimized performance at high zoom levels.

3. **Dynamic Mesh System**
   - Canvas-based texture generation for dynamic interactive mapping
   - Real-time texture updates in Live Mode.
   - Memory-efficient tile management and proper cleanups to optimize performance

### Component Hierarchy

## Key Components

### Moon Component (Core)

- Manages the main Three.js scene
- Handles camera systems and controls
- Coordinates all sub-components
- Manages state and data flow

### Interactive Sidebars

1. **Landmark Sidebar**

   - Displays the landmark coordinates, description and the elemental composition at those regions.

2. **Overlay System**

   - Handles chemical composition maps
   - Dynamic texture loading
   - Blend mode management

### Navigation System

1. **Camera Controls**

   - Orbital controls implementation
   - Smooth transitions
   - Multiple camera modes (Main/Satellite)

2. **Coordinate System**

   - World space to lat/long conversion and its use in mapping tiles
   - Coordinate tracking

## State Management

### Core State

- Uses React's useState and useRef for state management
- Implements custom state synchronization for Three.js objects
- Manages multiple render modes and states

## Interactive Features

### Landmark System

- Interactive pins on the lunar surface
- Tooltip system for information display
- Smooth camera transitions to points of interest

### Data Visualization

- Real-time chemical composition display
- Dynamic color mapping
- Interactive data analysis tools

## Advanced Features

### Tile-Based Rendering

- Dynamic tile loading based on camera position
- Memory management for loaded tiles
- Optimized texture updates

### Satellite System

- Simulated satellite orbit
- Custom camera perspective
- Real-time data processing

## Performance Optimizations

### Required Dependencies

- Three.js for 3D rendering
- React for UI components
- Various utility libraries for data processing

All the required packages are mentioned in the

### Environment Setup

- Go to the root directory and type the following to install all packages at once

```bash
npm install
```

- The maun packages used are

```bash
npm install three @react-three/fiber @react-three/drei
```

### Configuration

- Environment variables for API endpoints
- Texture path configurations
- Performance settings

## Usage Notes

1. **Initialization**

   ```javascript
   const moon = new Moon({
     // configuration options
   });
   ```

2. **Data Loading**

   ```javascript
   moon.loadChemicalData("element-name");
   ```

3. **Navigation**
   ```javascript
   moon.navigateToCoordinates(lat, long);
   ```

## Contributing Guidelines

1. Code Style

   - Follow existing patterns
   - Use TypeScript for new features
   - Document complex algorithms

2. Testing

   - Unit tests for utilities
   - Integration tests for components
   - Performance benchmarks

3. Performance Considerations
   - Monitor memory usage
   - Optimize render calls
   - Profile heavy operations

---

This application represents a complex system for lunar data visualization and analysis. It combines advanced 3D rendering techniques with real-time data processing capabilities, providing a powerful tool for lunar surface analysis and research.
