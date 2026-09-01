import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Niger Delta EOR Simulator — ML Proxy Model',
  description: 'Interactive 3D steam flooding EOR simulator trained on 150 Eclipse reservoir simulation runs. Built by Paul Madu.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
