import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { FileDown, FileSpreadsheet, HelpCircle, Send } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import * as takeoffDesignsApi from '@/api/takeoffDesigns'
import type { TakeoffClarification, TakeoffItem, TakeoffItemCategory } from '@/api/takeoffDesigns'

const CATEGORIES: TakeoffItemCategory[] = ['Structure', 'Cladding', 'Electrical', 'Furniture', 'Other']

const SOURCE_BADGE: Record<TakeoffItem['source'], string> = {
  Extracted: 'bg-green-600',
  Predicted: 'bg-amber-500',
  Inferred: 'bg-amber-500',
}

function isTerminal(status: string) {
  return status === 'Ready' || status === 'Failed'
}

export default function TakeoffDesignReview() {
  const { designId } = useParams<{ designId: string }>()
  const id = Number(designId)
  const queryClient = useQueryClient()
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const { data: design, isLoading } = useQuery({
    queryKey: ['takeoffDesigns', id],
    queryFn: () => takeoffDesignsApi.getOne(id),
    refetchInterval: (query) => (query.state.data && !isTerminal(query.state.data.status) ? 15000 : false),
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, patch }: { itemId: number; patch: takeoffDesignsApi.TakeoffItemUpdateInput }) =>
      takeoffDesignsApi.updateItem(id, itemId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['takeoffDesigns', id] }),
  })

  const categoryData = useMemo(() => {
    const counts = new Map<TakeoffItemCategory, number>()
    for (const item of design?.items ?? []) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }
    return CATEGORIES.filter((c) => counts.has(c)).map((category) => ({ category, count: counts.get(category)! }))
  }, [design?.items])

  async function handleExport(kind: 'xlsx' | 'pdf') {
    setDownloadError(null)
    try {
      if (kind === 'xlsx') await takeoffDesignsApi.downloadXlsx(id)
      else await takeoffDesignsApi.downloadQuotationPdf(id)
    } catch {
      setDownloadError(`Failed to export ${kind === 'xlsx' ? '.xlsx' : 'PDF'}.`)
    }
  }

  if (isLoading || !design) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <PageHeader title="Design Review" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (design.status === 'Pending' || design.status === 'Processing') {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <PageHeader title={design.originalFilename} subtitle={design.project.name} />
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="border-brand-orange mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="font-medium">Extracting quantities…</p>
          <p className="text-muted-foreground mt-1 text-sm">This page updates automatically once it's ready.</p>
        </div>
      </div>
    )
  }

  if (design.status === 'Failed') {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <PageHeader title={design.originalFilename} subtitle={design.project.name} />
        <div className="bg-destructive/10 text-destructive rounded-2xl border p-6">
          <p className="font-medium">Extraction failed.</p>
          {design.failureReason && <p className="mt-1 text-sm">{design.failureReason}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <PageHeader
        title={design.originalFilename}
        subtitle={design.project.name}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export .xlsx
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileDown className="mr-1.5 h-4 w-4" /> Export Quotation PDF
            </Button>
          </div>
        }
      />
      {downloadError && <div className="bg-destructive/10 text-destructive mb-4 rounded-md px-3 py-2 text-sm">{downloadError}</div>}

      {design.status === 'NeedsInput' && (
        <ClarificationModal
          designId={id}
          clarifications={design.clarifications.filter((c) => c.status === 'Pending')}
          onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['takeoffDesigns', id] })}
        />
      )}

      {categoryData.length > 0 && (
        <div className="mb-8 rounded-2xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Line Items by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Items" fill="#ff7b00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Review Items</h2>
        <p className="text-muted-foreground text-xs">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" /> Predicted or inferred — review before
          exporting.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Description</th>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Category</th>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Material</th>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">W×H×L (mm)</th>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Unit</th>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Qty</th>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Source</th>
              <th className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Notes</th>
            </tr>
          </thead>
          <tbody>
            {design.items.map((item) => (
              <ReviewRow
                key={item.id}
                item={item}
                onSave={(patch) => updateItemMutation.mutate({ itemId: item.id, patch })}
              />
            ))}
            {design.items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted-foreground p-8 text-center">
                  No line items were extracted from this design.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// A centered modal that steps through one open clarifying question at a time (chat-style: a
// question, an input, a round send button) rather than a long form of every question at once.
// Answers are held locally and only POSTed as one batch after the last question — the backend's
// one-clarification-round finalization pass expects a single complete set of answers, not a
// trickle of partial submissions.
function ClarificationModal({
  designId,
  clarifications,
  onSubmitted,
}: {
  designId: number
  clarifications: TakeoffClarification[]
  onSubmitted: () => void
}) {
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (finalAnswers: Record<number, string>) =>
      takeoffDesignsApi.answerClarifications(
        designId,
        clarifications.map((c) => ({ clarificationId: c.id, answer: finalAnswers[c.id] })),
      ),
    onSuccess: () => {
      setError(null)
      onSubmitted()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to submit answers') : 'Failed to submit answers')
    },
  })

  if (clarifications.length === 0) return null

  const current = clarifications[index]
  const isLast = index === clarifications.length - 1

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || mutation.isPending) return
    const nextAnswers = { ...answers, [current.id]: trimmed }
    setAnswers(nextAnswers)
    if (isLast) {
      mutation.mutate(nextAnswers)
    } else {
      setValue('')
      setIndex((i) => i + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6">
        <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium">
          <HelpCircle className="text-brand-orange h-4 w-4" />
          Question {index + 1} of {clarifications.length} — {current.topic}
        </div>
        <p className="mb-4 text-base font-medium">{current.question}</p>

        {error && <div className="bg-destructive/10 text-destructive mb-3 rounded-md px-3 py-2 text-sm">{error}</div>}

        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            placeholder="Your answer…"
            disabled={mutation.isPending}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={handleSend}
            disabled={mutation.isPending || !value.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-muted-foreground mt-3 text-xs">
          {mutation.isPending
            ? 'Finalizing the BOQ with your answers…'
            : 'Answers help finalize this design and teach the system for future ones.'}
        </p>
      </div>
    </div>
  )
}

function ReviewRow({ item, onSave }: { item: TakeoffItem; onSave: (patch: takeoffDesignsApi.TakeoffItemUpdateInput) => void }) {
  const [description, setDescription] = useState(item.description)
  const [material, setMaterial] = useState(item.material ?? '')
  const [quantity, setQuantity] = useState(item.quantity)
  const [notes, setNotes] = useState(item.notes ?? '')

  const dims = [item.widthMm, item.heightMm, item.lengthMm].filter((v) => v != null)

  return (
    <tr className={`border-t ${item.source !== 'Extracted' ? 'bg-amber-50' : ''}`}>
      <td className="p-1">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => onSave({ description })} />
      </td>
      <td className="p-1">{item.category}</td>
      <td className="p-1">
        <Input value={material} onChange={(e) => setMaterial(e.target.value)} onBlur={() => onSave({ material: material || null })} />
      </td>
      <td className="text-muted-foreground p-3 whitespace-nowrap">{dims.length ? dims.map((v) => Number(v)).join(' × ') : '—'}</td>
      <td className="p-3">{item.unit}</td>
      <td className="p-1 w-24">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => onSave({ quantity: Number(quantity) })}
        />
      </td>
      <td className="p-3">
        <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${SOURCE_BADGE[item.source]}`}>{item.source}</span>
      </td>
      <td className="p-1 min-w-48">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => onSave({ notes: notes || null })} />
      </td>
    </tr>
  )
}
