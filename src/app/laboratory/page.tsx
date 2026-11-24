import Laboratory from '../../components/sections/Laboratory'
import { pageMeta } from '../../lib/seo'

export const metadata = pageMeta(
  '/laboratory',
  "Hot Chemical Core-Flood Experiments",
  "Seven core floods on Niger Delta heavy crude: xanthan gum at 80 °C recovered 97.9 % of oil in place, matching steam. Replay each flood in 3D.",
)

export default function LaboratoryPage() {
  return <Laboratory />
}
