import { MapContainer, TileLayer } from 'react-leaflet'
import { MapControls } from '@/components/MapControls'
import { LiveVehicleMarker } from '@/components/LiveVehicleMarker'
import type { LiveVehicle } from '@/api/tracking'

// Harare CBD — matches the business's location, used only as the map's initial center before any
// live markers exist.
const DEFAULT_CENTER: [number, number] = [-17.8292, 31.0522]

// Live fleet map — OpenStreetMap tiles via Leaflet, no API key. One LiveVehicleMarker per Active
// trip with a GPS fix; the parent page (TrackingDashboard.tsx) polls /tracking/live every 15s and
// passes the updated list down, so markers move without a manual refresh. See
// MIGRATION_PLAN.md §24 (Leaflet rewrite — this replaces the earlier Google Maps version).
export function VehicleMap({ vehicles }: { vehicles: LiveVehicle[] }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom className="h-full min-h-[400px] w-full rounded-2xl border">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapControls />
      {vehicles.map((v) => (v.lastLocation ? <LiveVehicleMarker key={v.tripId} vehicle={v} /> : null))}
    </MapContainer>
  )
}
