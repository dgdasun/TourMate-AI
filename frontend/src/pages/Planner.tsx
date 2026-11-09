import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import {
  AlertTriangle, Bot, CalendarPlus, Car, Check, CheckCircle2, CloudRain, FolderOpen, GripVertical, Leaf, Loader2,
  Map as MapIcon, PencilLine, Plus, RotateCcw, Route, Save, Sparkles, StickyNote, Trash2, Wallet, X
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PlacePicker from '@/components/planner/PlacePicker'
import SriLankaMap from '@/components/SriLankaMap'
import { Card, ErrorBox, LevelBadge, Notice, PageHeader, Skeleton } from '@/components/ui'
import { api } from '@/lib/api'
import type { Budget, Category, Pace, PlanResponse, Stop, TripDetail, TripSettings, Transport } from '@/lib/types'
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_ICON, cn, MONTHS, pretty } from '@/lib/utils'

const AIRPORT: [number, number] = [7.1808, 79.8841]
const MAX_DAYS = 21
const MAX_STOPS_PER_DAY = 8

interface EditorStop {
  uid: string
  destinationId: number
  note: string
}

interface Draft {
  id?: number
  title: string
  notes: string
  days: EditorStop[][]
}

let uidCounter = 0
const uid = () => `s${Date.now().toString(36)}${(uidCounter++).toString(36)}`

/** What gets saved; comparing two of these tells us whether there are unsaved changes. */
const snapshot = (d: Draft, s: TripSettings) => JSON.stringify({
  t: d.title.trim(), n: d.notes.trim(), s, d: d.days.map((day) => day.map((x) => [x.destinationId, x.note.trim()]))
})

