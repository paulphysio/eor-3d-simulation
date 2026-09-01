# Niger Delta EOR Simulator - User Guide

## Overview

The Niger Delta EOR Simulator is an interactive 3D simulation tool for Enhanced Oil Recovery (EOR) using steam flooding methods. It uses a Machine Learning proxy model trained on 150 Eclipse reservoir simulation runs to provide instant predictions of oil recovery performance.

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Interface Overview

### Main Components

1. **Header** - Displays app information and links to research
2. **Control Panel** (Left) - Sliders for adjusting simulation parameters
3. **3D Viewer** (Center) - Interactive 3D visualization of the reservoir
4. **Metrics Panel** (Bottom) - Real-time performance metrics
5. **Production Chart** (Bottom) - Historical production data
6. **About Panel** (Right) - Model information and statistics

## Controls & Navigation

### 3D Scene Navigation

**Mouse/Touch:**
- **Drag** to rotate the view
- **Scroll** to zoom in/out
- **Pinch** (touch) to zoom

**Keyboard:**
- **WASD** or **Arrow Keys** - Navigate around the scene
- **R** - Reset camera to default position
- **+/-** - Zoom in/out

### Parameter Controls

The simulator has 11 adjustable parameters organized into categories:

#### Injection Parameters
- **Steam Quality** (0.1 - 1.0): Fraction of steam in the injection fluid
- **Temperature** (60 - 120°C): Injection temperature
- **Injection Rate** (100 - 800 BBL/day): Fluid injection rate

#### Producer BHP (Bottom Hole Pressure)
- **Producer 1-4 BHP** (500 - 4000 psi): Pressure at each production well

#### Well Locations
- **Injector i/j-pos** (1 - 10): Grid position of injection well
- **Producer locations**: Grid positions of production wells

### Presets

Three built-in presets for quick comparison:

1. **🧪 Thesis Base (80°C hot chemical)** - Default parameters from research
2. **✨ Proxy Model Optimum** - ML-optimized parameters
3. **💨 Steam-Only Baseline** - Pure steam injection for comparison

### Saved Scenarios

You can save and load custom scenarios:

- **Save Current Scenario** - Save your current parameter set with a custom name
- **Load Scenario** - Restore a previously saved scenario
- **Delete Scenario** - Remove a saved scenario

Scenarios are stored in your browser's localStorage.

## Export Features

### CSV Export

Click the **📥 Export CSV** button to download simulation history as a CSV file containing:
- Step number
- Cumulative Oil Production (COP)
- Cumulative Water Production (CWP)

### Screenshot

Click the **📷** button in the 3D viewer to capture a screenshot of the current 3D scene as a PNG file.

## Understanding the Metrics

### Key Performance Indicators

1. **COP (Cumulative Oil Production)** - Total oil produced in ×10³ barrels
2. **CWP (Cumulative Water Production)** - Total water produced in ×10³ barrels
3. **Recovery Factor (%)** - Percentage of oil recovered vs total fluids
4. **Water Cut (%)** - Percentage of water in total production
5. **Steam Efficiency** - Oil produced per unit of steam input
6. **GOR Equivalent** - Water-to-oil ratio

### 3D Visualization Elements

- **Orange/Brown cells** - Oil-saturated reservoir regions
- **Blue cells** - Water-invaded regions
- **Orange well** - Steam injection well
- **Blue wells** - Oil production wells
- **White particles** - Steam/chemical flow
- **Blue plane** - Water front propagation
- **Cone** - Steam plume visualization

## Model Information

### Technical Details

- **Model Type**: Gradient Boosting ML Proxy
- **Training Data**: 150 Eclipse reservoir simulation runs
- **Parameters**: 17 input variables
- **Target Reservoir**: Niger Delta heavy oil (API gravity 17–19, 20% porosity)
- **Validation R²**: 0.60

### Key Research Finding

Hot chemical flooding at 80°C outperforms steam flooding alone, demonstrating energy-efficient heavy oil recovery for Niger Delta reservoirs.

## Tips for Best Results

1. **Start with presets** - Use built-in presets as starting points
2. **Adjust one parameter at a time** - Understand individual parameter effects
3. **Monitor recovery factor** - Aim for higher recovery percentages
4. **Watch water cut** - Lower water cut indicates more efficient oil recovery
5. **Save interesting scenarios** - Build a library of effective configurations
6. **Export data for analysis** - Use CSV exports for further analysis

## Troubleshooting

### Performance Issues

- Close other browser tabs
- Reduce browser hardware acceleration if needed
- Use a modern browser (Chrome, Firefox, Safari)

### 3D View Not Loading

- Ensure WebGL is enabled in your browser
- Check browser console for error messages
- Try refreshing the page

### Saved Scenarios Not Appearing

- Check that localStorage is enabled in your browser
- Clear browser cache and try again
- Ensure you're using the same browser/domain

## Advanced Usage

### Parameter Optimization

To find optimal parameters:
1. Start with the "Proxy Model Optimum" preset
2. Fine-tune injection parameters (steam quality, temperature, rate)
3. Adjust producer BHPs to optimize drawdown
4. Monitor recovery factor and steam efficiency
5. Save successful configurations

### Comparative Analysis

1. Save a baseline scenario
2. Adjust parameters systematically
3. Compare metrics against baseline
4. Export CSV data for detailed analysis
5. Use screenshots for documentation

## Keyboard Shortcuts Summary

- **W/↑** - Pitch up
- **S/↓** - Pitch down  
- **A/←** - Rotate left
- **D/→** - Rotate right
- **+** - Zoom in
- **-** - Zoom out
- **R** - Reset view

## Research Context

This simulator is based on published research:
- **Paper**: "Enhancing Heavy Oil Recovery in the Niger Delta through Thermal-Chemical Methods: An Experimental Approach"
- **Author**: Paul Madu, B.Eng Petroleum Engineering, FUTO 2024
- **ML Model**: Available at [github.com/paulphysio/niger-delta-eor-proxy-model](https://github.com/paulphysio/niger-delta-eor-proxy-model)

## Support & Resources

- **GitHub Issues**: Report bugs and request features
- **ResearchGate**: Access the underlying research paper
- **Documentation**: Check inline code documentation for technical details

## Version History

- **v1.0** - Initial release with ML proxy model, 3D visualization, and basic controls
- **v1.1** - Added scenario save/load, CSV export, screenshot capture, keyboard navigation, and performance optimizations

---

*Last updated: September 2026*
