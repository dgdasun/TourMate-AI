import { useState } from 'react'
import { compact } from '@/lib/utils'

export interface Bar {
  label: string
  value: number
  color?: string
  note?: string
}

/** Single-series vertical bars with rounded data-ends, hover tooltip and an optional dashed reference line. */
export default function BarChart({ bars, height = 220, referenceLine, referenceLabel, format = compact }: {
  bars: Bar[]
  height?: number
  referenceLine?: number
  referenceLabel?: string
  format?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  if (bars.length === 0) return null

  const width = 760
  const pad = { top: 16, right: 12, bottom: 30, left: 48 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const max = Math.max(...bars.map((b) => b.value), referenceLine ?? 0) * 1.1 || 1
  const slot = innerW / bars.length
  const barW = Math.min(48, slot - 4)
  const y = (v: number) => pad.top + innerH - (v / max) * innerH
  const base = pad.top + innerH

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full overflow-visible" onMouseLeave={() => setHover(null)} role="img" aria-label="Bar chart">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t * max)} y2={y(t * max)} className="stroke-slate-200 dark:stroke-slate-800" />
            <text x={pad.left - 8} y={y(t * max) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{format(t * max)}</text>
          </g>
        ))}
        {bars.map((b, i) => {
          const cx = pad.left + slot * i + slot / 2
          const top = y(b.value)
          const r = Math.min(4, Math.max(0, base - top))
          const l = cx - barW / 2
          const rt = cx + barW / 2
          return (
            <g key={b.label} onMouseEnter={() => setHover(i)}>
              {/* larger invisible hit target than the bar itself */}
              <rect x={cx - slot / 2} y={pad.top} width={slot} height={innerH} fill="transparent" />
              <path
                d={`M${l},${base} V${top + r} Q${l},${top} ${l + r},${top} H${rt - r} Q${rt},${top} ${rt},${top + r} V${base} Z`}
                fill={b.color ?? 'rgb(var(--series-1))'}
                opacity={hover == null || hover === i ? 1 : 0.5}
                className="transition-opacity"
              />
              <text x={cx} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">{b.label}</text>
            </g>
          )
        })}
        {referenceLine != null && (
          <g>
            <line x1={pad.left} x2={width - pad.right} y1={y(referenceLine)} y2={y(referenceLine)}
              className="stroke-slate-500 dark:stroke-slate-400" strokeDasharray="5 4" strokeWidth="1.5" />
            <text x={width - pad.right} y={y(referenceLine) - 5} textAnchor="end" className="fill-slate-500 text-[11px] dark:fill-slate-400">{referenceLabel}</text>
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900"
          style={{ left: `${((pad.left + slot * hover + slot / 2) / width) * 100}%`, top: `${(y(bars[hover].value) / height) * 100}%` }}>
          <b>{bars[hover].label}</b>: {bars[hover].value.toLocaleString()}{bars[hover].note ? ` · ${bars[hover].note}` : ''}
        </div>
      )}
    </div>
  )
}
