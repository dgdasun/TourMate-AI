import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowRight, BarChart3, Bot, CalendarDays, Compass, Leaf, Map as MapIcon, PartyPopper, Pencil, Plus, Route, Settings2, Sun,
  Trash2, Users, Wallet
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Card, LevelBadge, Skeleton, Stat } from '@/components/ui'
import { api } from '@/lib/api'
import { initials, useAuth } from '@/lib/auth'
import { CATEGORY_ICON, MONTHS, pretty, weatherWord } from '@/lib/utils'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const welcome = (useLocation().state as { welcome?: boolean } | null)?.welcome
  const month = new Date().getMonth() + 1
  const qc = useQueryClient()
  const trips = useQuery({ queryKey: ['trips'], queryFn: api.trips })
  const remove = useMutation({ mutationFn: api.deleteTrip, onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }) })
  const best = useQuery({ queryKey: ['destinations', { month }], queryFn: () => api.destinations({ month }) })
  const overview = useQuery({ queryKey: ['overview'], queryFn: api.overview })
  if (!user) return null

  const manager = user.role === 'MANAGER'
  const actions = [
    { to: '/planner', icon: MapIcon, title: 'Plan a new trip', text: 'AI itinerary in seconds', color: 'from-brand-700 to-brand-500' },
    { to: '/assistant', icon: Bot, title: 'Ask the AI assistant', text: 'Visas, transport, culture…', color: 'from-violet-600 to-fuchsia-500' },
    { to: '/explore', icon: Compass, title: 'Explore destinations', text: 'Map, weather & reviews', color: 'from-emerald-600 to-teal-500' },
    manager
      ? { to: '/manage', icon: Settings2, title: 'Manage destinations', text: 'Capacity, eco ratings', color: 'from-amber-600 to-orange-500' }
      : { to: '/crowds', icon: Users, title: 'Check live crowds', text: 'Beat the queues', color: 'from-amber-600 to-orange-500' }
  ]
  const totalCarbon = trips.data?.reduce((sum, t) => sum + t.carbonKg, 0) ?? 0
  const totalDays = trips.data?.reduce((sum, t) => sum + t.days, 0) ?? 0

  return (
    <div className="space-y-8">
      {welcome && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <PartyPopper className="h-5 w-5 shrink-0" />
          <div><b>Welcome to TourMate AI!</b> Your account is ready. Start by planning your first trip.</div>
        </motion.div>
      )}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 text-lg font-bold text-white shadow-soft">
            {initials(user.fullName)}
          </div>
          <div>
            <p className="text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting()}, {user.fullName.split(' ')[0]} 👋</h1>
          </div>
        </div>
        <span className="chip px-3 py-1 text-sm">{manager ? '🏛️ Destination manager' : '🧳 Traveller'}{user.country ? ` · ${user.country}` : ''}</span>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a, i) => (
          <motion.div key={a.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={a.to} className={`group flex h-full flex-col rounded-2xl bg-gradient-to-br ${a.color} p-5 text-white shadow-soft transition hover:-translate-y-1 hover:shadow-xl`}>
              <a.icon className="h-6 w-6" />
              <div className="mt-6 font-bold">{a.title}</div>
              <div className="text-sm text-white/80">{a.text}</div>
              <ArrowRight className="mt-3 h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={trips.data?.length ?? '–'} label="Saved trips" icon={<Route />} />
        <Stat value={totalDays || '–'} label="Days of adventure" icon={<CalendarDays />} delay={0.05} />
        <Stat value={`${totalCarbon.toFixed(0)} kg`} label="Trip CO₂ (planned)" icon={<Leaf />} delay={0.1} />
        <Stat value={MONTHS[month - 1]} label="Current travel month" icon={<Sun />} delay={0.15} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">My trips</h2>
            <Link to="/planner" className="btn-ghost px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New trip</Link>
          </div>
          {trips.isLoading && <Skeleton className="h-40" />}
          {trips.data?.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
              <MapIcon className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 font-semibold">No trips yet</p>
              <p className="text-sm text-slate-500">Let the AI build your first Sri Lanka itinerary.</p>
              <Link to="/planner" className="btn-primary mt-4">Plan my first trip</Link>
            </div>
          )}
          <div className="space-y-3">
            {trips.data?.map((t) => (
              <div key={t.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <b>{t.title}</b>
                    <div className="text-xs text-slate-500">
                      {t.days} days · {MONTHS[t.travelMonth - 1]} · {t.updatedAt ? 'edited' : 'saved'} {new Date(t.updatedAt ?? t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/planner?trip=${t.id}`} className="btn-ghost px-2.5 py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                    <button className="btn-ghost px-2.5 py-1.5 text-xs text-red-600" disabled={remove.isPending}
                      onClick={() => window.confirm(`Delete "${t.title}"?`) && remove.mutate(t.id)} aria-label={`Delete ${t.title}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{t.destinations || 'No places added yet'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip"><Wallet className="h-3 w-3" /> US${t.totalCostUsd.toLocaleString()}</span>
                  <span className="chip"><Leaf className="h-3 w-3" /> {t.carbonKg} kg CO₂</span>
                  <span className="chip">{pretty(t.transport)}</span>
                  <span className="chip">{pretty(t.budget)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Sun className="h-5 w-5 text-gold-500" /> Best weather this month</h2>
            {best.isLoading && <Skeleton className="h-32" />}
            <div className="space-y-2">
              {best.data?.slice(0, 4).map((d) => (
                <Link key={d.id} to={`/explore?d=${d.id}`} className="flex items-center justify-between rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="text-sm font-medium">{CATEGORY_ICON[d.category]} {d.name}</span>
                  <span className="text-xs text-slate-500">{weatherWord(d.weatherScore).icon} {weatherWord(d.weatherScore).label}</span>
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5 text-orange-500" /> Busiest right now</h2>
              <Link to="/crowds" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">See all</Link>
            </div>
            {overview.isLoading && <Skeleton className="h-32" />}
            <div className="space-y-2">
              {overview.data?.busiestNow.slice(0, 4).map((c) => (
                <div key={c.destinationId} className="flex items-center justify-between gap-2 p-2 text-sm">
                  <span className="font-medium">{CATEGORY_ICON[c.category]} {c.name}</span>
                  <LevelBadge level={c.level} />
                </div>
              ))}
            </div>
          </Card>
          {manager && (
            <Link to="/insights" className="card flex items-center gap-3 transition hover:border-brand-300">
              <BarChart3 className="h-8 w-8 text-brand-600" />
              <div className="flex-1"><b>Tourism insights</b><div className="text-sm text-slate-500">Demand forecasts & visitor sentiment</div></div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
