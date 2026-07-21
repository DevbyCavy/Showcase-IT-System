import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as usersApi from '@/api/users'
import { JOB_TITLE_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/userOptions'

// Mirrors signup.php's validation exactly (email optional but must be valid if given).
const signupSchema = z
  .object({
    name: z.string().min(1, 'First Name is required'),
    surname: z.string().min(1, 'Surname is required'),
    userType: z.string().min(1, 'User Type is required'),
    department: z.string().min(1, 'Department is required'),
    email: z.union([z.literal(''), z.string().email('Invalid email format')]),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupForm = z.infer<typeof signupSchema>

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export default function Signup() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema), defaultValues: { email: '' } })

  async function onSubmit(values: SignupForm) {
    setServerError(null)
    try {
      await usersApi.signup(values)
      setSuccess(true)
      reset()
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined
      setServerError(message ?? 'Failed to create account.')
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">Sign Up</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>
          )}
          {success && (
            <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">
              Account created successfully. You may now{' '}
              <Link to="/login" className="underline">
                log in
              </Link>
              .
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Surname</label>
            <Input {...register('surname')} />
            {errors.surname && <p className="text-xs text-destructive">{errors.surname.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Job Title</label>
            <select className={selectClass} defaultValue="" {...register('userType')}>
              <option value="" disabled>
                Select Job Title
              </option>
              {JOB_TITLE_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.role}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.userType && <p className="text-xs text-destructive">{errors.userType.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Department</label>
            <select className={selectClass} defaultValue="" {...register('department')}>
              <option value="" disabled>
                Select Department
              </option>
              {DEPARTMENT_OPTIONS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
            {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Email <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Username</label>
            <Input {...register('username')} />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Confirm Password</label>
            <Input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing up…' : 'Sign Up'}
          </Button>

          <p className="text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:underline">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
