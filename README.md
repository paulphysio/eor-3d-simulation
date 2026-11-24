# Niger Delta EOR Lab

An interactive 3D research platform for **thermal–chemical (hot chemical) enhanced oil recovery** of Niger Delta heavy oil. It brings together laboratory core-flood evidence, the governing physics, and an Eclipse-trained proxy simulator.

> Based on *Enhancing Heavy Oil Recovery in the Niger Delta through Thermal-Chemical Methods: An Experimental Approach* — P. O. Madu, M. Chimezie, F. Onodu, D. Mmadu, P. Eyinnaya (B.Eng, FUTO, 2024). Supervisor: Engr. J. E. Odo.

## Key finding

A locally sourced **xanthan-gum flood at 80 °C recovered 97.89 % of OOIP**. That matches a 120 °C, 60 %-quality steam flood (97.97 %) while needing **~8× less heat per kg injected**.

## Sections

| Section | What it shows |
|---|---|
| **Overview** | Animated 3D reservoir hero, the research in four steps, the recovery-vs-heat key-finding chart and the research workflow. |
| **3D Simulator** | 10 × 10 × 3 five-spot steam flood with stratigraphy (Benin, Agbada, cap rock, reservoir, Akata). It has voxel fields for oil saturation, temperature and viscosity, a growing steam chamber, flow particles, animated pumpjacks and a steam-generator facility. Also includes cutaway, X-ray, lift-overburden, layer filter, camera presets, a timeline, cell inspection, live KPIs, a production profile, a tornado sensitivity chart, a 2-D response map, strategy comparison, CSV and PNG export, and saved scenarios. |
| **Laboratory** | 3D core-flood rig replaying all seven floods (Tables 4.16–4.19). The front's fingering is driven by the mobility ratio of the measured fluids. Includes recovery and heat-demand charts and the petrophysics and fluid-property tables. |
| **Science** | Interactive explainers: viscosity vs temperature (Beggs–Robinson calibrated to 438 cP @ 29 °C), mobility ratio with an animated displacement front, capillary number with a desaturation curve, recovery stages and the EOR taxonomy. |
| **Methods** | Proxy model card (X1–X17, ensemble statistics, CV R²), limitations, a proposed master's research programme, target fields, team and citation. |

Keyboard (simulator): `Space` play/pause · `1–4` camera views · `X` X-ray · `E` lift overburden · `L` labels.

## What is measured vs derived

- **Measured** (thesis Ch. 4): core petrophysics, crude and chemical fluid properties, all seven flood recoveries, steam properties. See `src/lib/labData.ts`.
- **Derived** (`src/lib/physics.ts`): viscosity–temperature curve, specific heat demand, mobility ratio, field heat-injection rate. Each derivation states its assumptions in the UI.
- **Proxy** (`src/lib/proxyModel.ts`): polynomial response surface reproducing the 150-run Eclipse ensemble statistics and Random-Forest feature ranking. Outputs are cumulative oil (COP) and water (CWP); predictions past the training range are flagged.
- **Illustrative** (`src/lib/fieldModel.ts`): the 3D saturation and temperature fields and the time profiles. These are scaled to the proxy totals and labelled as such in the app.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Stack: Next.js 14 · React Three Fiber / drei / postprocessing · Framer Motion · Recharts · Tailwind.

## SEO & sharing

- Each section is its own URL (`/`, `/simulator`, `/laboratory`, `/science`, `/methods`) with a unique title, description, canonical URL and social card. Old `/#section` links redirect automatically.
- `robots.txt`, `sitemap.xml` and a web-app manifest are generated from `src/lib/site.ts`.
- Structured data (JSON-LD) describes the site, the author, the web app, the thesis (`ScholarlyArticle`) and the lab measurements (`Dataset`, eligible for Google Dataset Search).
- Icons: `favicon.ico` (16/32/48), `icon.svg`, Apple touch icon, PWA and maskable icons; social preview `og.png` (1200×630).
- Set `NEXT_PUBLIC_SITE_URL` if you use a custom domain. Optional `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` add the ownership meta tags. See `.env.example`.
