import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Radio, Users } from 'lucide-react'
import { useState } from 'react'
import SriLankaMap from '@/components/SriLankaMap'
import { ErrorBox, LevelBadge, PageHeader, ProgressBar, Skeleton } from '@/components/ui'
import { api } from '@/lib/api'
import type { CrowdLevel } from '@/lib/types'
import { CATEGORY_ICON, LEVEL_STYLE } from '@/lib/utils'

const OPEN_NOW = new Date().getHours() >= 6 && new Date().getHours() < 18
const LEVELS: CrowdLevel[] = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'CLOSED']

export default function Crowds() {
  // null = right now; outside opening hours start with a mid-morning preview instead of a page of "Closed"
  const [hour, setHour] = useState<number | null>(OPEN_NOW ? null : 10)
  const { data, error, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['crowds', hour],
    queryFn: () => api.crowds(hour),
    refetchInterval: hour == null ? 60_000 : false
  })
  const coords = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations() })
  const pos = new Map(coords.data?.map((d) => [d.id, d]))
  const counts = (data ?? []).reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.level]: (acc[c.level] ?? 0) + 1 }), {})

  return (
    <div>
      <PageHeader icon={<Users className="h-5 w-5" />} title="Live Crowd Monitor"
        subtitle="Smart visitor-flow management: crowd levels combine the demand forecast, typical arrival patterns and live visitor check-ins. Busy places get a quieter alternative of the same type nearby." />

      <div className="card mb-6 flex flex-wrap items-center gap-5">
        <div className="min-w-[240px] flex-1">
          <label className="label flex items-center gap-2">
            {hour == null
              ? <><Radio className="h-3.5 w-3.5 animate-pulse text-red-500" /> Live · updated {new Date(dataUpdatedAt || Date.now()).toLocaleTimeString()}</>
              : <>Forecast for {String(hour).padStart(2, '0')}:00 today{!OPEN_NOW && ' · sites are closed right now (open 06:00-18:00)'}</>}
          </label>
          <input type="range" min={6} max={17} className="w-full accent-brand-700"
            value={hour ?? Math.min(17, Math.max(6, new Date().getHours()))} onChange={(e) => setHour(Number(e.target.value))} />
          <div className="flex justify-between text-[11px] text-slate-400"><span>06:00</span><span>12:00</span><span>17:00</span></div>
        </div>
        <button className="btn-ghost" onClick={() => setHour(null)} disabled={hour == null}>Back to live</button>
        <div className="flex flex-wrap gap-2">
          {LEVELS.filter((l) => counts[l]).map((l) => <span key={l} className="flex items-center gap-1"><LevelBadge level={l} /><b className="text-sm">{counts[l]}</b></span>)}
        </div>
      </div>

      <ErrorBox error={error} />
      {isLoading && <Skeleton className="h-96" />}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SriLankaMap height={560} points={data.flatMap((c) => {
              const d = pos.get(c.destinationId)
              return d ? [{
                id: c.destinationId, lat: d.latitude, lng: d.longitude, color: LEVEL_STYLE[c.level].color,
                size: 6 + Math.min(1.3, c.occupancy) * 8, label: `${c.name}: ${Math.round(c.occupancy * 100)}% full`
              }] : []
            })} />
            <p className="mt-2 text-xs text-slate-500">Marker size and colour show how full each place is.</p>
          </div>

          <div className="space-y-3">
            {data.map((c) => (
              <div key={c.destinationId} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{CATEGORY_ICON[c.category]} {c.name}</div>
                    <div className="text-xs text-slate-500">{c.province} Province</div>
                  </div>
                  <LevelBadge level={c.level} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={c.occupancy} color={LEVEL_STYLE[c.level].color} />
                  <span className="w-12 text-right text-sm font-semibold">{Math.round(c.occupancy * 100)}%</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{c.estimatedVisitorsNow.toLocaleString()} visitors / hour · capacity {c.hourlyCapacity.toLocaleString()}</span>
                  {c.alternativeName && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <ArrowRight className="h-3 w-3" /> Quieter: {c.alternativeName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
