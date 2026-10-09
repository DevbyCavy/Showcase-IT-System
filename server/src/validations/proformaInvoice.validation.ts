import { z } from 'zod'
import { InvoicePaymentStatus, PaymentMethod } from '#prisma-client'

// Money arrives as a string (or number) and is validated as a plain 2-decimal amount before it's
// ever turned into a Prisma.Decimal — never parsed through a JS float.
const amountField = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), { message: 'Amount must be a valid amount with at most 2 decimal places.' })
  .refine((v) => Number(v) > 0, { message: 'Amount must be greater than zero.' })

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))

export const recordPaymentSchema = z.object({
  amount: amountField,
  paymentDate: z.coerce.date({ message: 'Payment date is required.' }),
  method: z.enum(PaymentMethod, { message: 'Please choose a valid payment method.' }),
  reference: optionalText,
  notes: optionalText,
  // Generated once per open payment form on the client; a retry of the same submission reuses it.
  idempotencyKey: z.string().trim().min(8, 'Missing submission key.').max(100),
})

export type RecordPaymentBody = z.infer<typeof recordPaymentSchema>

export const invoiceListQuerySchema = z.object({
  status: z.enum(InvoicePaymentStatus).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
})

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>
