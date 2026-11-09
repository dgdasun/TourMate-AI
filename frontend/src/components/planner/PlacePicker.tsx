import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, Leaf, Plus, Search, Ticket, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui'
import { api } from '@/lib/api'
import type { Category } from '@/lib/types'
import { CATEGORIES, CATEGORY_ICON, cn, MONTHS, pretty, weatherWord } from '@/lib/utils'

/**
 * Searchable list of destinations to add to a day. Places already in the trip are marked with their day,
 * and places are ordered by how good the weather is in the travel month.
 */
export default function PlacePicker({ day, month, usedOnDay, onPick, onClose }: {
  day: number
  month: number
  /** destinationId -> day number it is already planned on */
  usedOnDay: Map<number, number>
  onPick: (destinationId: number) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const { data, isLoading } = useQuery({
    queryKey: ['destinations', { category, month, search }],
    queryFn: () => api.destinations({ category, month, search }),
    placeholderData: (prev) => prev
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Add a place to day ${day}`}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Add a place to Day {day}</h2>
            <button className="btn-ghost p-2" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input autoFocus className="input pl-9" placeholder="Search by name, province or tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setCategory('')} className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-medium', category === '' ? 'bg-brand-800 text-white dark:bg-brand-600' : 'bg-slate-100 dark:bg-slate-800')}>All</button>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-medium', category === c ? 'bg-brand-800 text-white dark:bg-brand-600' : 'bg-slate-100 dark:bg-slate-800')}>
                {CATEGORY_ICON[c]} {pretty(c)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {isLoading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          {data?.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No places match.</p>}
          {data?.map((d) => {
            const w = weatherWord(d.weatherScore)
            const plannedDay = usedOnDay.get(d.id)
            return (
              <button key={d.id} onClick={() => onPick(d.id)} disabled={plannedDay != null}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-transparent dark:border-slate-700 dark:hover:bg-brand-500/10">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800">{CATEGORY_ICON[d.category]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{d.name}</span>
                  <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span>{d.province}</span>
                    <span>{w.icon} {w.label} in {MONTHS[month - 1].slice(0, 3)}</span>
                    <span className="flex items-center gap-0.5"><Leaf className="h-3 w-3" />{d.ecoScore}/5</span>
                    <span className="flex items-center gap-0.5"><Ticket className="h-3 w-3" />{d.entryFeeUsd > 0 ? `$${d.entryFeeUsd}` : 'Free'}</span>
                  </span>
                </span>
                {plannedDay != null
                  ? <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600"><Check className="h-3.5 w-3.5" /> Day {plannedDay}</span>
                  : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-800 text-white dark:bg-brand-600"><Plus className="h-4 w-4" /></span>}
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
