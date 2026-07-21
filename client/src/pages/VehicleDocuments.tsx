import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as vehicleDocumentsApi from '@/api/vehicleDocuments'
import * as vehiclesApi from '@/api/vehicles'
import type { VehicleDocument, VehicleDocumentType } from '@/api/vehicleDocuments'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const TYPE_OPTIONS: { value: VehicleDocumentType; label: string }[] = [
  { value: 'VehicleLicense', label: 'Vehicle License' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'FitnessCertificate', label: 'Fitness Certificate' },
  { value: 'RadioLicense', label: 'Radio License' },
  { value: 'Other', label: 'Other' },
]
const typeLabel = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<VehicleDocumentType, string>

const statusBadge: Record<string, string> = {
  Valid: 'bg-green-600',
  ExpiringSoon: 'bg-amber-500',
  Expired: 'bg-destructive',
}
const statusLabel: Record<string, string> = { Valid: 'Valid', ExpiringSoon: 'Expiring Soon', Expired: 'Expired' }

// Translated from includes/vehicles/vehicleDocuments.php. Two real bugs fixed here (see
// MIGRATION_PLAN.md): the legacy <form> only ever had a document_type field (every other column
// the INSERT needed was missing from the HTML — reconstructed the full field set from the INSERT
// statement), and the file upload bound a typo'd variable so uploaded_file was always NULL despite
// the file landing on disk. "Renew" (dead link to a page that never existed, same class as
// editOrder.php) is built as a real edit action reusing the create fields, per established
// precedent from the Orders module.
export default function VehicleDocuments() {
  const { data: stats } = useQuery({ queryKey: ['vehicle-documents', 'stats'], queryFn: vehicleDocumentsApi.stats })
  const { data: documents, isLoading } = useQuery({ queryKey: ['vehicle-documents'], queryFn: vehicleDocumentsApi.list })
  const [renewing, setRenewing] = useState<VehicleDocument | null>(null)

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-4 text-xl font-bold">Vehicle Documents</h1>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h6 className="text-muted-foreground text-sm">Total Documents</h6>
          <p className="text-2xl font-bold">{stats?.totalDocs ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h6 className="text-muted-foreground text-sm">Expired</h6>
          <p className="text-2xl font-bold text-destructive">{stats?.expiredDocs ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h6 className="text-muted-foreground text-sm">Expiring Soon</h6>
          <p className="text-2xl font-bold text-amber-500">{stats?.expiringDocs ?? 0}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Add Document</h2>
        <DocumentForm mode="add" />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Type</th>
              <th className="p-3">Number</th>
              <th className="p-3">Issue Date</th>
              <th className="p-3">Expiry Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Document</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && (documents ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  No documents yet.
                </td>
              </tr>
            )}
            {documents?.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.vehicle.registrationNumber}</td>
                <td className="p-3">{typeLabel[d.documentType]}</td>
                <td className="p-3">{d.documentNumber}</td>
                <td className="p-3">{new Date(d.issueDate).toLocaleDateString()}</td>
                <td className="p-3">{new Date(d.expiryDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${statusBadge[d.status]}`}>
                    {statusLabel[d.status]}
                  </span>
                </td>
                <td className="p-3">
                  {d.uploadedFile ? (
                    <a href={d.uploadedFile} target="_blank" rel="noreferrer" className="text-xs underline">
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="p-3">
                  <Button size="sm" variant="secondary" onClick={() => setRenewing(d)}>
                    Renew
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Renew Document</h2>
            <DocumentForm mode="renew" document={renewing} onSaved={() => setRenewing(null)} />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setRenewing(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentForm({
  mode,
  document,
  onSaved,
}: {
  mode: 'add' | 'renew'
  document?: VehicleDocument
  onSaved?: () => void
}) {
  const queryClient = useQueryClient()
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: vehiclesApi.list })

  const [form, setForm] = useState({
    vehicleId: document ? String(document.vehicleId) : '',
    documentType: document?.documentType ?? ('' as VehicleDocumentType | ''),
    documentNumber: document?.documentNumber ?? '',
    issueDate: document ? document.issueDate.slice(0, 10) : '',
    expiryDate: document ? document.expiryDate.slice(0, 10) : '',
    reminderDays: document ? String(document.reminderDays) : '30',
    notes: document?.notes ?? '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        vehicleId: Number(form.vehicleId),
        documentType: form.documentType as VehicleDocumentType,
        documentNumber: form.documentNumber,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        reminderDays: Number(form.reminderDays),
        notes: form.notes || undefined,
        file: file ?? undefined,
      }
      return mode === 'add' ? vehicleDocumentsApi.create(input) : vehicleDocumentsApi.update(document!.id, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-documents'] })
      if (mode === 'add') {
        setSuccess('Document saved successfully.')
        setForm({ vehicleId: '', documentType: '', documentNumber: '', issueDate: '', expiryDate: '', reminderDays: '30', notes: '' })
        setFile(null)
      } else {
        onSaved?.()
      }
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to save document.') : 'Failed to save document.')
    },
  })

  return (
    <div className="space-y-3">
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
          <label className="text-sm font-medium">Document Type</label>
          <select
            className={selectClass}
            value={form.documentType}
            onChange={(e) => setForm({ ...form, documentType: e.target.value as VehicleDocumentType })}
          >
            <option value="">Select Document</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Document Number</label>
          <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Issue Date</label>
          <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Expiry Date</label>
          <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Reminder Days</label>
          <Input type="number" value={form.reminderDays} onChange={(e) => setForm({ ...form, reminderDays: e.target.value })} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">
            Document File {mode === 'renew' && <span className="text-muted-foreground text-xs">(optional — leave blank to keep current)</span>}
          </label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="col-span-full space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-sm"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : mode === 'add' ? 'Save Document' : 'Save Renewal'}
      </Button>
    </div>
  )
}
