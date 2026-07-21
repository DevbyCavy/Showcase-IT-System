import { api } from './client'
import type { AuthUser } from '@/types/auth'

interface UserResponse {
  success: true
  data: { user: AuthUser }
}

interface UserListResponse {
  success: true
  data: { users: AuthUser[] }
}

export interface SignupInput {
  name: string
  surname: string
  username: string
  password: string
  confirmPassword: string
  department: string
  userType: string
  email?: string
}

export function signup(input: SignupInput) {
  return api.post<UserResponse>('/users', input).then((r) => r.data.data.user)
}

export function list() {
  return api.get<UserListResponse>('/users').then((r) => r.data.data.users)
}

export interface AssignableUser {
  id: number
  name: string
  surname: string
}

interface AssignableUserListResponse {
  success: true
  data: { users: AssignableUser[] }
}

export function listAssignable() {
  return api.get<AssignableUserListResponse>('/users/assignable').then((r) => r.data.data.users)
}

export interface UpdateUserInput {
  name?: string
  surname?: string
  username?: string
  department?: string
  userType?: string
  email?: string
  password?: string
}

export function update(id: number, input: UpdateUserInput) {
  return api.put<UserResponse>(`/users/${id}`, input).then((r) => r.data.data.user)
}

export function remove(id: number) {
  return api.delete(`/users/${id}`)
}
