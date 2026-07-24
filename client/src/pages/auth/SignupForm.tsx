import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { User, Users, Briefcase, Building2, Phone, Mail, Lock, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PillInput, PillSelect } from '@/components/ui/pill-input'
import * as usersApi from '@/api/users'
import { JOB_TITLE_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/userOptions'

// Mirrors signup.php's validation exactly (email optional but must be valid if given), plus the
// new required WhatsApp Number used to notify assignees when an order is created.
const signupSchema = z
  .object({
    name: z.string().min(1, 'First Name is required'),
    surname: z.string().min(1, 'Surname is required'),
    userType: z.string().min(1, 'User Type is required'),
    department: z.string().min(1, 'Department is required'),
    whatsappNumber: z
      .string()
      .min(1, 'WhatsApp Number is required')
      .refine((v) => isValidPhoneNumber(v), 'Invalid WhatsApp number — include the country code, e.g. +27821234567'),
    email: z.union([z.literal(''), z.string().email('Invalid email format')]),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema), defaultValues: { email: '' } })

  async function onSubmit(values: SignupFormValues) {
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
    <div className="mx-auto w-full max-w-md">
      <div className="mb-5 text-center">
        <p className="text-muted-foreground text-sm">Create your account to get started.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        {serverError && (
          <div className="rounded-full bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">{serverError}</div>
        )}
        {success && (
          <div className="rounded-2xl bg-primary/10 px-4 py-2 text-center text-sm">Account created — you can now sign in.</div>
        )}

        <div>
          <PillInput icon={User} placeholder="First Name" {...register('name')} />
          {errors.name && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div>
          <PillInput icon={Users} placeholder="Surname" {...register('surname')} />
          {errors.surname && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.surname.message}</p>}
        </div>

        <div>
          <PillSelect icon={Briefcase} defaultValue="" {...register('userType')}>
            <option value="" disabled>
              Select Job Title
            </option>
            {JOB_TITLE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.role}>
                {opt.label}
              </option>
            ))}
          </PillSelect>
          {errors.userType && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.userType.message}</p>}
        </div>

        <div>
          <PillSelect icon={Building2} defaultValue="" {...register('department')}>
            <option value="" disabled>
              Select Department
            </option>
            {DEPARTMENT_OPTIONS.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </PillSelect>
          {errors.department && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.department.message}</p>}
        </div>

        <div>
          <PillInput icon={Phone} type="tel" placeholder="WhatsApp Number (+27821234567)" {...register('whatsappNumber')} />
          {errors.whatsappNumber && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.whatsappNumber.message}</p>}
        </div>

        <div>
          <PillInput icon={Mail} type="email" placeholder="Email (optional)" {...register('email')} />
          {errors.email && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <PillInput icon={User} placeholder="Username" {...register('username')} />
          {errors.username && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <div>
          <PillInput icon={Lock} type="password" placeholder="Password" {...register('password')} />
          {errors.password && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div>
          <PillInput icon={KeyRound} type="password" placeholder="Confirm Password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mx-auto flex w-[85%] rounded-full bg-gradient-to-r from-brand-orange to-brand-orange-dark text-white shadow-lg transition-colors duration-500 hover:opacity-90"
        >
          {isSubmitting ? 'Signing up…' : 'Sign Up'}
        </Button>
      </form>
    </div>
  )
}
