import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { VehicleMap } from '@/components/VehicleMap'
import { TripHistoryMap } from '@/components/TripHistoryMap'
import * as trackingApi from '@/api/tracking'
import * as tripsApi from '@/api/vehicleTrips'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// "Tracking" dashboard: live fleet map (OpenStreetMap via Leaflet — no API key), real-time stats,
// search/department/driver/online-filter over the live list, and a Route History viewer for
// completed trips. See MIGRATION_PLAN.md §24 (Leaflet rewrite — this replaces an earlier Google
// Maps version per Calvin's explicit "no Google Maps, no API key" request).
export default function TrackingDashboard() {
  const { data: stats } = useQuery({ queryKey: ['tracking', 'stats'], queryFn: trackingApi.stats, refetchInterval: 15000 })
  const { data: liveVehicles } = useQuery({ queryKey: ['tracking', 'live'], queryFn: trackingApi.live, refetchInterval: 15000 })
  const { data: completedTrips } = useQuery({ queryKey: ['trips', 'history'], queryFn: tripsApi.history })

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [driverId, setDriverId] = useState('')
  const [onlyOnline, setOnlyOnline] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState('')

  const vehicles = useMemo(() => liveVehicles ?? [], [liveVehicles])
  const departments = useMemo(() => Array.from(new Set(vehicles.map((v) => v.vehicle.department))), [vehicles])
  const drivers = useMemo(() => {
    const map = new Map<number, string>()
    vehicles.forEach((v) => map.set(v.driver.id, `${v.driver.name} ${v.driver.surname}`))
    return Array.from(map.entries())
  }, [vehicles])

  const filteredVehicles = vehicles.filter((v) => {
    if (department && v.vehicle.department !== department) return false
    if (driverId && String(v.driver.id) !== driverId) return false
    if (onlyOnline && !v.isOnline) return false
    if (search) {
      const haystack = `${v.vehicle.registrationNumber} ${v.driver.name} ${v.driver.surname} ${v.destination}`.toLowerCase()
      if (!haystack.includes(search.toLowerCase())) return false
    }
    return true
  })

  const { data: tripHistory } = useQuery({
    queryKey: ['tracking', 'history', selectedTripId],
    queryFn: () => trackingApi.history(Number(selectedTripId)),
    enabled: Boolean(selectedTripId),
  })
  const selectedTrip = completedTrips?.find((t) => String(t.id) === selectedTripId)

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <PageHeader title="Tracking" />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Vehicles Online</h6>
            <p className="text-2xl font-bold text-green-600">{stats?.vehiclesOnline ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Trips In Progress</h6>
            <p className="text-2xl font-bold">{stats?.tripsInProgress ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Average Speed</h6>
            <p className="text-2xl font-bold">{((stats?.averageSpeed ?? 0) * 3.6).toFixed(0)} km/h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Distance Today</h6>
            <p className="text-2xl font-bold">{Number(stats?.totalDistanceToday ?? 0).toFixed(0)} KM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Vehicles Offline</h6>
            <p className="text-muted-foreground text-2xl font-bold">{stats?.vehiclesOffline ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="rounded-full pl-9"
            placeholder="Search vehicle, driver, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={`${selectClass} w-auto`} value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select className={`${selectClass} w-auto`} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          <option value="">All drivers</option>
          {drivers.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={onlyOnline} onChange={(e) => setOnlyOnline(e.target.checked)} className="border-input h-4 w-4 rounded" />
          Active trips only
        </label>
      </div>

      <div className="mb-8 h-[480px]">
        <VehicleMap vehicles={filteredVehicles} />
      </div>

      <h2 className="mb-3 font-semibold">Route History</h2>
      <div className="mb-4 max-w-sm space-y-1">
        <label className="text-sm font-medium">Completed Trip</label>
        <select className={selectClass} value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
          <option value="">Select a completed trip...</option>
          {(completedTrips ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.vehicle.registrationNumber} — {t.driver.name} {t.driver.surname} — {t.destination} (
              {new Date(t.departureDatetime).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedTripId && (
        <>
          {tripHistory && (
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent>
                  <h6 className="text-muted-foreground text-sm">GPS Distance</h6>
                  <p className="text-xl font-bold">{tripHistory.gpsDistanceKm.toFixed(2)} KM</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <h6 className="text-muted-foreground text-sm">Duration</h6>
                  <p className="text-xl font-bold">{(tripHistory.durationMinutes / 60).toFixed(1)} hrs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <h6 className="text-muted-foreground text-sm">Avg Speed</h6>
                  <p className="text-xl font-bold">{tripHistory.averageSpeed.toFixed(1)} km/h</p>
                </CardContent>
              </Card>
            </div>
          )}
          {selectedTrip && (
            <p className="text-muted-foreground mb-2 text-sm">
              Odometer distance on record: {Number(selectedTrip.distanceTravelled ?? 0).toFixed(2)} KM
            </p>
          )}
          <div className="h-[400px]">
            <TripHistoryMap points={tripHistory?.points ?? []} />
          </div>
        </>
      )}
    </div>
  )
}
