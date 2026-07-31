import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { LiveVehicle } from '@/api/tracking'

function vehicleIcon(isOnline: boolean) {
  const color = isOnline ? '#16a34a' : '#9ca3af'
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

// One marker for one live vehicle — green if it's pinged within the "online" window
// (tracking.repository.ts#ONLINE_WINDOW_MS), gray otherwise. Popup shows driver, vehicle,
// destination, speed, and last-update time. See MIGRATION_PLAN.md §24.
export function LiveVehicleMarker({ vehicle }: { vehicle: LiveVehicle }) {
  if (!vehicle.lastLocation) return null

  const position: [number, number] = [Number(vehicle.lastLocation.latitude), Number(vehicle.lastLocation.longitude)]
  const speedKmh = vehicle.lastLocation.speed != null ? (Number(vehicle.lastLocation.speed) * 3.6).toFixed(0) : null

  return (
    <Marker position={position} icon={vehicleIcon(vehicle.isOnline)}>
      <Popup>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <strong>
            {vehicle.driver.name} {vehicle.driver.surname}
          </strong>
          <br />
          {vehicle.vehicle.registrationNumber} — {vehicle.vehicle.make} {vehicle.vehicle.model}
          <br />
          Trip: {vehicle.destination}
          <br />
          Speed: {speedKmh !== null ? `${speedKmh} km/h` : 'Unknown'}
          <br />
          Updated: {new Date(vehicle.lastLocation.timestamp).toLocaleTimeString()}
        </div>
      </Popup>
    </Marker>
  )
}
