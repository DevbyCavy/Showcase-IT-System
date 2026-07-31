import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapControls } from '@/components/MapControls'
import type { HistoryPoint } from '@/api/tracking'

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [30, 30] })
    }
  }, [positions, map])
  return null
}

function endpointIcon(label: string, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// A completed trip's full GPS breadcrumb trail as a Leaflet Polyline, with start (A, green) and
// end (B, red) markers, auto-fit to bounds — the "Route History" viewer managers use to review a
// finished trip. See MIGRATION_PLAN.md §24 (Leaflet rewrite).
export function TripHistoryMap({ points }: { points: HistoryPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full min-h-[300px] items-center justify-center rounded-2xl border p-8 text-center text-sm">
        No GPS points recorded for this trip.
      </div>
    )
  }

  const positions: [number, number][] = points.map((p) => [Number(p.latitude), Number(p.longitude)])

  return (
    <MapContainer center={positions[0]} zoom={12} scrollWheelZoom className="h-full min-h-[300px] w-full rounded-2xl border">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapControls />
      <Polyline positions={positions} pathOptions={{ color: '#f97316', weight: 4, opacity: 0.9 }} />
      <Marker position={positions[0]} icon={endpointIcon('A', '#16a34a')} />
      <Marker position={positions[positions.length - 1]} icon={endpointIcon('B', '#dc2626')} />
      <FitBounds positions={positions} />
    </MapContainer>
  )
}
