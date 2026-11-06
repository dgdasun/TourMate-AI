import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, LEVEL_STYLE, pretty } from '@/lib/utils'
import type { CrowdLevel } from '@/lib/types'

export function PageHeader({ icon, title, subtitle, children }: { icon?: ReactNode; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {icon && <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-600">{icon}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Card({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn('card', className)}
    >
      {children}
    </motion.div>
  )
}

export function Stat({ value, label, icon, delay }: { value: ReactNode; label: string; icon?: ReactNode; delay?: number }) {
  return (
    <Card delay={delay} className="flex items-start justify-between gap-3">
      <div>
        <div className="text-2xl font-extrabold text-brand-800 dark:text-brand-300 sm:text-3xl">{value}</div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
      </div>
      {icon && <div className="text-brand-500 dark:text-brand-400">{icon}</div>}
    </Card>
  )
}

export function LevelBadge({ level, prefix }: { level: CrowdLevel; prefix?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold', LEVEL_STYLE[level].badge)}>
      <span className={cn('h-2 w-2 rounded-full', LEVEL_STYLE[level].dot)} />
      {prefix}{pretty(level)}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800', className)} />
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <b>Something went wrong:</b> {message}
        {message.includes('fetch') || message.includes('500') || message.includes('502')
          ? ' Is the Spring Boot backend running on port 9090?' : null}
      </div>
    </div>
  )
}

export function Notice({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border-l-4 border-gold-500 bg-gold-500/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 0.6 }}
        className="h-full rounded-full"
        style={{ background: color ?? 'rgb(var(--series-1))' }}
      />
    </div>
  )
}