export default function Planner() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const tripId = Number(params.get('trip')) || null

  const [settings, setSettings] = useState<TripSettings>({
    month: new Date().getMonth() + 1, travellers: 2, budget: 'MID_RANGE', transport: 'CAR', interests: ['BEACH', 'HERITAGE', 'WILDLIFE']
  })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<{ text: string; aiPowered: boolean } | null>(null)
  const [pickerDay, setPickerDay] = useState<number | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  // open a saved trip from /planner?trip=<id>
  const saved = useQuery({ queryKey: ['trip', tripId], queryFn: () => api.trip(tripId!), enabled: tripId != null })
  useEffect(() => {
    if (saved.data && draft?.id !== saved.data.id) load(saved.data)
  }, [saved.data]) // only when a different trip arrives, never on local edits

  const load = (t: TripDetail) => {
    const s: TripSettings = { month: t.month, travellers: t.travellers, budget: t.budget, transport: t.transport, interests: t.interests }
    const d: Draft = {
      id: t.id, title: t.title, notes: t.notes ?? '',
      days: t.days.map((day) => day.map((x) => ({ uid: uid(), destinationId: x.destinationId, note: x.note ?? '' })))
    }
    setSettings(s)
    setDraft(d)
    setSavedSnapshot(snapshot(d, s))
    setAiSummary(null)
  }

  const dirty = draft != null && snapshot(draft, settings) !== savedSnapshot

  // warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // live costs, distances, crowds and carbon for whatever is currently in the editor
  const dayIds = draft?.days.map((d) => d.map((s) => s.destinationId))
  const evaluation = useQuery({
    queryKey: ['evaluate', dayIds, settings],
    queryFn: () => api.evaluate({ ...settings, days: dayIds! }),
    enabled: draft != null,
    placeholderData: (prev) => prev
  })

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...settings, title: draft!.title.trim(), notes: draft!.notes.trim() || null,
        days: draft!.days.map((d) => d.map((s) => ({ destinationId: s.destinationId, note: s.note.trim() || null })))
      }
      return draft!.id ? api.updateTrip(draft!.id, body) : api.createTrip(body)
    },
    onSuccess: (t) => {
      const d = { ...draft!, id: t.id }
      setDraft(d)
      setSavedSnapshot(snapshot(d, settings))
      qc.setQueryData(['trip', t.id], t)
      qc.invalidateQueries({ queryKey: ['trips'] })
      setParams({ trip: String(t.id) }, { replace: true })
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    }
  })

  const startOver = () => {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return
    setDraft(null)
    setSavedSnapshot(null)
    setAiSummary(null)
    setParams({})
  }

  const update = (fn: (d: Draft) => Draft) => setDraft((d) => (d ? fn(d) : d))
  const setDay = (i: number, stops: EditorStop[]) => update((d) => ({ ...d, days: d.days.map((day, j) => (j === i ? stops : day)) }))

  const usedOnDay = useMemo(() => {
    const m = new Map<number, number>()
    draft?.days.forEach((day, i) => day.forEach((s) => m.set(s.destinationId, i + 1)))
    return m
  }, [draft])

  if (tripId && saved.isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-96" /></div>

  return (
    <div>
      <PageHeader icon={<MapIcon className="h-5 w-5" />} title="Trip Planner"
        subtitle="Build your own itinerary, or let the AI suggest one and customise it. Nothing is saved until you press Save." />

      <ErrorBox error={saved.error} />

      {!draft ? (
        <StartPanel settings={settings} setSettings={setSettings}
          onManual={(days) => {
            setDraft({ title: 'My Sri Lanka trip', notes: '', days: Array.from({ length: days }, () => []) })
            setSavedSnapshot(null)
            setAiSummary(null)
          }}
          onSuggested={(plan, days) => {
            setDraft({
              title: `${days}-day ${MONTHS[settings.month - 1]} trip`, notes: '',
              days: plan.itinerary.map((d) => d.stops.map((s) => ({ uid: uid(), destinationId: s.destinationId, note: '' })))
            })
            setSavedSnapshot(null)
            setAiSummary({ text: plan.aiSummary, aiPowered: plan.aiPowered })
          }} />
      ) : (
        <div className="space-y-6">
          {/* title + save bar */}
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <PencilLine className="h-5 w-5 shrink-0 text-slate-400" />
            <input aria-label="Trip name" value={draft.title} maxLength={100} placeholder="Name your trip"
              onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
              className="min-w-[200px] flex-1 border-0 bg-transparent text-xl font-extrabold outline-none placeholder:text-slate-400" />
            <span className={cn('chip', dirty ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300')}>
              {dirty ? (draft.id ? '● Unsaved changes' : '● Not saved yet') : <><Check className="h-3 w-3" /> Saved</>}
            </span>
            <button className="btn-ghost" onClick={startOver}><RotateCcw className="h-4 w-4" /> New trip</button>
            <button className="btn-gold" onClick={() => save.mutate()} disabled={!dirty || !draft.title.trim() || save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : justSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {justSaved ? 'Saved!' : draft.id ? 'Save changes' : 'Save trip'}
            </button>
          </div>
          <ErrorBox error={save.error} />

          <SettingsBar settings={settings} setSettings={setSettings} />

          {aiSummary && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-gold-500" /> AI suggestion</h2>
                <span className="chip"><Bot className="h-3.5 w-3.5" /> {aiSummary.aiPowered ? 'Written by Claude AI' : 'Offline AI engine'}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{aiSummary.text}</p>
              <p className="mt-3 text-xs text-slate-500">Customise anything below: drag to reorder, move places between days, add your own, then save.</p>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {draft.days.map((stops, i) => (
                  <DayCard key={i} index={i} stops={stops} dayCount={draft.days.length} evaluated={evaluation.data?.itinerary[i]}
                    onChange={(next) => setDay(i, next)}
                    onAdd={() => setPickerDay(i)}
                    onMove={(stop, to) => update((d) => ({
                      ...d, days: d.days.map((day, j) => j === i ? day.filter((s) => s.uid !== stop.uid) : j === to ? [...day, stop] : day)
                    }))}
                    onRemoveDay={() => {
                      if (stops.length && !window.confirm(`Remove Day ${i + 1} and its ${stops.length} place(s)?`)) return
                      update((d) => ({ ...d, days: d.days.filter((_, j) => j !== i) }))
                    }} />
                ))}
              </AnimatePresence>
              <button className="btn-ghost w-full border-dashed py-4" disabled={draft.days.length >= MAX_DAYS}
                onClick={() => update((d) => ({ ...d, days: [...d.days, []] }))}>
                <CalendarPlus className="h-4 w-4" /> Add a day
              </button>

              <Card>
                <label className="label flex items-center gap-1.5" htmlFor="trip-notes"><StickyNote className="h-3.5 w-3.5" /> Trip notes</label>
                <textarea id="trip-notes" className="input min-h-20" maxLength={2000} value={draft.notes}
                  placeholder="Hotels booked, things to pack, people to meet…"
                  onChange={(e) => update((d) => ({ ...d, notes: e.target.value }))} />
              </Card>
            </div>

            <Summary plan={evaluation.data} loading={evaluation.isFetching} error={evaluation.error} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {pickerDay != null && draft && (
          <PlacePicker day={pickerDay + 1} month={settings.month} usedOnDay={usedOnDay} onClose={() => setPickerDay(null)}
            onPick={(destinationId) => {
              setDay(pickerDay, [...draft.days[pickerDay], { uid: uid(), destinationId, note: '' }])
              setPickerDay(null)
            }} />
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingsBar({ settings, setSettings }: { settings: TripSettings; setSettings: (s: TripSettings) => void }) {
  return (
    <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="label">Travel month</label>
        <select className="input" value={settings.month} onChange={(e) => setSettings({ ...settings, month: Number(e.target.value) })}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Travellers</label>
        <input className="input" type="number" min={1} max={20} value={settings.travellers}
          onChange={(e) => setSettings({ ...settings, travellers: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} />
      </div>
      <div>
        <label className="label">Budget</label>
        <select className="input" value={settings.budget} onChange={(e) => setSettings({ ...settings, budget: e.target.value as Budget })}>
          <option value="BUDGET">Budget</option><option value="MID_RANGE">Mid-range</option><option value="LUXURY">Luxury</option>
        </select>
      </div>
      <div>
        <label className="label">Transport</label>
        <select className="input" value={settings.transport} onChange={(e) => setSettings({ ...settings, transport: e.target.value as Transport })}>
          <option value="CAR">Car / taxi</option><option value="EV">Electric vehicle</option><option value="TRAIN">Train</option>
          <option value="BUS">Bus</option><option value="TUK_TUK">Tuk-tuk</option>
        </select>
      </div>
    </div>
  )
}

function StartPanel({ settings, setSettings, onManual, onSuggested }: {
  settings: TripSettings
  setSettings: (s: TripSettings) => void
  onManual: (days: number) => void
  onSuggested: (plan: PlanResponse, days: number) => void
}) {
  const [mode, setMode] = useState<'ai' | 'manual'>('manual')
  const [days, setDays] = useState(5)
  const [pace, setPace] = useState<Pace>('BALANCED')
  const suggest = useMutation({ mutationFn: api.plan, onSuccess: (plan) => onSuggested(plan, days) })
  const trips = useQuery({ queryKey: ['trips'], queryFn: api.trips })

  const toggle = (c: Category) => setSettings({
    ...settings, interests: settings.interests.includes(c) ? settings.interests.filter((x) => x !== c) : [...settings.interests, c]
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {([
          ['manual', PencilLine, 'Build it yourself', 'Pick every place and day yourself. Costs, crowds and the route update as you go.'],
          ['ai', Sparkles, 'Let AI suggest', 'Get an AI itinerary from your interests, the weather and crowds, then customise it.']
        ] as const).map(([m, Icon, title, text]) => (
          <button key={m} onClick={() => setMode(m)}
            className={cn('card flex items-start gap-4 text-left transition', mode === m ? 'border-brand-600 ring-2 ring-brand-600/20 dark:border-brand-500' : 'hover:border-brand-300')}>
            <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', mode === m ? 'bg-brand-800 text-white dark:bg-brand-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
              <Icon className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-bold">{title}</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{text}</span>
            </span>
          </button>
        ))}
      </div>

      <SettingsBar settings={settings} setSettings={setSettings} />

      <Card className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Number of days</label>
            <input className="input" type="number" min={1} max={mode === 'ai' ? 14 : MAX_DAYS} value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(mode === 'ai' ? 14 : MAX_DAYS, Number(e.target.value) || 1)))} />
          </div>
          {mode === 'ai' && (
            <div>
              <label className="label">Pace</label>
              <select className="input" value={pace} onChange={(e) => setPace(e.target.value as Pace)}>
                <option value="RELAXED">Relaxed (1 place/day)</option><option value="BALANCED">Balanced (2/day)</option><option value="PACKED">Packed (3/day)</option>
              </select>
            </div>
          )}
        </div>
        {mode === 'ai' && (
          <div>
            <label className="label">Interests</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button type="button" key={c} onClick={() => toggle(c)}
                  className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                    settings.interests.includes(c)
                      ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-500 dark:bg-brand-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300')}>
                  {CATEGORY_ICON[c]} {pretty(c)}
                </button>
              ))}
            </div>
          </div>
        )}
        {mode === 'ai' ? (
          <button className="btn-gold px-6 py-3" disabled={suggest.isPending}
            onClick={() => suggest.mutate({ ...settings, days: Math.min(days, 14), pace })}>
            {suggest.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</> : <><Sparkles className="h-4 w-4" /> Suggest an itinerary</>}
          </button>
        ) : (
          <button className="btn-primary px-6 py-3" onClick={() => onManual(days)}>
            <PencilLine className="h-4 w-4" /> Start building ({days} {days === 1 ? 'day' : 'days'})
          </button>
        )}
        <ErrorBox error={suggest.error} />
      </Card>

      {trips.data && trips.data.length > 0 && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-bold"><FolderOpen className="h-4 w-4" /> Continue a saved trip</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {trips.data.slice(0, 6).map((t) => (
              <Link key={t.id} to={`/planner?trip=${t.id}`}
                className="rounded-xl border border-slate-200 p-3 transition hover:border-brand-400 dark:border-slate-700">
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-slate-500">{t.days} days · {MONTHS[t.travelMonth - 1]} · US${t.totalCostUsd.toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function DayCard({ index, stops, dayCount, evaluated, onChange, onAdd, onMove, onRemoveDay }: {
  index: number
  stops: EditorStop[]
  dayCount: number
  evaluated?: PlanResponse['itinerary'][number]
  onChange: (stops: EditorStop[]) => void
  onAdd: () => void
  onMove: (stop: EditorStop, toDay: number) => void
  onRemoveDay: () => void
}) {
  // only trust the evaluation once it matches what is on screen (it lags one request behind while editing)
  const fresh = evaluated && evaluated.stops.length === stops.length && evaluated.stops.every((s, i) => s.destinationId === stops[i].destinationId)
  const visitHours = fresh ? evaluated.stops.reduce((h, s) => h + s.visitHours, 0) : 0
  const longDrive = fresh && evaluated.travelHours > 6
  const overfull = fresh && visitHours + evaluated.travelHours > 12

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
      className="card border-l-4 border-l-brand-700 p-4 dark:border-l-brand-500">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Day {index + 1}</h3>
        <div className="flex items-center gap-2">
          {fresh && <span className="text-xs text-slate-500">🚗 {evaluated.travelKm} km · ~{evaluated.travelHours} h</span>}
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" disabled={dayCount === 1}
            onClick={onRemoveDay} title="Remove this day" aria-label={`Remove day ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {(longDrive || overfull) && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {longDrive ? `Long travel day (~${evaluated!.travelHours} h on the road). Consider splitting it.` : `Very full day (~${Math.round(visitHours + evaluated!.travelHours)} h of sights and travel).`}
        </div>
      )}

      <Reorder.Group axis="y" values={stops} onReorder={onChange} className="mt-3 space-y-2">
        {stops.map((s, i) => (
          <StopRow key={s.uid} stop={s} info={fresh ? evaluated.stops[i] : undefined} dayIndex={index} dayCount={dayCount}
            onNote={(note) => onChange(stops.map((x) => (x.uid === s.uid ? { ...x, note } : x)))}
            onRemove={() => onChange(stops.filter((x) => x.uid !== s.uid))}
            onMove={(to) => onMove(s, to)} />
        ))}
      </Reorder.Group>

      {stops.length === 0 && (
        <p className="mt-3 rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-700">
          {index === dayCount - 1 ? 'Free day / travel back to the airport.' : 'Free day. Add a place or enjoy a rest day.'}
        </p>
      )}

      <button className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline disabled:opacity-50 dark:text-brand-300"
        disabled={stops.length >= MAX_STOPS_PER_DAY} onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add a place
      </button>
    </motion.div>
  )
}

function StopRow({ stop, info, dayIndex, dayCount, onNote, onRemove, onMove }: {
  stop: EditorStop
  info?: Stop
  dayIndex: number
  dayCount: number
  onNote: (note: string) => void
  onRemove: () => void
  onMove: (toDay: number) => void
}) {
  const controls = useDragControls()
  const [editingNote, setEditingNote] = useState(stop.note.length > 0)

  return (
    <Reorder.Item value={stop} dragListener={false} dragControls={controls}
      className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="flex items-start gap-2">
        <button className="mt-0.5 cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-200 active:cursor-grabbing dark:hover:bg-slate-700"
          onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder" title="Drag to reorder">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b>{info ? `${CATEGORY_ICON[info.category]} ${info.name}` : 'Loading…'}</b>
            {info && <LevelBadge level={info.expectedCrowd} prefix="Crowds: " />}
            {info && info.weatherScore < 0.6 && (
              <span className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                <CloudRain className="h-3 w-3" /> Monsoon
              </span>
            )}
          </div>
          {info && <p className="mt-0.5 text-xs text-slate-500">{info.reason} · ~{info.visitHours} h · {info.entryFeeUsd > 0 ? `US$${info.entryFeeUsd}` : 'free'}</p>}
          {editingNote ? (
            <input className="input mt-2 py-1.5 text-xs" maxLength={300} placeholder="Your note (e.g. book tickets online, go at sunrise)"
              value={stop.note} onChange={(e) => onNote(e.target.value)} autoFocus={stop.note.length === 0} />
          ) : (
            <button className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-700 dark:hover:text-brand-300"
              onClick={() => setEditingNote(true)}><StickyNote className="h-3 w-3" /> Add note</button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {dayCount > 1 && (
            <select aria-label="Move to day" title="Move to another day" value={dayIndex}
              onChange={(e) => onMove(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
              {Array.from({ length: dayCount }, (_, d) => <option key={d} value={d}>{d === dayIndex ? `Day ${d + 1}` : `→ Day ${d + 1}`}</option>)}
            </select>
          )}
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            onClick={onRemove} aria-label="Remove place" title="Remove"><X className="h-4 w-4" /></button>
        </div>
      </div>
    </Reorder.Item>
  )
}

function Summary({ plan, loading, error }: { plan?: PlanResponse; loading: boolean; error: unknown }) {
  const destinations = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations() })
  const coords = new Map(destinations.data?.map((d) => [d.id, [d.latitude, d.longitude] as [number, number]]))
  const stops = plan?.itinerary.flatMap((day) => day.stops.map((s) => ({ ...s, day: day.day }))) ?? []
  const route: [number, number][] = [AIRPORT, ...stops.map((s) => coords.get(s.destinationId)).filter((c): c is [number, number] => !!c), AIRPORT]

  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <ErrorBox error={error} />
      <Card className="relative">
        {loading && <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin text-slate-400" />}
        <h3 className="mb-3 font-bold">Live trip summary</h3>
        {!plan ? <Skeleton className="h-24" /> : (
          <div className="grid grid-cols-2 gap-3">
            {[
              [<Wallet key="w" className="h-4 w-4" />, `US$${plan.cost.total.toLocaleString()}`, `US$${plan.cost.perPerson}/person`],
              [<Route key="r" className="h-4 w-4" />, `${plan.totalDistanceKm} km`, plan.transport],
              [<Car key="c" className="h-4 w-4" />, `${plan.carbonKg} kg`, 'CO₂ footprint'],
              [<Leaf key="l" className="h-4 w-4" />, `${plan.carbonSavedVsCarKg} kg`, 'CO₂ saved vs. car']
            ].map(([icon, value, label], i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">{icon}</div>
                <div className="mt-1 text-lg font-extrabold">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {plan && destinations.data && (
        <SriLankaMap height={300} route={route} points={[
          { id: 'airport', lat: AIRPORT[0], lng: AIRPORT[1], color: '#0f172a', label: '✈️ Bandaranaike International Airport', size: 7 },
          ...stops.flatMap((s) => {
            const c = coords.get(s.destinationId)
            return c ? [{ id: `${s.day}-${s.destinationId}`, lat: c[0], lng: c[1], color: CATEGORY_COLOR[s.category], label: `Day ${s.day}: ${s.name}`, size: 9 }] : []
          })
        ]} />
      )}

      {plan && (
        <Card>
          <h3 className="mb-2 font-bold">Cost breakdown</h3>
          {[
            ['🏨 Accommodation', plan.cost.accommodation], ['🍛 Food', plan.cost.food],
            ['🎟 Entry fees', plan.cost.entryFees], ['🚗 Transport', plan.cost.transport]
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-dashed border-slate-200 py-1.5 text-sm dark:border-slate-700">
              <span>{label}</span><span className="font-semibold">US${value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-extrabold"><span>Total</span><span>US${plan.cost.total}</span></div>
        </Card>
      )}

      {plan && plan.ecoTips.length > 0 && (
        <Notice icon={<Leaf className="h-4 w-4 text-emerald-600" />}>{plan.ecoTips[0]}</Notice>
      )}
    </div>
  )
}
