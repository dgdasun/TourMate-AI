import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bot, Car, Clock, Leaf, Loader2, Map as MapIcon, Route, Sparkles, Ticket, Wallet } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import SriLankaMap from '@/components/SriLankaMap'
import { Card, ErrorBox, LevelBadge, PageHeader, Stat } from '@/components/ui'
import { api } from '@/lib/api'
import type { Budget, Category, Pace, PlanRequest, PlanResponse, Transport } from '@/lib/types'
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_ICON, cn, MONTHS, pretty } from '@/lib/utils'

const AIRPORT: [number, number] = [7.1808, 79.8841]

export default function Planner() {
  const [form, setForm] = useState<PlanRequest>({
    days: 5,
    month: new Date().getMonth() + 1,
    interests: ['BEACH', 'HERITAGE', 'WILDLIFE'],
    budget: 'MID_RANGE',
    transport: 'CAR',
    pace: 'BALANCED',
    travellers: 2
  })
  const plan = useMutation({ mutationFn: api.plan })

  const toggle = (c: Category) => setForm({
    ...form,
    interests: form.interests.includes(c) ? form.interests.filter((x) => x !== c) : [...form.interests, c]
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    plan.mutate(form)
  }

  return (
    <div>
      <PageHeader icon={<MapIcon className="h-5 w-5" />} title="AI Trip Planner"
        subtitle="TourMate scores every destination on your interests, monsoon-aware weather, expected crowds and sustainability, then builds the most efficient route." />

      <form onSubmit={submit} className="card space-y-5">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div><label className="label">Days</label><input className="input" type="number" min={1} max={14} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} /></div>
          <div>
            <label className="label">Month</label>
            <select className="input" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div><label className="label">Travellers</label><input className="input" type="number" min={1} max={20} value={form.travellers} onChange={(e) => setForm({ ...form, travellers: Number(e.target.value) })} /></div>
          <div>
            <label className="label">Budget</label>
            <select className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value as Budget })}>
              <option value="BUDGET">Budget</option><option value="MID_RANGE">Mid-range</option><option value="LUXURY">Luxury</option>
            </select>
          </div>
          <div>
            <label className="label">Transport</label>
            <select className="input" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value as Transport })}>
              <option value="CAR">Car / taxi</option><option value="EV">Electric vehicle</option><option value="TRAIN">Train</option>
              <option value="BUS">Bus</option><option value="TUK_TUK">Tuk-tuk</option>
            </select>
          </div>
          <div>
            <label className="label">Pace</label>
            <select className="input" value={form.pace} onChange={(e) => setForm({ ...form, pace: e.target.value as Pace })}>
              <option value="RELAXED">Relaxed (1/day)</option><option value="BALANCED">Balanced (2/day)</option><option value="PACKED">Packed (3/day)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Interests</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button type="button" key={c} onClick={() => toggle(c)}
                className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                  form.interests.includes(c)
                    ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-500 dark:bg-brand-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300')}>
                {CATEGORY_ICON[c]} {pretty(c)}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-gold px-6 py-3" disabled={plan.isPending}>
          {plan.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Planning your trip…</> : <><Sparkles className="h-4 w-4" /> Generate itinerary</>}
        </button>
      </form>

      <div className="mt-6"><ErrorBox error={plan.error} /></div>
      {plan.data && <PlanView plan={plan.data} />}
    </div>
  )
}

function PlanView({ plan }: { plan: PlanResponse }) {
  const destinations = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations() })
  const coords = new Map(destinations.data?.map((d) => [d.id, [d.latitude, d.longitude] as [number, number]]))
  const stops = plan.itinerary.flatMap((day) => day.stops.map((s) => ({ ...s, day: day.day })))
  const route: [number, number][] = [AIRPORT, ...stops.map((s) => coords.get(s.destinationId)).filter((c): c is [number, number] => !!c), AIRPORT]

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Your {plan.days}-day trip in {plan.month}</h2>
          <span className="chip"><Bot className="h-3.5 w-3.5" /> {plan.aiPowered ? 'Written by Claude AI' : 'Offline AI engine'}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">{plan.aiSummary}</p>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={`US$${plan.cost.total.toLocaleString()}`} label={`Total · US$${plan.cost.perPerson}/person`} icon={<Wallet />} />
        <Stat value={`${plan.totalDistanceKm} km`} label={plan.transport} icon={<Route />} delay={0.05} />
        <Stat value={`${plan.carbonKg} kg`} label="CO₂ footprint" icon={<Car />} delay={0.1} />
        <Stat value={`${plan.carbonSavedVsCarKg} kg`} label="CO₂ saved vs. car" icon={<Leaf />} delay={0.15} />
      </div>

      {destinations.data && (
        <SriLankaMap height={420} route={route} points={[
          { id: 'airport', lat: AIRPORT[0], lng: AIRPORT[1], color: '#0f172a', label: '✈️ Bandaranaike International Airport', size: 7 },
          ...stops.flatMap((s) => {
            const c = coords.get(s.destinationId)
            return c ? [{ id: s.destinationId, lat: c[0], lng: c[1], color: CATEGORY_COLOR[s.category], label: `Day ${s.day}: ${s.name}`, size: 10 }] : []
          })
        ]} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {plan.itinerary.map((day, i) => (
            <motion.div key={day.day} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="card border-l-4 border-l-brand-700 dark:border-l-brand-500">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">Day {day.day}</h3>
                <span className="text-xs text-slate-500">🚗 {day.travelKm} km · ~{day.travelHours} h · overnight: {day.baseTown}</span>
              </div>
              {day.stops.length === 0 && <p className="mt-2 text-sm text-slate-500">Free time / travel back to the airport.</p>}
              <div className="mt-3 space-y-3">
                {day.stops.map((s) => (
                  <div key={s.destinationId} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{CATEGORY_ICON[s.category]} {s.name}</b>
                      <span className="chip">{s.matchScore}% match</span>
                      <LevelBadge level={s.expectedCrowd} prefix="Crowds: " />
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.reason}</p>
                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.visitHours} h</span>
                      <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> {s.entryFeeUsd > 0 ? `US$${s.entryFeeUsd}` : 'Free'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 font-bold">Cost breakdown</h3>
            {[
              ['🏨 Accommodation', plan.cost.accommodation], ['🍛 Food', plan.cost.food],
              ['🎟 Entry fees', plan.cost.entryFees], ['🚗 Transport', plan.cost.transport]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-dashed border-slate-200 py-2 text-sm dark:border-slate-700">
                <span>{label}</span><span className="font-semibold">US${value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 text-lg font-extrabold"><span>Total</span><span>US${plan.cost.total}</span></div>
          </Card>
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-bold"><Leaf className="h-4 w-4 text-emerald-600" /> Sustainable travel tips</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {plan.ecoTips.map((t) => <li key={t} className="flex gap-2"><span className="text-emerald-600">✓</span>{t}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
