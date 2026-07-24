import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoginForm } from './auth/LoginForm'
import { SignupForm } from './auth/SignupForm'

type Mode = 'login' | 'signup'

interface AuthProps {
  initialMode: Mode
}

// Combined Sign In / Sign Up card — replaces the old separate /login and /signup pages. Both
// forms stay mounted side by side and a gradient overlay panel slides across on top of whichever
// one isn't active, matching the reference design's "circle rolls to the side" toggle.
export default function Auth({ initialMode }: AuthProps) {
  const [mode, setMode] = useState<Mode>(initialMode)

  // Deliberately NOT react-router's navigate() here: /login and /signup are separate routes
  // rendering separate page components, so navigating between them unmounts and remounts this
  // whole component — killing the CSS transition entirely (it just snaps to the end state with
  // no animation, which is what read as the circle/logo "breaking"). Updating the URL directly
  // keeps the address bar in sync (so a manual refresh still lands on the right mode) without
  // tearing down the animated DOM.
  function switchMode(next: Mode) {
    setMode(next)
    window.history.replaceState(null, '', next === 'login' ? '/login' : '/signup')
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-sidebar-from to-sidebar-to p-4">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-card shadow-2xl">
        {/* Mobile: one active form + a text toggle, no room for the slide animation */}
        <div className="p-6 md:hidden">
          <div className="mb-4 flex justify-center">
            <img src="/showcaseit-icon.png" alt="ShowcaseIT" className="h-14 w-14 shrink-0 object-contain" />
          </div>
          {mode === 'login' ? <LoginForm onSwitchToSignup={() => switchMode('signup')} /> : <SignupForm />}
          <p className="text-muted-foreground mt-4 text-center text-sm">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button type="button" className="text-brand-orange font-medium hover:underline" onClick={() => switchMode('signup')}>
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" className="text-brand-orange font-medium hover:underline" onClick={() => switchMode('login')}>
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>

        {/* Desktop: both forms mounted side by side, gradient overlay slides between them. The
            panel currently covered by the overlay is inert — visually hidden behind it, but
            without this it would stay focusable/fillable, which is both confusing for keyboard
            users and lets a hidden form get submitted by mistake. */}
        <div className="relative hidden md:flex md:items-stretch">
          <div
            className="flex w-1/2 items-center justify-center px-12 py-14"
            aria-hidden={mode === 'signup'}
            inert={mode === 'signup' ? true : undefined}
          >
            <LoginForm onSwitchToSignup={() => switchMode('signup')} />
          </div>
          <div
            className="max-h-[720px] w-1/2 overflow-y-auto px-12 py-14"
            aria-hidden={mode === 'login'}
            inert={mode === 'login' ? true : undefined}
          >
            <SignupForm />
          </div>

          <div
            className={`bg-brand-orange absolute inset-y-0 left-0 flex w-1/2 [will-change:transform] items-center justify-center overflow-hidden transition-transform duration-1000 ease-in-out ${
              mode === 'login' ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            {/* overflow-hidden clips the oversized circle to this panel's own bounds — without it,
                the circle bleeds past the panel edge and visually covers the active form's fields
                on the other side. Solid bg-brand-orange still guarantees the corners a circle can't
                reach stay opaque, so the hidden form behind it can never peek through either. */}
            <div className="absolute top-1/2 left-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-orange-light via-brand-orange to-brand-orange-dark" />
            <div className="relative z-10 flex flex-col items-center gap-4 px-10 text-center text-white">
              <img src="/showcaseit-icon.png" alt="ShowcaseIT" className="h-24 w-24 shrink-0 object-contain" />
              <h2 className="text-4xl font-extrabold">{mode === 'login' ? 'Welcome to ShowcaseIT' : 'Welcome Back!'}</h2>
              <p className="text-sm text-white/90">
                {mode === 'login'
                  ? "Log in to get access to your team's orders, stock, and tasks."
                  : 'Sign in to keep up with your assigned orders and tasks.'}
              </p>
              {/* Login's own "New User? Register here" (in LoginForm) now covers this direction —
                  only the Sign In trigger remains here, for switching back out of Sign Up. */}
              {mode === 'signup' && (
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Switch to Sign In"
                  className="rounded-full border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => switchMode('login')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
