import { clsx, type ClassValue } from 'clsx'
import type { Category, CrowdLevel, Sentiment } from './types'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

export const CATEGORIES: Category[] = ['BEACH', 'HERITAGE', 'CULTURAL', 'WILDLIFE', 'NATURE', 'HILL_COUNTRY', 'ADVENTURE', 'CITY']

export const CATEGORY_ICON: Record<Category, string> = {
  BEACH: '🏖️', HERITAGE: '🏛️', CULTURAL: '🛕', WILDLIFE: '🐘',
  NATURE: '🌿', HILL_COUNTRY: '⛰️', ADVENTURE: '🧗', CITY: '🏙️'
}

/** Map marker colour per category: the reference categorical palette, in fixed order. */
export const CATEGORY_COLOR: Record<Category, string> = {
  BEACH: '#2a78d6', HERITAGE: '#eb6834', CULTURAL: '#e87ba4', WILDLIFE: '#008300',
  NATURE: '#1baf7a', HILL_COUNTRY: '#6250d6', ADVENTURE: '#e34948', CITY: '#eda100'
}

export const LEVEL_STYLE: Record<CrowdLevel, { badge: string; color: string; dot: string }> = {
  LOW: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', color: '#1a7f37', dot: 'bg-emerald-500' },
  MODERATE: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', color: '#b7791f', dot: 'bg-amber-500' },
  HIGH: { badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300', color: '#dd6b20', dot: 'bg-orange-500' },
  VERY_HIGH: { badge: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300', color: '#c53030', dot: 'bg-red-500' },
  CLOSED: { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300', color: '#718096', dot: 'bg-slate-400' }
}

export const SENTIMENT_STYLE: Record<Sentiment, string> = {
  POSITIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  NEUTRAL: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  NEGATIVE: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300'
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const pretty = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export function compact(v: number) {
  if (v >= 1e6) return `${+(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`
  return Math.round(v).toString()
}

export const weatherWord = (score: number) =>
  score >= 0.85 ? { label: 'Excellent', icon: '☀️' } : score >= 0.6 ? { label: 'Fair', icon: '🌤️' } : { label: 'Monsoon', icon: '🌧️' }
