import { useQuery } from '@tanstack/react-query'
import { BarChart3, Bot, MessageSquare, Smile, Star, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import { Card, ErrorBox, Notice, PageHeader, Skeleton, Stat } from '@/components/ui'
import { api } from '@/lib/api'
import { cn, pretty, SENTIMENT_STYLE } from '@/lib/utils'

export default function Insights() {
  const overview = useQuery({ queryKey: ['overview'], queryFn: api.overview })
  const destinations = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations() })
  const sorted = [...(destinations.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (selectedId == null && sorted.length) setSelectedId(sorted.find((d) => d.name.startsWith('Sigiriya'))?.id ?? sorted[0].id)
  }, [sorted, selectedId])

  const forecast = useQuery({ queryKey: ['forecast', selectedId], queryFn: () => api.forecast(selectedId!), enabled: selectedId != null })
  const insights = useQuery({ queryKey: ['insights', selectedId], queryFn: () => api.insights(selectedId!), enabled: selectedId != null })
  const o = overview.data

  return (
    <div className="space-y-6">
      <PageHeader icon={<BarChart3 className="h-5 w-5" />} title="Tourism Insights"
        subtitle="Predictive analytics for destination managers and policy makers: demand forecasts, visitor sentiment and data-driven recommendations." />
      <ErrorBox error={overview.error ?? forecast.error} />

      {o ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat value={o.totalReviews} label="Reviews analysed by AI" icon={<MessageSquare />} />
            <Stat value={`${Math.round(((o.sentimentBreakdown.POSITIVE ?? 0) / Math.max(1, o.totalReviews)) * 100)}%`} label="Positive sentiment" icon={<Smile />} delay={0.05} />
            <Stat value={`${o.avgRating} ★`} label="Average rating" icon={<Star />} delay={0.1} />
            <Stat value={o.tripsPlanned} label="Trips planned" icon={<TrendingUp />} delay={0.15} />
          </div>
          <Card>
            <h2 className="text-lg font-bold">Island-wide visitor trend</h2>
            <p className="mb-4 text-sm text-slate-500">Total monthly visits across all monitored destinations: last 12 months and a 6-month forecast.</p>
            <LineChart points={o.nationalTrend.map((p) => ({ label: p.period, actual: p.actual, forecast: p.forecast }))} />
          </Card>
        </>
      ) : overview.isLoading && <Skeleton className="h-80" />}

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Destination deep-dive</h2>
          <select className="input max-w-xs" value={selectedId ?? ''} onChange={(e) => setSelectedId(Number(e.target.value))}>
            {sorted.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {forecast.data && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                [`${forecast.data.growthRatePct > 0 ? '+' : ''}${forecast.data.growthRatePct}%`, 'Annual growth trend'],
                [forecast.data.peakMonth, 'Forecast peak month'],
                [forecast.data.quietMonth, 'Quietest month'],
                [`${forecast.data.mapePct}%`, 'Model error (MAPE)']
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <div className="text-xl font-extrabold text-brand-800 dark:text-brand-300">{v}</div>
                  <div className="text-xs text-slate-500">{l}</div>
                </div>
              ))}
            </div>
            <LineChart actualLabel="Actual visitors" forecastLabel="AI forecast"
              points={forecast.data.points.map((p) => ({ label: p.period, actual: p.actual, forecast: p.forecast }))} />
            <Notice icon="📈">{forecast.data.insight}</Notice>
          </>
        )}

        {insights.data && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-bold">Visitor sentiment ({insights.data.reviewCount} reviews)</h3>
              <div className="my-3 flex flex-wrap gap-2">
                {Object.entries(insights.data.sentimentBreakdown).map(([k, v]) => (
                  <span key={k} className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', SENTIMENT_STYLE[k as keyof typeof SENTIMENT_STYLE])}>{pretty(k)}: {v}</span>
                ))}
                <span className="chip">Avg score {insights.data.avgSentiment}</span>
              </div>
              {Object.keys(insights.data.aspectMentions).length > 0 ? (
                <>
                  <div className="text-xs text-slate-500">Topics visitors mention most</div>
                  <BarChart height={180} format={(v) => Math.round(v).toString()}
                    bars={Object.entries(insights.data.aspectMentions).map(([k, v]) => ({
                      label: k, value: v, note: insights.data!.negativeAspects[k] ? `${insights.data!.negativeAspects[k]} negative` : 'all positive'
                    }))} />
                </>
              ) : <p className="text-sm text-slate-500">No reviews yet for this destination.</p>}
            </div>
            <div className="rounded-2xl bg-brand-50 p-5 dark:bg-brand-500/10">
              <h3 className="flex items-center gap-2 font-bold"><Bot className="h-4 w-4" /> AI recommendations for managers</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {insights.data.recommendations.map((r) => <li key={r} className="flex gap-2"><span className="text-brand-600">→</span>{r}</li>)}
              </ul>
              {Object.keys(insights.data.negativeAspects).length > 0 && (
                <p className="mt-3 text-xs text-slate-500">Problem areas: {Object.entries(insights.data.negativeAspects).map(([k, v]) => `${k} (${v})`).join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </Card>

      {o && o.recentReviews.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Latest visitor feedback</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr><th className="pb-2">Destination</th><th className="pb-2">Visitor</th><th className="pb-2">Rating</th><th className="pb-2">Sentiment</th><th className="pb-2">Topics</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {o.recentReviews.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 font-medium">{r.destinationName}</td>
                    <td className="py-2.5">{r.visitorName} <span className="text-slate-500">{r.country}</span></td>
                    <td className="py-2.5 text-gold-500">{'★'.repeat(r.rating)}</td>
                    <td className="py-2.5"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', SENTIMENT_STYLE[r.sentimentLabel])}>{pretty(r.sentimentLabel)}</span></td>
                    <td className="py-2.5 text-xs">{r.aspects.map((a) => a.replace('-', '⚠ ')).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
