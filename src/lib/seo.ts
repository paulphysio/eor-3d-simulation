import type { Metadata } from 'next'
import { SITE } from './site'

/** Per-route metadata: own title, description, canonical URL and social card text. */
export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', url: path, siteName: SITE.name, title: `${title} · ${SITE.name}`, description, images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE.name} — ${title}` }] },
    twitter: { card: 'summary_large_image', title: `${title} · ${SITE.name}`, description, images: ['/og.png'] },
  }
}
