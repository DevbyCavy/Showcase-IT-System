import { z } from 'zod'
import { VehicleDocumentType } from '#prisma-client'

// vehicleDocuments.php's actual <form> only ever rendered a document_type <select> — every other
// field the INSERT statement expects (vehicle, document number, dates, reminder days) was simply
// missing from the HTML, so the legacy "Save Document" feature could never have worked regardless
// of the uploadeFile typo. Reconstructed the full field set here from the INSERT column list and
// the file-upload handler, matching the sibling fuelLog/maintenanceLog forms' conventions.
export const vehicleDocumentSchema = z.object({
  vehicleId: z.coerce.number({ message: 'Please select a vehicle' }).int().positive('Please select a vehicle'),
  documentType: z.enum(VehicleDocumentType, { message: 'Please select a document type' }),
  documentNumber: z.string().trim().min(1, 'Document Number is required'),
  issueDate: z.coerce.date({ message: 'Issue Date is required' }),
  expiryDate: z.coerce.date({ message: 'Expiry Date is required' }),
  reminderDays: z.coerce.number({ message: 'Reminder Days is required' }).int().min(0),
  notes: z.string().trim().optional(),
})

export type VehicleDocumentBody = z.infer<typeof vehicleDocumentSchema>
