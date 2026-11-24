import Science from '../../components/sections/Science'
import { pageMeta } from '../../lib/seo'

export const metadata = pageMeta(
  '/science',
  "EOR Physics, Interactively",
  "Why hot chemical EOR works: heavy-oil viscosity vs temperature, mobility ratio and fingering, and capillary number, as interactive explainers.",
)

export default function SciencePage() {
  return <Science />
}
