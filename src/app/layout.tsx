import type { Metadata, Viewport } from 'next'
import './globals.css'
import SiteShell from '../components/SiteShell'
import { SITE } from '../lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: SITE.keywords,
  authors: [{ name: SITE.author.name, url: SITE.author.url }],
  creator: SITE.author.name,
  publisher: SITE.author.name,
  category: 'science',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: 'en_GB',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '3D reservoir model of a Niger Delta steam-flood five-spot with the headline: 97.9 % recovery at 80 °C' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
}

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

const person = {
  '@type': 'Person',
  '@id': `${SITE.url}/#author`,
  name: SITE.author.name,
  url: SITE.author.url,
  sameAs: [SITE.author.url],
  jobTitle: 'Petroleum Engineer',
  affiliation: { '@type': 'CollegeOrUniversity', name: SITE.author.affiliation },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: 'en',
      author: { '@id': `${SITE.url}/#author` },
    },
    person,
    {
      '@type': 'WebApplication',
      '@id': `${SITE.url}/#app`,
      name: `${SITE.name} — 3D EOR Simulator`,
      url: `${SITE.url}/simulator`,
      applicationCategory: 'EducationalApplication',
      applicationSubCategory: 'Reservoir simulation',
      operatingSystem: 'Any (web browser with WebGL)',
      browserRequirements: 'Requires WebGL',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@id': `${SITE.url}/#author` },
      description: 'Real-time 3D steam-flood simulator driven by a proxy model trained on 150 Eclipse thermal reservoir simulations of Niger Delta heavy oil.',
    },
    {
      '@type': 'ScholarlyArticle',
      '@id': `${SITE.url}/#thesis`,
      headline: 'Enhancing Heavy Oil Recovery in the Niger Delta through Thermal-Chemical Methods: An Experimental Approach',
      datePublished: '2024-07',
      inLanguage: 'en',
      url: SITE.publication,
      author: [{ '@id': `${SITE.url}/#author` }, ...SITE.team.map(name => ({ '@type': 'Person', name }))],
      contributor: { '@type': 'Person', name: SITE.supervisor, description: 'Project supervisor' },
      sourceOrganization: { '@type': 'CollegeOrUniversity', name: SITE.author.affiliation },
      about: ['Enhanced oil recovery', 'Heavy oil', 'Thermal-chemical flooding', 'Niger Delta'],
      abstract: 'Hot chemical (thermal–chemical hybrid) EOR using locally sourced palm-frond-ash alkali and xanthan-gum polymer was tested on 16.79 °API Niger Delta crude in core floods at 50 °C and 80 °C and compared with hot water and steam. Xanthan gum at 80 °C recovered 97.89 % of OOIP, comparable to steam at 120 °C (97.97 %) at a fraction of the heat input.',
    },
    {
      '@type': 'Dataset',
      '@id': `${SITE.url}/#dataset`,
      name: 'Niger Delta heavy-oil thermal–chemical core-flood dataset',
      description: 'Laboratory measurements from seven tertiary core floods (hot water 50/80 °C, palm-frond-ash alkali 50/80 °C, xanthan gum 50/80 °C, steam 120 °C) on a 20 % porosity sandy-shale core saturated with 16.79 °API Niger Delta crude, including core petrophysics and fluid properties.',
      url: `${SITE.url}/laboratory`,
      isAccessibleForFree: true,
      creator: { '@id': `${SITE.url}/#author` },
      isBasedOn: { '@id': `${SITE.url}/#thesis` },
      keywords: ['core flooding', 'enhanced oil recovery', 'heavy oil', 'xanthan gum', 'palm frond ash', 'steam flooding', 'Niger Delta'],
      spatialCoverage: { '@type': 'Place', name: 'Niger Delta, Nigeria' },
      temporalCoverage: '2024',
      variableMeasured: ['Recovery efficiency (% OOIP)', 'Oil originally in place (cc)', 'Porosity (%)', 'Permeability (mD)', 'Crude viscosity (cP)', 'API gravity', 'Differential pressure (psi)', 'Injection temperature (°C)'],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
