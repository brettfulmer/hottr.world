/**
 * ScrollFade — Framer Motion viewport-triggered staggered fade-in
 */
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: 'easeOut' as const, delay },
  }),
}

export default function ScrollFade({ children, delay = 0, className }: Props) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      custom={delay}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
