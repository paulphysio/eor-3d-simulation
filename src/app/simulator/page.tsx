import Simulator from '../../components/sections/Simulator'
import { pageMeta } from '../../lib/seo'

export const metadata = pageMeta(
  '/simulator',
  "3D Steam-Flood Reservoir Simulator",
  "Run a real-time 3D steam-flood simulation of a Niger Delta heavy-oil reservoir, driven by a proxy model trained on 150 Eclipse runs.",
)

export default function SimulatorPage() {
  return <Simulator />
}
