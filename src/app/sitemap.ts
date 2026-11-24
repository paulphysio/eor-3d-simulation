import type { MetadataRoute } from 'next'
import { SITE, ROUTES } from '../lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return ROUTES.map(r => ({
    url: `${SITE.url}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: r.path === '/' ? 1 : r.path === '/simulator' || r.path === '/laboratory' ? 0.9 : 0.7,
  }))
}
