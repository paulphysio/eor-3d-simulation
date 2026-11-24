'use client'
import { ReactNode, useEffect, useRef, useState, memo, useId } from 'react'
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

export function AnimatedNumber({ value, decimals = 0, className = '', prefix = '', suffix = '' }: { value: number; decimals?: number; className?: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 })
  useEffect(() => { if (inView) mv.set(value) }, [value, inView, mv])
  useEffect(() => spring.on('change', v => {
    if (ref.current) ref.current.textContent = prefix + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  }), [spring, decimals, prefix, suffix])
  return <span ref={ref} className={`num ${className}`}>{prefix}{(0).toFixed(decimals)}{suffix}</span>
}

export function InfoTip({ children, side = 'top', width = 260 }: { children: ReactNode; side?: 'top' | 'bottom' | 'right'; width?: number }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-describedby={id} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className="focus-ring rounded-full text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors" aria-label="More information">
        <Info size={13} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id={id} role="tooltip"
            initial={{ opacity: 0, y: side === 'top' ? 4 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ width }}
            className={`absolute z-50 text-[12px] leading-relaxed font-normal normal-case tracking-normal text-[var(--ink-2)] p-3 rounded-xl glass shadow-2xl pointer-events-none ${side === 'top' ? 'bottom-6 left-1/2 -translate-x-1/2' : side === 'bottom' ? 'top-6 left-1/2 -translate-x-1/2' : 'left-6 top-1/2 -translate-y-1/2'}`}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export const Slider = memo(function Slider({ label, tag, value, min, max, step, unit, color, help, onChange, format, muted }: {
  label: string; tag?: string; value: number; min: number; max: number; step: number; unit?: string; color: string; help?: string;
  onChange: (v: number) => void; format?: (v: number) => string; muted?: boolean
}) {
  const pct = ((value - min) / (max - min)) * 100
  const id = useId()
  return (
    <div className={`group ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-2)]">
          {tag && <span className="num text-[9.5px] px-1.5 py-[1px] rounded-md bg-white/[0.04] border border-[var(--line)] text-[var(--ink-3)]">{tag}</span>}
          {label}
          {help && <InfoTip>{help}</InfoTip>}
        </label>
        <span className="num text-[12.5px] text-[var(--ink)] font-medium">
          {format ? format(value) : value}{unit && <span className="text-[var(--ink-3)] ml-1 text-[11px]">{unit}</span>}
        </span>
      </div>
      <input
        id={id} type="range" className="rng" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ ['--c' as string]: color, ['--track' as string]: `linear-gradient(90deg, ${color} ${pct}%, rgba(148,170,210,0.14) ${pct}%)` }}
      />
    </div>
  )
})

export function Segmented<T extends string | number>({ options, value, onChange, size = 'md', ariaLabel }: { options: { value: T; label: ReactNode; title?: string }[]; value: T; onChange: (v: T) => void; size?: 'sm' | 'md'; ariaLabel?: string }) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="relative inline-flex p-1 rounded-xl bg-white/[0.03] border border-[var(--line)]">
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)} role="radio" aria-checked={active} title={o.title}
            onClick={() => onChange(o.value)}
            className={`focus-ring relative z-10 ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12.5px]'} rounded-lg font-medium transition-colors whitespace-nowrap ${active ? 'text-[#1a1004]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 -z-10 rounded-lg bg-[var(--oil)]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ on, onChange, label, icon }: { on: boolean; onChange: (v: boolean) => void; label: string; icon?: ReactNode }) {
  return (
    <button
      onClick={() => onChange(!on)} aria-pressed={on}
      className={`focus-ring inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all ${on ? 'bg-[#f5a524]/15 border-[#f5a524]/50 text-[var(--oil)]' : 'bg-white/[0.02] border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'}`}
    >
      {icon}{label}
    </button>
  )
}

export function SectionHeader({ eyebrow, title, children, as = 'h2' }: { eyebrow: string; title: ReactNode; children?: ReactNode; as?: 'h1' | 'h2' }) {
  const H = as
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl">
      <div className="eyebrow mb-3 flex items-center gap-2"><span className="w-6 h-px bg-[var(--oil)]" />{eyebrow}</div>
      <H className="font-display text-3xl md:text-[40px] leading-[1.08] font-semibold text-white">{title}</H>
      {children && <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-2)]">{children}</p>}
    </motion.div>
  )
}

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

export function Pill({ children, color = 'var(--oil)' }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border" style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      {children}
    </span>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 text-[11.5px] leading-relaxed text-[var(--ink-3)] p-3 rounded-xl border border-dashed border-[var(--line-strong)]">
      <Info size={13} className="flex-none mt-[2px]" />
      <div>{children}</div>
    </div>
  )
}

export function CanvasFallback({ label = 'Initialising WebGL scene' }: { label?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[var(--ink-3)]">
      <div className="w-10 h-10 rounded-full border-2 border-[var(--line-strong)] border-t-[var(--oil)] animate-spin" />
      <div className="text-[12px] font-mono">{label}…</div>
    </div>
  )
}
