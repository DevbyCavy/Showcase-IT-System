import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Called once from useAuth when a background refresh definitively fails (refresh token itself
// expired/invalid) so the app's auth state clears and ProtectedRoute redirects to /login — this
// module has no React state of its own to update directly.
let onAuthExpired: (() => void) | null = null
export function setOnAuthExpired(cb: (() => void) | null) {
  onAuthExpired = cb
}

// The access token is short-lived (15m, see server/src/config/env.ts) and, until now, was only
// ever refreshed once on page load (useAuth's mount effect) — so any request made after that
// window on a still-open tab failed with a bare 401 ("Invalid or expired token"), regardless of
// the still-valid 7-day refresh cookie. This retries exactly once per request after a silent
// refresh, and dedupes concurrent refreshes behind one in-flight promise so a burst of requests
// hitting 401 at the same time doesn't fire /auth/refresh multiple times.
let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint: boolean = originalRequest?.url?.startsWith('/auth/')

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      if (!refreshPromise) {
        refreshPromise = api
          .post('/auth/refresh')
          .then((res) => {
            const token = res.data.data.accessToken
            localStorage.setItem('accessToken', token)
            return token
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      try {
        const token = await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        onAuthExpired?.()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)
