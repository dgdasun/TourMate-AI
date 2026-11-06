import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Settings2, Trash2 } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Card, ErrorBox, Notice, PageHeader } from '@/components/ui'
import { api } from '@/lib/api'
import type { Category, ClimateZone, Destination, DestinationInput } from '@/lib/types'
import { CATEGORIES, CATEGORY_ICON, pretty } from '@/lib/utils'

const ZONES: ClimateZone[] = ['WEST_SOUTH', 'EAST', 'CULTURAL_TRIANGLE', 'HILL_COUNTRY', 'NORTH']

const EMPTY: DestinationInput = {
  name: '', province: '', category: 'NATURE', climateZone: 'CULTURAL_TRIANGLE', description: '',
  latitude: 7.5, longitude: 80.7, entryFeeUsd: 0, avgVisitHours: 2, dailyCapacity: 1000, ecoScore: 4, tags: ''
}

export default function Manage() {
  const qc = useQueryClient()
  const [form, setForm] = useState<DestinationInput>(EMPTY)
  const list = useQuery({ queryKey: ['destinations', {}], queryFn: () => api.destinations() })
  const sorted = [...(list.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  const refresh = () => qc.invalidateQueries({ queryKey: ['destinations'] })
  const create = useMutation({ mutationFn: api.createDestination, onSuccess: () => { setForm(EMPTY); refresh() } })
  const remove = useMutation({ mutationFn: api.deleteDestination, onSuccess: refresh })

  const set = (k: keyof DestinationInput, numeric = false) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: numeric ? Number(e.target.value) : e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(form)
  }

  const confirmDelete = (d: Destination) => {
    if (window.confirm(`Delete ${d.name} and all its reviews and statistics?`)) remove.mutate(d.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={<Settings2 className="h-5 w-5" />} title="Destination Management"
        subtitle="Smart destination management for tourism authorities: register destinations with capacity limits, climate zone and sustainability rating. These drive the planner, crowd monitor and forecasts." />

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <h2 className="text-lg font-bold">Add a destination</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className="label">Name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
            <div><label className="label">Province</label><input className="input" required value={form.province} onChange={set('province')} /></div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICON[c]} {pretty(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Climate zone</label>
              <select className="input" value={form.climateZone} onChange={(e) => setForm({ ...form, climateZone: e.target.value as ClimateZone })}>
                {ZONES.map((z) => <option key={z} value={z}>{pretty(z)}</option>)}
              </select>
            </div>
            <div><label className="label">Latitude</label><input className="input" type="number" step="0.0001" value={form.latitude} onChange={set('latitude', true)} /></div>
            <div><label className="label">Longitude</label><input className="input" type="number" step="0.0001" value={form.longitude} onChange={set('longitude', true)} /></div>
            <div><label className="label">Entry fee (US$)</label><input className="input" type="number" min={0} value={form.entryFeeUsd} onChange={set('entryFeeUsd', true)} /></div>
            <div><label className="label">Visit hours</label><input className="input" type="number" min={0.5} step={0.5} value={form.avgVisitHours} onChange={set('avgVisitHours', true)} /></div>
            <div><label className="label">Daily capacity</label><input className="input" type="number" min={1} value={form.dailyCapacity} onChange={set('dailyCapacity', true)} /></div>
            <div><label className="label">Eco score (1-5)</label><input className="input" type="number" min={1} max={5} value={form.ecoScore} onChange={set('ecoScore', true)} /></div>
            <div className="sm:col-span-2"><label className="label">Tags (comma separated)</label><input className="input" value={form.tags} onChange={set('tags')} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input min-h-20" value={form.description} onChange={set('description')} /></div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" disabled={create.isPending}><Plus className="h-4 w-4" /> Add destination</button>
            {create.isSuccess && <Notice>Destination added.</Notice>}
          </div>
          <ErrorBox error={create.error} />
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Registered destinations ({sorted.length})</h2>
        <ErrorBox error={list.error ?? remove.error} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="pb-2">Name</th><th className="pb-2">Category</th><th className="pb-2">Province</th><th className="pb-2">Capacity/day</th><th className="pb-2">Eco</th><th className="pb-2">Best months</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((d) => (
                <tr key={d.id}>
                  <td className="py-2.5 font-semibold">{d.name}</td>
                  <td className="py-2.5">{CATEGORY_ICON[d.category]} {pretty(d.category)}</td>
                  <td className="py-2.5">{d.province}</td>
                  <td className="py-2.5">{d.dailyCapacity.toLocaleString()}</td>
                  <td className="py-2.5">{d.ecoScore}/5</td>
                  <td className="py-2.5 text-xs">{d.bestMonths.join(', ')}</td>
                  <td className="py-2.5 text-right">
                    <button className="btn-ghost px-2.5 py-1.5 text-red-600" onClick={() => confirmDelete(d)} aria-label={`Delete ${d.name}`}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">New destinations use a capacity-based estimate until 12 months of visitor statistics are available for forecasting.</p>
      </Card>
    </div>
  )
}
