import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as tripsApi from '@/api/vehicleTrips'
import * as usersApi from '@/api/users'
import type { VehicleTrip } from '@/api/vehicleTrips'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Translated from includes/vehicles/tripLogbook.php. Vehicle status side-effects mirror the
// legacy exactly: starting a trip requires the vehicle to be Available and flips it to On Trip;
// ending a trip flips it back to Available and computes distance_travelled (see
// vehicleTrip.repository.ts for the transaction that replaces the legacy's unguarded queries).
export default function TripLogbook() {
  const queryClient = useQueryClient()
  const { data: stats } = useQuery({ queryKey: ['trips', 'stats'], queryFn: tripsApi.stats })
  const { data: activeTrips } = useQuery({ queryKey: ['trips', 'active'], queryFn: tripsApi.active })
  const { data: history } = useQuery({ queryKey: ['trips', 'history'], queryFn: tripsApi.history })
  const { data: availableVehicles } = useQuery({ queryKey: ['trips', 'available-vehicles'], queryFn: tripsApi.availableVehicles })
  const { data: users } = useQuery({ queryKey: ['users', 'assignable'], queryFn: usersApi.listAssignable })

  const [tab, setTab] = useState<'new' | 'active' | 'history'>('new')
  const [search, setSearch] = useState('')
  const [ending, setEnding] = useState<VehicleTrip | null>(null)

  const [form, setForm] = useState({
    vehicleId: '',
    userId: '',
    destination: '',
    purpose: '',
    departureDatetime: '',
    odometerStart: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () =>
      tripsApi.create({
        vehicleId: Number(form.vehicleId),
        userId: Number(form.userId),
        destination: form.destination,
        purpose: form.purpose || undefined,
        departureDatetime: form.departureDatetime,
        odometerStart: Number(form.odometerStart),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setSuccess('Trip started successfully.')
      setForm({ vehicleId: '', userId: '', destination: '', purpose: '', departureDatetime: '', odometerStart: '' })
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to start trip.') : 'Failed to start trip.')
    },
  })

  const filteredHistory = (history ?? []).filter((t) =>
    [t.vehicle.registrationNumber, t.driver.name, t.driver.surname, t.destination].join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  const activeColumns: DataTableColumn<VehicleTrip>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicle.registrationNumber },
    { key: 'driver', header: 'Driver', render: (t) => `${t.driver.name} ${t.driver.surname}` },
    { key: 'destination', header: 'Destination', render: (t) => t.destination },
    { key: 'departure', header: 'Departure', render: (t) => new Date(t.departureDatetime).toLocaleString() },
    { key: 'status', header: 'Status', render: () => <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">Active</span> },
    {
      key: 'action',
      header: 'Action',
      render: (t) => (
        <Button size="sm" onClick={() => setEnding(t)}>
          End Trip
        </Button>
      ),
    },
  ]

  const historyColumns: DataTableColumn<VehicleTrip>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicle.registrationNumber },
    { key: 'driver', header: 'Driver', render: (t) => `${t.driver.name} ${t.driver.surname}` },
    { key: 'destination', header: 'Destination', render: (t) => t.destination },
    { key: 'departure', header: 'Departure', render: (t) => new Date(t.departureDatetime).toLocaleString() },
    { key: 'return', header: 'Return', render: (t) => (t.returnDatetime ? new Date(t.returnDatetime).toLocaleString() : '') },
    { key: 'distance', header: 'Distance (KM)', render: (t) => Number(t.distanceTravelled ?? 0).toFixed(2) },
    {
      key: 'status',
      header: 'Status',
      render: () => <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">Completed</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader title="Trip Logbook" />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Total Trips</h6>
            <p className="text-2xl font-bold">{stats?.totalTrips ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Active Trips</h6>
            <p className="text-2xl font-bold">{stats?.activeTripCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Total Distance</h6>
            <p className="text-2xl font-bold">{Number(stats?.totalDistance ?? 0).toFixed(2)} KM</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 flex w-fit gap-0.5 rounded-full bg-secondary p-1">
        <button
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === 'new' ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('new')}
        >
          New Trip
        </button>
        <button
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === 'active' ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('active')}
        >
          Active Trips
        </button>
        <button
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === 'history' ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('history')}
        >
          Trip History
        </button>
      </div>

      {tab === 'new' && (
        <Card>
          <CardContent className="space-y-3">
          <h2 className="font-semibold">Create New Trip</h2>

          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Vehicle</label>
              <select className={selectClass} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select Vehicle</option>
                {availableVehicles?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Driver / Operator</label>
              <select className={selectClass} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select User</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.surname}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Destination</label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Departure Date &amp; Time</label>
              <Input type="datetime-local" value={form.departureDatetime} onChange={(e) => setForm({ ...form, departureDatetime: e.target.value })} />
            </div>
            <div className="col-span-full space-y-1">
              <label className="text-sm font-medium">Purpose</label>
              <textarea
                className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-sm"
                rows={3}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Odometer Start</label>
              <Input type="number" step="0.01" value={form.odometerStart} onChange={(e) => setForm({ ...form, odometerStart: e.target.value })} />
            </div>
          </div>

          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Starting…' : 'Start Trip'}
          </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'active' && (
        <DataTable columns={activeColumns} data={activeTrips ?? []} keyExtractor={(t) => t.id} emptyMessage="No active trips." />
      )}

      {tab === 'history' && (
        <DataTable
          columns={historyColumns}
          data={filteredHistory}
          keyExtractor={(t) => t.id}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search trips..."
          emptyMessage="No completed trips."
        />
      )}

      {ending && <EndTripModal trip={ending} onClose={() => setEnding(null)} />}
    </div>
  )
}

function EndTripModal({ trip, onClose }: { trip: VehicleTrip; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [returnDatetime, setReturnDatetime] = useState('')
  const [odometerEnd, setOdometerEnd] = useState('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      tripsApi.end(trip.id, {
        returnDatetime,
        odometerEnd: Number(odometerEnd),
        remarks: remarks || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to end trip.') : 'Failed to end trip.')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">End Trip</h2>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Return Date &amp; Time</label>
            <Input type="datetime-local" value={returnDatetime} onChange={(e) => setReturnDatetime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Odometer End</label>
            <Input type="number" step="0.01" value={odometerEnd} onChange={(e) => setOdometerEnd(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Remarks</label>
            <textarea
              className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-sm"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Completing…' : 'Complete Trip'}
          </Button>
        </div>
      </div>
    </div>
  )
}
