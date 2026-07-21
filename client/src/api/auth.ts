import { api } from './client'
import type { AuthUser } from '@/types/auth'

interface LoginResponse {
  success: true
  data: { user: AuthUser; accessToken: string }
}

export function login(username: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data.data)
}

export function refresh() {
  return api.post<LoginResponse>('/auth/refresh').then((r) => r.data.data)
}

export function logout() {
  return api.post('/auth/logout')
}

export function me() {
  return api.get<{ success: true; data: { user: AuthUser } }>('/auth/me').then((r) => r.data.data.user)
}
