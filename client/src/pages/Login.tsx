import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

// Mirrors index.php's login form validation: both fields simply required, no format rules.
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginForm) {
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
    <div className="flex min-h-svh items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6">
        <div className="mb-4 flex justify-center">
          <img src="/showcaseit-icon.png" alt="ShowcaseIT" className="h-14 w-14" />
        </div>
        <h1 className="mb-6 text-center text-xl font-semibold">Sign In</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>
          )}

          <div className="space-y-1">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input id="username" autoComplete="username" {...register('username')} />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>

          <p className="flex items-center justify-center gap-2 text-sm">
            <span>No Account?</span>
            <Link to="/signup" className="hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
