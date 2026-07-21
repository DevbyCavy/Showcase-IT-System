import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as vehiclesApi from '@/api/vehicles'
import * as usersApi from '@/api/users'
import type { Vehicle, VehicleInput, FuelType, VehicleStatus } from '@/api/vehicles'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const statusLabel: Record<VehicleStatus, string> = {
  Available: 'Available',
  OnTrip: 'On Trip',
  UnderMaintenance: 'Under Maintenance',
  OutOfService: 'Out of Service',
}
const statusBadge: Record<VehicleStatus, string> = {
  Available: 'bg-green-600',
  OnTrip: 'bg-blue-600',
  UnderMaintenance: 'bg-amber-500',
  OutOfService: 'bg-destructive',
}

// Translated from includes/vehicles/vehicleRegister.php + getVehicle.php + getVehicleDetails.php
// + deleteVehicle.php. manageLogistics.php had no auth check at all — server applies the same
// authenticate-only default used everywhere else.
export default function Vehicles() {
  const queryClient = useQueryClient()
  const { data: vehicles, isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: vehiclesApi.list })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; vehicle: Vehicle } | null>(null)
  const [viewing, setViewing] = useState<Vehicle | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vehiclesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const filtered = (vehicles ?? []).filter((v) =>
    [v.registrationNumber, v.make, v.model, v.department].join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Vehicle Register</h1>
        <Button onClick={() => setModal({ mode: 'add' })}>+ Add Vehicle</Button>
      </div>

      <Input placeholder="Search vehicle..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">Reg Number</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Department</th>
              <th className="p-3">Assigned User</th>
              <th className="p-3">Status</th>
              <th className="p-3">Purchase Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  No vehicles found.
                </td>
              </tr>
            )}
            {filtered.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="p-3">{v.registrationNumber}</td>
                <td className="p-3">
                  {v.make} {v.model}
                </td>
                <td className="p-3">{v.department}</td>
                <td className="p-3">
                  {v.assignedUser ? `${v.assignedUser.name} ${v.assignedUser.surname}` : '—'}
                </td>
                <td className="p-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${statusBadge[v.status]}`}>
                    {statusLabel[v.status]}
                  </span>
                </td>
                <td className="p-3">{new Date(v.purchaseDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setViewing(v)}>
                      View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', vehicle: v })}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Delete this vehicle?')) deleteMutation.mutate(v.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <VehicleModal modal={modal} onClose={() => setModal(null)} />}
      {viewing && <VehicleDetailsModal vehicle={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function VehicleDetailsModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Vehicle Details</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Registration</dt>
            <dd>{vehicle.registrationNumber}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Vehicle</dt>
            <dd>
              {vehicle.make} {vehicle.model}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Year</dt>
            <dd>{vehicle.vehicleYear}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Colour</dt>
            <dd>{vehicle.color}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Fuel Type</dt>
            <dd>{vehicle.fuelType}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Status</dt>
            <dd>{statusLabel[vehicle.status]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Department</dt>
            <dd>{vehicle.department}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Assigned User</dt>
            <dd>{vehicle.assignedUser ? `${vehicle.assignedUser.name} ${vehicle.assignedUser.surname}` : '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground text-xs">Notes</dt>
            <dd className="whitespace-pre-wrap">{vehicle.notes || '—'}</dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

function VehicleModal({
  modal,
  onClose,
}: {
  modal: { mode: 'add' } | { mode: 'edit'; vehicle: Vehicle }
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const existing = modal.mode === 'edit' ? modal.vehicle : null
  const { data: users } = useQuery({ queryKey: ['users', 'assignable'], queryFn: usersApi.listAssignable })

  const [form, setForm] = useState<VehicleInput>({
    registrationNumber: existing?.registrationNumber ?? '',
    make: existing?.make ?? '',
    model: existing?.model ?? '',
    vehicleYear: existing?.vehicleYear,
    color: existing?.color ?? '',
    fuelType: existing?.fuelType ?? 'Petrol',
    capacity: existing?.capacity ?? '',
    department: existing?.department ?? '',
    assignedUserId: existing?.assignedUserId ?? null,
    status: existing?.status ?? 'Available',
    purchaseDate: existing?.purchaseDate ? existing.purchaseDate.slice(0, 10) : '',
    notes: existing?.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => (modal.mode === 'add' ? vehiclesApi.create(form) : vehiclesApi.update(modal.vehicle.id, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Save failed') : 'Save failed')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{modal.mode === 'add' ? 'Add Vehicle' : 'Edit Vehicle'}</h2>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Registration Number</label>
            <Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Make</label>
            <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Model</label>
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Year</label>
            <Input
              type="number"
              value={form.vehicleYear ?? ''}
              onChange={(e) => setForm({ ...form, vehicleYear: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Colour</label>
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fuel Type</label>
            <select
              className={selectClass}
              value={form.fuelType}
              onChange={(e) => setForm({ ...form, fuelType: e.target.value as FuelType })}
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Capacity</label>
            <Input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Department</label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Assigned User</label>
            <select
              className={selectClass}
              value={form.assignedUserId ?? ''}
              onChange={(e) => setForm({ ...form, assignedUserId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Select User</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.surname}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
            >
              <option value="Available">Available</option>
              <option value="OnTrip">On Trip</option>
              <option value="UnderMaintenance">Under Maintenance</option>
              <option value="OutOfService">Out of Service</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Purchase Date</label>
            <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
          </div>
          <div className="col-span-full space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-sm"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : modal.mode === 'add' ? 'Save Vehicle' : 'Update Vehicle'}
          </Button>
        </div>
      </div>
    </div>
  )
}
