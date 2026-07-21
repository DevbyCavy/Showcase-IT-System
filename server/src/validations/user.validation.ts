import { z } from 'zod'
import { Role } from '@prisma/client'

// signup.php's role dropdown excludes Super Admin — preserved exactly (see MIGRATION_PLAN.md).
const SIGNUP_ROLES = [
  Role.StoresAdmin,
  Role.ProjectManager,
  Role.Accountant,
  Role.GraphicDesigner,
  Role.ProductionTeam,
  Role.Logistics,
] as const

const emailField = z
  .string()
  .trim()
  .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Invalid email format')
  .optional()
  .default('')

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
  password: z.string().min(1).optional(),
})

export type UpdateUserBody = z.infer<typeof updateUserSchema>
