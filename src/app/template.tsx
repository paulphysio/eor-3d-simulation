'use client'
import { motion } from 'framer-motion'

// Re-mounts on every route change: entrance animation only, so the previous
// page (and its WebGL context) is released immediately.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  )
}
