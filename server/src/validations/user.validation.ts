import { z } from 'zod'
import { Role } from '@prisma/client'
import { isValidPhoneNumber } from 'libphonenumber-js'

// signup.php's role dropdown excludes Super Admin — preserved exactly (see MIGRATION_PLAN.md).
// Marketer added per MIGRATION_PLAN.md §21 — it wasn't part of the original preserved list since
// the role didn't exist as a live option at migration time.
const SIGNUP_ROLES = [
  Role.StoresAdmin,
  Role.ProjectManager,
  Role.Accountant,
  Role.GraphicDesigner,
  Role.ProductionTeam,
  Role.Logistics,
  Role.Marketer,
] as const

const emailField = z
  .string()
  .trim()
  .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Invalid email format')
  .optional()
  .default('')

const whatsappNumberField = z
  .string()
  .trim()
  .min(1, 'WhatsApp Number is required')
  .refine((v) => isValidPhoneNumber(v), 'Invalid WhatsApp number — include the country code, e.g. +27821234567')

// Translated from signup.php's validation block.
export const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'First Name is required'),
    surname: z.string().trim().min(1, 'Surname is required'),
    username: z.string().trim().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
    department: z.string().trim().min(1, 'Department is required'),
    userType: z.enum(SIGNUP_ROLES, { message: 'User Type is required' }),
    email: emailField,
    whatsappNumber: whatsappNumberField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignupBody = z.infer<typeof signupSchema>

// Admin-side edit (Module 3 completes the CRUD manage_users.php's dead Edit link never had).
export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  surname: z.string().trim().min(1).optional(),
  username: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  userType: z.enum(Role).optional(),
  email: emailField,
  whatsappNumber: whatsappNumberField.optional(),
  password: z.string().min(1).optional(),
})

export type UpdateUserBody = z.infer<typeof updateUserSchema>
