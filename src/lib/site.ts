// Central SEO / site configuration.
// Set NEXT_PUBLIC_SITE_URL to your final domain (e.g. https://eor.yourname.com).
// On Vercel, the production URL is picked up automatically if it is not set.
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

export const SITE = {
  url: resolveSiteUrl(),
  name: 'Niger Delta EOR Lab',
  shortName: 'EOR Lab',
  title: 'Niger Delta EOR Lab — Hot Chemical Heavy-Oil Recovery',
  description:
    'Interactive 3D research on hot chemical EOR for Niger Delta heavy oil: 97.9 % recovery at 80 °C, matching steam with ~8× less heat.',
  author: {
    name: 'Paul Obinna Madu',
    url: 'https://github.com/paulphysio',
    affiliation: 'Federal University of Technology, Owerri (FUTO)',
  },
  team: ['Chimezie Michael', 'Onodu Fidelia', 'Mmadu Daniel', 'Eyinnaya Pedro'],
  supervisor: 'Engr. J. E. Odo',
  repo: 'https://github.com/paulphysio/niger-delta-eor-proxy-model',
  publication: 'https://www.researchgate.net/publication/410889149',
  keywords: [
    'enhanced oil recovery', 'EOR', 'heavy oil recovery', 'Niger Delta', 'Nigeria heavy oil',
    'thermal-chemical EOR', 'hot chemical flooding', 'hybrid EOR', 'steam flooding', 'steam flood simulator',
    'xanthan gum polymer flooding', 'palm frond ash alkali', 'alkali polymer flooding', 'core flooding experiment',
    'reservoir simulation', 'Eclipse simulation', 'proxy model', 'machine learning reservoir proxy', 'surrogate model',
    '3D reservoir visualisation', 'petroleum engineering', 'mobility ratio', 'capillary number', 'oil viscosity temperature',
    'FUTO petroleum engineering', 'Paul Madu', 'Paul Obinna Madu',
  ],
  themeColor: '#04070d',
}

export const ROUTES = [
  { path: '/', label: 'Overview', id: 'overview' },
  { path: '/simulator', label: '3D Simulator', id: 'simulator' },
  { path: '/laboratory', label: 'Laboratory', id: 'laboratory' },
  { path: '/science', label: 'Science', id: 'science' },
  { path: '/methods', label: 'Methods', id: 'model' },
] as const

/** Maps legacy section ids (and old #hash links) to routes. */
export const pathFor = (id: string) => ROUTES.find(r => r.id === id || r.path.slice(1) === id)?.path ?? '/'
