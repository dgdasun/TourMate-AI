import { useQuery } from '@tanstack/react-query'
import { Leaf, TreePine } from 'lucide-react'
import { useState } from 'react'
import BarChart from '@/components/charts/BarChart'
import { Card, ErrorBox, Notice, PageHeader } from '@/components/ui'
import { api } from '@/lib/api'
import { CATEGORY_ICON } from '@/lib/utils'

const PRESETS: [string, number][] = [
  ['Colombo → Kandy', 115], ['Kandy → Ella', 140], ['Colombo → Galle', 125], ['Round-island tour', 1200]
]

export default function Sustainability() {
  const [distance, setDistance] = useState(140)
  const [travellers, setTravellers] = useState(2)
  const footprint = useQuery({
    queryKey: ['footprint', distance, travellers],
    queryFn: () => api.footprint(distance, travellers),
    enabled: distance > 0 && travellers > 0,
    placeholderData: (prev) => prev
  })
  const destinations = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations() })
  const eco = destinations.data?.filter((d) => d.ecoScore >= 5) ?? []
  const r = footprint.data

  return (
    <div className="space-y-6">
      <PageHeader icon={<Leaf className="h-5 w-5" />} title="Eco Travel"
        subtitle="Sustainable tourism: compare the carbon footprint, cost and time of each way to travel, and discover the highest eco-rated places." />

      <Card className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
          <div><label className="label">Distance (km)</label><input className="input" type="number" min={1} max={5000} value={distance} onChange={(e) => setDistance(Number(e.target.value))} /></div>
          <div><label className="label">Travellers</label><input className="input" type="number" min={1} max={50} value={travellers} onChange={(e) => setTravellers(Number(e.target.value))} /></div>
          <div>
            <label className="label">Common routes</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(([name, km]) => (
                <button key={name} className={distance === km ? 'btn-primary px-3 py-1.5 text-xs' : 'btn-ghost px-3 py-1.5 text-xs'} onClick={() => setDistance(km)}>{name}</button>
              ))}
            </div>
          </div>
        </div>
        <ErrorBox error={footprint.error} />
        {r && (
          <>
            <div>
              <h3 className="font-bold">CO₂ emissions for {r.distanceKm} km, {r.travellers} traveller(s) (kg)</h3>
              <BarChart height={220} format={(v) => v.toFixed(0)}
                bars={r.modes.map((m) => ({ label: m.label, value: m.co2Kg, note: `US$${m.costUsd} · ${m.hours} h` }))} />
            </div>
            <Notice icon={<TreePine className="h-4 w-4 text-emerald-600" />}>{r.recommendation}</Notice>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr><th className="pb-2">Mode</th><th className="pb-2">CO₂ (kg)</th><th className="pb-2">Cost (US$)</th><th className="pb-2">Time (h)</th><th className="pb-2">Trees to offset (1 yr)</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {r.modes.map((m, i) => (
                    <tr key={m.mode} className={i === 0 ? 'font-semibold text-emerald-700 dark:text-emerald-400' : ''}>
                      <td className="py-2">{i === 0 && '🌱 '}{m.label}</td><td className="py-2">{m.co2Kg}</td><td className="py-2">{m.costUsd}</td>
                      <td className="py-2">{m.hours}</td><td className="py-2">{m.treesToOffset}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">Private vehicles are counted per vehicle (4 seats, tuk-tuk 3); bus and train per passenger. Emission factors are typical averages.</p>
          </>
        )}
      </Card>

      <section>
        <h2 className="mb-4 text-xl font-extrabold">🌿 Top eco-rated destinations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eco.map((d, i) => (
            <Card key={d.id} delay={i * 0.05}>
              <div className="flex items-center justify-between">
                <b>{CATEGORY_ICON[d.category]} {d.name}</b>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Eco {d.ecoScore}/5</span>
              </div>
              <div className="text-xs text-slate-500">{d.province} Province</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{d.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
