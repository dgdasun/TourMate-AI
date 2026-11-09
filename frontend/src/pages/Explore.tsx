import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Compass, LayoutGrid, Leaf, Map as MapIcon, MapPin, Search, Send, Sun, Ticket, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BarChart from '@/components/charts/BarChart'
import SriLankaMap from '@/components/SriLankaMap'
import { ErrorBox, Notice, PageHeader, ProgressBar, Skeleton } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Category, Destination } from '@/lib/types'
import {
  CATEGORIES, CATEGORY_COLOR, CATEGORY_ICON, cn, LEVEL_STYLE, MONTHS, pretty, SENTIMENT_STYLE, weatherWord
} from '@/lib/utils'

const BANNER: Record<Category, string> = {
  BEACH: 'from-sky-200 to-amber-100 dark:from-sky-900 dark:to-amber-900/40',
  WILDLIFE: 'from-lime-200 to-amber-100 dark:from-lime-900 dark:to-amber-900/40',
  HERITAGE: 'from-orange-200 to-yellow-100 dark:from-orange-900 dark:to-yellow-900/40',
  CULTURAL: 'from-rose-200 to-orange-100 dark:from-rose-900 dark:to-orange-900/40',
  NATURE: 'from-emerald-200 to-lime-100 dark:from-emerald-900 dark:to-lime-900/40',
  HILL_COUNTRY: 'from-teal-200 to-emerald-100 dark:from-teal-900 dark:to-emerald-900/40',
  ADVENTURE: 'from-red-200 to-orange-100 dark:from-red-900 dark:to-orange-900/40',
  CITY: 'from-indigo-200 to-slate-100 dark:from-indigo-900 dark:to-slate-800'
}

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState<Category | ''>('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'map'>('grid')

  const { data, isLoading, error } = useQuery({
    queryKey: ['destinations', { category, month, search }],
    queryFn: () => api.destinations({ category, month, search })
  })
  const selectedId = Number(params.get('d')) || null
  const all = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations(), enabled: selectedId != null })
  const selected = data?.find((d) => d.id === selectedId) ?? all.data?.find((d) => d.id === selectedId)
  const select = (id: number | null) => setParams(id ? { d: String(id) } : {})

  return (
    <div>
      <PageHeader icon={<Compass className="h-5 w-5" />} title="Explore Sri Lanka"
        subtitle="Destinations ranked by the weather in your travel month. Sri Lanka's two monsoons mean there's always a sunny coast.">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
          {(['grid', 'map'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium', view === v ? 'bg-brand-800 text-white dark:bg-brand-600' : 'text-slate-600 dark:text-slate-300')}>
              {v === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />} {pretty(v)}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="card mb-6 grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label className="label">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Name, province or tag (e.g. surfing)" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category | '')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICON[c]} {pretty(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Travel month</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      <ErrorBox error={error} />

      {isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div>}

      {data && view === 'map' && (
        <SriLankaMap height={600} points={data.map((d) => ({
          id: d.id, lat: d.latitude, lng: d.longitude, color: CATEGORY_COLOR[d.category], size: 7 + d.weatherScore * 6,
          label: `${CATEGORY_ICON[d.category]} ${d.name} · ${weatherWord(d.weatherScore).label} weather`, onClick: () => select(d.id)
        }))} />
      )}

      {data && view === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.length === 0 && <p className="text-slate-500">No destinations match your filters.</p>}
          {data.map((d, i) => {
            const w = weatherWord(d.weatherScore)
            return (
              <motion.button key={d.id} onClick={() => select(d.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="card group flex flex-col gap-3 text-left transition hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-600">
                <div className={cn('grid h-28 place-items-center rounded-xl bg-gradient-to-br text-5xl transition group-hover:scale-[1.02]', BANNER[d.category])}>
                  {CATEGORY_ICON[d.category]}
                </div>
                <div>
                  <h3 className="font-bold">{d.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{d.province} Province · {pretty(d.category)}</p>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Weather in {MONTHS[month - 1]}</span>
                    <b>{w.icon} {w.label}</b>
                  </div>
                  <ProgressBar value={d.weatherScore} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip"><Leaf className="h-3 w-3" /> Eco {d.ecoScore}/5</span>
                  <span className="chip"><Ticket className="h-3 w-3" /> {d.entryFeeUsd > 0 ? `US$${d.entryFeeUsd}` : 'Free entry'}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && <DestinationDrawer destination={selected} onClose={() => select(null)} />}
      </AnimatePresence>
    </div>
  )
}

function DestinationDrawer({ destination: d, onClose }: { destination: Destination; onClose: () => void }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const loginState = { from: `/explore?d=${d.id}` }
  const bestTime = useQuery({ queryKey: ['best-time', d.id], queryFn: () => api.bestTime(d.id) })
  const reviews = useQuery({ queryKey: ['reviews', d.id], queryFn: () => api.reviews(d.id) })
  const checkIn = useMutation({ mutationFn: () => api.checkIn(d.id, 1), onSuccess: () => qc.invalidateQueries({ queryKey: ['crowds'] }) })
  const [form, setForm] = useState({ visitorName: user?.fullName ?? '', country: user?.country ?? '', rating: 5, comment: '' })
  const addReview = useMutation({
    mutationFn: () => api.addReview({ ...form, destinationId: d.id }),
    onSuccess: () => {
      setForm({ ...form, rating: 5, comment: '' })
      qc.invalidateQueries({ queryKey: ['reviews', d.id] })
      qc.invalidateQueries({ queryKey: ['overview'] })
    }
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addReview.mutate()
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.aside onClick={(e) => e.stopPropagation()} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        className="h-full w-full max-w-2xl space-y-6 overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-brand-600 dark:text-brand-400">{CATEGORY_ICON[d.category]} {pretty(d.category)}</div>
            <h2 className="text-2xl font-extrabold">{d.name}</h2>
          </div>
          <button className="btn-ghost p-2" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-slate-600 dark:text-slate-300">{d.description}</p>
        <div className="flex flex-wrap gap-2">
          <span className="chip"><MapPin className="h-3 w-3" /> {d.province}</span>
          <span className="chip"><Clock className="h-3 w-3" /> ~{d.avgVisitHours} h</span>
          <span className="chip"><Ticket className="h-3 w-3" /> {d.entryFeeUsd > 0 ? `US$${d.entryFeeUsd}` : 'Free'}</span>
          <span className="chip"><Leaf className="h-3 w-3" /> Eco {d.ecoScore}/5</span>
          <span className="chip"><Sun className="h-3 w-3" /> Best: {d.bestMonths.join(', ') || 'year-round'}</span>
          {d.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
        </div>

        <SriLankaMap height={220} zoom={8} points={[{ id: d.id, lat: d.latitude, lng: d.longitude, color: CATEGORY_COLOR[d.category], label: d.name, size: 11 }]} />

        {bestTime.data && (
          <section>
            <h3 className="mb-2 font-bold">Expected visitors by hour today</h3>
            <BarChart height={200} referenceLine={bestTime.data.hourlyCapacity} referenceLabel="Comfortable capacity"
              bars={bestTime.data.hours.map((h) => ({
                label: `${String(h.hour).padStart(2, '0')}h`, value: h.expectedVisitors, color: LEVEL_STYLE[h.level].color, note: pretty(h.level)
              }))} />
            <div className="mt-3"><Notice icon="💡">{bestTime.data.advice}</Notice></div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <button className="btn-primary" onClick={() => checkIn.mutate()} disabled={checkIn.isPending || checkIn.isSuccess}>
              <MapPin className="h-4 w-4" /> {checkIn.isSuccess ? 'Checked in ✓' : "I'm here, check in"}
            </button>
          ) : (
            <Link to="/login" state={loginState} className="btn-primary"><MapPin className="h-4 w-4" /> Log in to check in</Link>
          )}
          <span className="text-sm text-slate-500">Check-ins feed the live crowd monitor.</span>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-bold">Visitor reviews ({reviews.data?.length ?? 0})</h3>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {reviews.data?.length === 0 && <p className="text-sm text-slate-500">No reviews yet. Be the first!</p>}
              {reviews.data?.map((r) => (
                <div key={r.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <b>{r.visitorName}</b><span className="text-slate-500">{r.country}</span>
                    <span className="text-gold-500">{'★'.repeat(r.rating)}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', SENTIMENT_STYLE[r.sentimentLabel])}>{pretty(r.sentimentLabel)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
          {!user ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
              <Send className="h-6 w-6 text-slate-400" />
              <p className="mt-2 font-semibold">Share your experience</p>
              <p className="text-sm text-slate-500">Log in to write a review. The AI reads every review to help managers improve.</p>
              <Link to="/login" state={loginState} className="btn-primary mt-4">Log in to review</Link>
            </div>
          ) : (
          <form onSubmit={submit} className="space-y-3">
            <h3 className="font-bold">Share your experience</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name</label><input className="input" required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} /></div>
              <div><label className="label">Country</label><input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            </div>
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}
                    className={cn('text-2xl transition', n <= form.rating ? 'text-gold-500' : 'text-slate-300 dark:text-slate-600')} aria-label={`${n} stars`}>★</button>
                ))}
              </div>
            </div>
            <div><label className="label">Review</label><textarea className="input min-h-24" required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></div>
            <button className="btn-primary w-full" disabled={addReview.isPending}><Send className="h-4 w-4" /> Submit review</button>
            {addReview.data && (
              <Notice icon="🤖">AI sentiment: <b>{pretty(addReview.data.sentimentLabel)}</b> ({addReview.data.sentimentScore})
                {addReview.data.aspects.length > 0 && <> · topics: {addReview.data.aspects.map((a) => a.replace('-', '⚠ ')).join(', ')}</>}
              </Notice>
            )}
            <ErrorBox error={addReview.error} />
          </form>
          )}
        </section>
      </motion.aside>
    </motion.div>
  )
}
