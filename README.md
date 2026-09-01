# Niger Delta Heavy Oil — EOR 3D Simulator

Interactive 3D steam flooding EOR simulator built with Next.js, Three.js, and a Gradient Boosting ML proxy model trained on 150 Eclipse reservoir simulation runs.

## Live Demo
Deploy to Vercel instantly — see below.

## Features

- **3D Reservoir Visualisation** — Full WebGL Three.js scene with animated wells, steam plume, particle flow, water front, and oil saturation colour mapping
- **ML Proxy Model** — Gradient Boosting surrogate trained on real Eclipse simulation data (150 runs, 17 parameters)
- **Real-time Prediction** — COP, CWP, Recovery Factor, Water Cut, Steam Efficiency update instantly as you adjust sliders
- **Production History Chart** — Recharts line chart tracking simulation history
- **3 Presets** — Thesis base case (80°C hot chemical), proxy model optimum, steam-only baseline
- **Drag to orbit** — Mouse/touch controlled 3D camera

## Research Background

This simulator is based on:

**Published Research:** [Enhancing Heavy Oil Recovery in the Niger Delta through Thermal-Chemical Methods: An Experimental Approach](https://www.researchgate.net/publication/410889149)

**ML Proxy Model Repository:** [github.com/paulphysio/niger-delta-eor-proxy-model](https://github.com/paulphysio/niger-delta-eor-proxy-model)

### Key Finding
Hot chemical flooding (steam + novel surfactant-polymer mixture) outperformed steam flooding alone at **80°C** — demonstrating energy-efficient heavy oil recovery for Niger Delta reservoirs (API gravity 17–19, 20% porosity).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) for automatic deployment.

## The 17 Simulation Parameters

| Parameter | Description | Range |
|-----------|-------------|-------|
| X1–X4 | Producer bottom hole pressures | 500–4000 psi |
| X5 | Injection rate | 100–800 BBL/day |
| X6 | Steam quality | 0.1–1.0 fraction |
| X7 | Injection temperature | 60–120 °C |
| X8–X9 | Injector grid location (i, j) | 1–10 |
| X10–X17 | Producer grid locations | 1–10 |

## Author

**Paul Madu**  
B.Eng Petroleum Engineering — FUTO, 2024 (Second Class Upper, CGPA 3.74)  
NYSC Completed 2025  
madupaul.20181131453@futo.edu.ng  
[github.com/paulphysio](https://github.com/paulphysio)
