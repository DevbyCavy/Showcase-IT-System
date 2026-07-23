import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as maintenanceLogsApi from '@/api/maintenanceLogs'
import * as vehiclesApi from '@/api/vehicles'
import type { MaintenanceLog, MaintenanceType } from '@/api/maintenanceLogs'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const TYPE_OPTIONS: { value: MaintenanceType; label: string }[] = [
  { value: 'Service', label: 'Service' },
  { value: 'OilChange', label: 'Oil Change' },
  { value: 'TyreReplacement', label: 'Tyre Replacement' },
  { value: 'BrakeRepair', label: 'Brake Repair' },
  { value: 'EngineRepair', label: 'Engine Repair' },
  { value: 'AccidentRepair', label: 'Accident Repair' },
  { value: 'Other', label: 'Other' },
]
const typeLabel = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<MaintenanceType, string>

// Translated from includes/vehicles/maintananceLog.php. (The legacy page's own <h3> heading says
// "Fuel Log" — a copy-paste leftover from fuelLog.php, contradicted by its own breadcrumb and card
// header a few lines later, which both correctly say "Maintenance Log" — used the correct text
// here rather than reproducing the typo.)
export default function MaintenanceLogs() {
  const queryClient = useQueryClient()
  const { data: stats } = useQuery({ queryKey: ['maintenance-logs', 'stats'], queryFn: maintenanceLogsApi.stats })
  const { data: history } = useQuery({ queryKey: ['maintenance-logs'], queryFn: maintenanceLogsApi.list })
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: vehiclesApi.list })

  const [form, setForm] = useState({
    vehicleId: '',
    maintenanceType: '' as MaintenanceType | '',
    serviceProvider: '',
    serviceDate: '',
    odometerReading: '',
    serviceCost: '',
    nextServiceDate: '',
    nextServiceOdometer: '',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceLogsApi.create({
        vehicleId: Number(form.vehicleId),
        maintenanceType: form.maintenanceType as MaintenanceType,
        serviceProvider: form.serviceProvider || undefined,
        serviceDate: form.serviceDate,
        odometerReading: form.odometerReading ? Number(form.odometerReading) : undefined,
        serviceCost: form.serviceCost ? Number(form.serviceCost) : undefined,
        nextServiceDate: form.nextServiceDate || undefined,
        nextServiceOdometer: form.nextServiceOdometer ? Number(form.nextServiceOdometer) : undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] })
      setSuccess('Maintenance record saved successfully.')
      setForm({
        vehicleId: '',
        maintenanceType: '',
        serviceProvider: '',
        serviceDate: '',
        odometerReading: '',
        serviceCost: '',
        nextServiceDate: '',
        nextServiceOdometer: '',
        notes: '',
      })
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to save maintenance record.') : 'Failed to save maintenance record.')
    },
  })

  const historyColumns: DataTableColumn<MaintenanceLog>[] = [
    { key: 'date', header: 'Date', render: (h) => new Date(h.serviceDate).toLocaleDateString() },
    { key: 'vehicle', header: 'Vehicle', render: (h) => h.vehicle.registrationNumber },
    { key: 'type', header: 'Type', render: (h) => typeLabel[h.maintenanceType] },
    { key: 'provider', header: 'Provider', render: (h) => h.serviceProvider },
    { key: 'cost', header: 'Cost', render: (h) => `$${Number(h.serviceCost ?? 0).toFixed(2)}` },
    { key: 'next', header: 'Next Service', render: (h) => (h.nextServiceDate ? new Date(h.nextServiceDate).toLocaleDateString() : '—') },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Maintenance Log" />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Total Services</h6>
            <p className="text-2xl font-bold">{stats?.totalServices ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Total Maintenance Cost</h6>
            <p className="text-2xl font-bold">${Number(stats?.totalCost ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h6 className="text-muted-foreground text-sm">Services Due Soon</h6>
            <p className="text-2xl font-bold">{stats?.dueServices ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5">
        <CardContent className="space-y-3">
        <h2 className="font-semibold">Maintenance Log</h2>

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
            <label className="text-sm font-medium">Maintenance Type</label>
            <select
              className={selectClass}
              value={form.maintenanceType}
              onChange={(e) => setForm({ ...form, maintenanceType: e.target.value as MaintenanceType })}
            >
              <option value="">Select Type</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Service Provider</label>
            <Input value={form.serviceProvider} onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Service Date</label>
            <Input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Odometer</label>
            <Input type="number" step="0.01" value={form.odometerReading} onChange={(e) => setForm({ ...form, odometerReading: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Service Cost</label>
            <Input type="number" step="0.01" value={form.serviceCost} onChange={(e) => setForm({ ...form, serviceCost: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Next Service Date</label>
            <Input type="date" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Next Service Odometer</label>
            <Input
              type="number"
              step="0.01"
              value={form.nextServiceOdometer}
              onChange={(e) => setForm({ ...form, nextServiceOdometer: e.target.value })}
            />
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
          {mutation.isPending ? 'Saving…' : 'Save Maintenance Record'}
        </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Maintenance History</h2>
      <DataTable columns={historyColumns} data={history ?? []} keyExtractor={(h) => h.id} emptyMessage="No maintenance records yet." />
    </div>
  )
}
