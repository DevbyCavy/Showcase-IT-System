import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import * as fuelLogsApi from '@/api/fuelLogs'
import * as vehiclesApi from '@/api/vehicles'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Translated from includes/vehicles/fuelLog.php. Note: the legacy page only ever shows these three
// aggregate stat cards plus the add-entry form — there is no history/list table for fuel_logs
// anywhere in the app (confirmed: fuel_logs is queried nowhere else). Not replicated further than
// this, since there's no evidence (dead link, etc.) that a list view was ever intended.
export default function FuelLogs() {
  const queryClient = useQueryClient()
  const { data: stats } = useQuery({ queryKey: ['fuel-logs', 'stats'], queryFn: fuelLogsApi.stats })
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: vehiclesApi.list })

  const [form, setForm] = useState({
    vehicleId: '',
    fuelDate: '',
    odometerReading: '',
    litres: '',
    fuelCost: '',
    fuelStation: '',
    receiptNumber: '',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      fuelLogsApi.create({
        vehicleId: Number(form.vehicleId),
        fuelDate: form.fuelDate,
        odometerReading: Number(form.odometerReading),
        litres: Number(form.litres),
        fuelCost: Number(form.fuelCost),
        fuelStation: form.fuelStation || undefined,
        receiptNumber: form.receiptNumber || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs', 'stats'] })
      setSuccess('Fuel entry saved successfully.')
      setForm({ vehicleId: '', fuelDate: '', odometerReading: '', litres: '', fuelCost: '', fuelStation: '', receiptNumber: '', notes: '' })
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to save fuel entry.') : 'Failed to save fuel entry.')
    },
  })

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Fuel Log" />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Total Entries</h6>
            <p className="text-2xl font-bold">{stats?.totalEntries ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Total Litres</h6>
            <p className="text-2xl font-bold">{Number(stats?.totalLitres ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Total Fuel Cost</h6>
            <p className="text-2xl font-bold">${Number(stats?.totalFuelCost ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3">
        <h2 className="font-semibold">Add Fuel Entry</h2>

        {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Vehicle</label>
            <select className={selectClass} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Select Vehicle</option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} - {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fuel Date</label>
            <Input type="date" value={form.fuelDate} onChange={(e) => setForm({ ...form, fuelDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Odometer Reading</label>
            <Input type="number" step="0.01" value={form.odometerReading} onChange={(e) => setForm({ ...form, odometerReading: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Litres</label>
            <Input type="number" step="0.01" value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fuel Cost</label>
            <Input type="number" step="0.01" value={form.fuelCost} onChange={(e) => setForm({ ...form, fuelCost: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fuel Station</label>
            <Input value={form.fuelStation} onChange={(e) => setForm({ ...form, fuelStation: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Receipt Number</label>
            <Input value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} />
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

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save Fuel Entry'}
        </Button>
        </CardContent>
      </Card>
    </div>
  )
}
