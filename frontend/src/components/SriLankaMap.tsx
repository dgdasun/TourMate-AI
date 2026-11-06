import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet'
import type { ReactNode } from 'react'

export interface MapPoint {
  id: number | string
  lat: number
  lng: number
  color: string
  label: string
  /** marker radius in px */
  size?: number
  popup?: ReactNode
  onClick?: () => void
}

const SRI_LANKA_CENTER: [number, number] = [7.85, 80.75]

/**
 * Interactive OpenStreetMap of Sri Lanka. Circle markers avoid Leaflet's image-icon assets
 * and can be coloured by category or crowd level.
 */
export default function SriLankaMap({ points, route, height = 420, zoom = 7 }: {
  points: MapPoint[]
  route?: [number, number][]
  height?: number
  zoom?: number
}) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <MapContainer center={SRI_LANKA_CENTER} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {route && route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: '#0b3d91', weight: 3, dashArray: '8 6', opacity: 0.8 }} />
        )}
        {points.map((p) => (
          <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={p.size ?? 9}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: p.color, fillOpacity: 0.95 }}
            eventHandlers={p.onClick ? { click: p.onClick } : undefined}>
            <Tooltip direction="top" offset={[0, -8]}>{p.label}</Tooltip>
            {p.popup && <Popup>{p.popup}</Popup>}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
