import { useState, type MouseEvent } from 'react'
import { compact } from '@/lib/utils'

export interface LinePoint {
  label: string
  actual: number | null
  forecast: number | null
}

/** History line plus a dashed forecast line that continues it, with a crosshair tooltip. */
export default function LineChart({ points, actualLabel = 'Actual', forecastLabel = 'Forecast', height = 260 }: {
  points: LinePoint[]
  actualLabel?: string
  forecastLabel?: string
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length === 0) return null

  const width = 760
  const pad = { top: 16, right: 16, bottom: 30, left: 56 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const values = points.flatMap((p) => [p.actual, p.forecast]).filter((v): v is number => v != null)
  const max = niceMax(Math.max(...values))
  const x = (i: number) => pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => pad.top + innerH - (v / max) * innerH

  const path = (key: 'actual' | 'forecast') => {
    let d = ''
    let pen = false
    points.forEach((p, i) => {
      const v = p[key]
      if (v == null) { pen = false; return }
      d += `${pen ? 'L' : 'M'}${x(i)},${y(v)} `
      pen = true
    })
    return d
  }

  // join the forecast to the last actual point so the two read as one story
  const lastActual = points.reduce((acc, p, i) => (p.actual != null ? i : acc), -1)
  const firstForecast = points.findIndex((p) => p.forecast != null)
  const bridge = lastActual >= 0 && firstForecast > lastActual
    ? `M${x(lastActual)},${y(points[lastActual].actual!)} L${x(firstForecast)},${y(points[firstForecast].forecast!)} `
    : ''

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const labelEvery = Math.ceil(points.length / 8)

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * width
    const i = Math.round(((px - pad.left) / innerW) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, i)))
  }

  const h = hover != null ? points[hover] : null
  const hv = h ? (h.actual ?? h.forecast ?? 0) : 0

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><i className="inline-block h-[3px] w-4 rounded bg-series-1" />{actualLabel}</span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-[3px] w-4 rounded" style={{ background: 'repeating-linear-gradient(90deg, rgb(var(--series-2)) 0 4px, transparent 4px 7px)' }} />
          {forecastLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full overflow-visible" onMouseMove={onMove}
        onMouseLeave={() => setHover(null)} role="img" aria-label={`${actualLabel} and ${forecastLabel} by month`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="stroke-slate-200 dark:stroke-slate-800" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{compact(t)}</text>
          </g>
        ))}
        {points.map((p, i) => i % labelEvery === 0 && (
          <text key={p.label} x={x(i)} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">{p.label}</text>
        ))}
        <path d={path('actual')} fill="none" stroke="rgb(var(--series-1))" strokeWidth="2" strokeLinejoin="round" />
        <path d={bridge + path('forecast')} fill="none" stroke="rgb(var(--series-2))" strokeWidth="2" strokeDasharray="6 4" />
        {h && (
          <>
            <line x1={x(hover!)} x2={x(hover!)} y1={pad.top} y2={pad.top + innerH} className="stroke-slate-400" strokeDasharray="3 3" />
            <circle cx={x(hover!)} cy={y(hv)} r="5" fill={h.actual != null ? 'rgb(var(--series-1))' : 'rgb(var(--series-2))'}
              className="stroke-white dark:stroke-slate-900" strokeWidth="2" />
          </>
        )}
      </svg>
      {h && (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900"
          style={{ left: `${(x(hover!) / width) * 100}%`, top: `${(y(hv) / height) * 100}%` }}>
          <b>{h.label}</b> · {h.actual != null ? actualLabel : forecastLabel}: {hv.toLocaleString()}
        </div>
      )}
    </div>
  )
}

function niceMax(v: number) {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  return Math.ceil(v / mag) * mag
}
