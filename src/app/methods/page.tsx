import Model from '../../components/sections/Model'
import { pageMeta } from '../../lib/seo'

export const metadata = pageMeta(
  '/methods',
  "Methods & Proxy Model Card",
  "How the Niger Delta EOR proxy was built from 150 Eclipse simulations: inputs, statistics, limitations, master’s roadmap and citation.",
)

export default function MethodsPage() {
  return <Model />
}
