import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { User, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PillInput } from '@/components/ui/pill-input'
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '@/components/icons/SocialIcons'
import { useAuth } from '@/hooks/useAuth'

// Mirrors index.php's login form validation: both fields simply required, no format rules.
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSwitchToSignup: () => void
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    try {
      await login(values.username, values.password)
      // Every role lands on the same dashboard content (the Orders Kanban) — see App.tsx.
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined
      setServerError(message ?? 'Incorrect username or password')
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="bg-secondary flex h-16 w-16 items-center justify-center rounded-full">
          <User className="text-muted-foreground h-8 w-8" />
        </div>
        <p className="text-muted-foreground text-sm">Sign in below to get started.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="rounded-full bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">{serverError}</div>
        )}

        <div>
          <PillInput icon={User} placeholder="Username" autoComplete="username" {...register('username')} />
          {errors.username && (
            <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div>
          <PillInput
            icon={Lock}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="mx-auto mt-1 w-[85%] pl-4 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <label className="text-muted-foreground mx-auto flex w-[85%] items-center gap-2 pl-1 text-sm">
          <input type="checkbox" className="border-input h-4 w-4 rounded" />
          Keep me logged in
        </label>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mx-auto flex w-[85%] rounded-full bg-gradient-to-r from-brand-orange to-brand-orange-dark text-white shadow-lg transition-colors duration-500 hover:opacity-90"
        >
          {isSubmitting ? 'Signing in…' : 'Login'}
        </Button>

        {/* Desktop only — mobile has its own toggle text rendered by Auth.tsx below the active form. */}
        <p className="text-muted-foreground hidden text-center text-sm md:block">
          New User?{' '}
          <button type="button" onClick={onSwitchToSignup} className="text-brand-orange font-medium hover:underline">
            Register here
          </button>
        </p>

        <div className="flex items-center justify-center gap-3 pt-1">
          <a
            href="#"
            aria-label="Instagram"
            className="text-brand-orange border-brand-orange/30 hover:bg-brand-orange flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:text-white"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="Facebook"
            className="text-brand-orange border-brand-orange/30 hover:bg-brand-orange flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:text-white"
          >
            <FacebookIcon className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="LinkedIn"
            className="text-brand-orange border-brand-orange/30 hover:bg-brand-orange flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:text-white"
          >
            <LinkedinIcon className="h-4 w-4" />
          </a>
        </div>
      </form>
    </div>
  )
}
