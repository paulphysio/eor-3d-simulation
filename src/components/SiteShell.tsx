'use client'
import { ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, FileText } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'
import { ROUTES, SITE, pathFor } from '../lib/site'

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd27a" /><stop offset="0.55" stopColor="#f5a524" /><stop offset="1" stopColor="#ff6a3a" /></linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#0e1729" stroke="rgba(148,170,210,0.25)" />
      <path d="M16 6c3.6 4.6 6 8 6 11a6 6 0 1 1-12 0c0-3 2.4-6.4 6-11z" fill="url(#lg)" />
      <path d="M8 25h16" stroke="#3b9eff" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
    </svg>
  )
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Keep old shared links (/#simulator, /#laboratory …) working.
  useEffect(() => {
    const h = window.location.hash.replace('#', '')
    if (pathname === '/' && h && pathFor(h) !== '/') router.replace(pathFor(h))
  }, [pathname, router])

  const active = (p: string) => (p === '/' ? pathname === '/' : pathname.startsWith(p))

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--bg)] bg-grid">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-[#f5a524] focus:text-[#1a1004]">Skip to content</a>
        <header className="sticky top-0 z-50 h-16 border-b border-[var(--line)] bg-[#04070d]/80 backdrop-blur-xl">
          <div className="max-w-[1680px] mx-auto h-full px-3 md:px-6 flex items-center gap-4">
            <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-lg flex-none" aria-label={`${SITE.name} home`}>
              <Logo />
              <div className="text-left hidden sm:block">
                <div className="font-display text-[14px] font-semibold text-white leading-tight">{SITE.name}</div>
                <div className="text-[10.5px] text-[var(--ink-3)] leading-tight">Thermal–chemical heavy-oil recovery</div>
              </div>
            </Link>
            <nav className="flex-1 flex justify-center overflow-x-auto" aria-label="Main">
              <div className="relative flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-[var(--line)]">
                {ROUTES.map(r => (
                  <Link key={r.path} href={r.path} aria-current={active(r.path) ? 'page' : undefined}
                    className={`focus-ring relative px-3 md:px-4 py-1.5 rounded-lg text-[12.5px] md:text-[13px] font-medium whitespace-nowrap transition-colors ${active(r.path) ? 'text-white' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}>
                    {active(r.path) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-white/[0.08] border border-[var(--line-strong)]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className="relative">{r.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <div className="hidden lg:flex items-center gap-1 flex-none">
              <a href={SITE.repo} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository" className="focus-ring w-9 h-9 grid place-items-center rounded-lg text-[var(--ink-3)] hover:text-white hover:bg-white/5"><Github size={16} /></a>
              <a href={SITE.publication} target="_blank" rel="noopener noreferrer" aria-label="Publication on ResearchGate" className="focus-ring w-9 h-9 grid place-items-center rounded-lg text-[var(--ink-3)] hover:text-white hover:bg-white/5"><FileText size={16} /></a>
            </div>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="border-t border-[var(--line)] mt-10">
          <div className="max-w-[1680px] mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-3 md:items-center justify-between text-[12px] text-[var(--ink-3)]">
            <div>{SITE.author.name} · Department of Petroleum Engineering, FUTO · Supervised by {SITE.supervisor}</div>
            <nav aria-label="Footer" className="flex flex-wrap gap-4">
              {ROUTES.map(r => <Link key={r.path} href={r.path} className="focus-ring hover:text-white">{r.label}</Link>)}
            </nav>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
