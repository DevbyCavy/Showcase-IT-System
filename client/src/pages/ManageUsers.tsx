import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as usersApi from '@/api/users'
import { JOB_TITLE_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/userOptions'
import type { AuthUser } from '@/types/auth'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Translated from manage_users.php: list + live client-side search filter, plus the Edit/Delete
// actions that page linked to but never actually implemented (see MIGRATION_PLAN.md — Module 3
// completes this CRUD by decision). Rebuilt on the shared PageHeader/DataTable primitives as part
// of the full-app redesign sweep (see MIGRATION_PLAN.md §10.11).
export default function ManageUsers() {
  const queryClient = useQueryClient()
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AuthUser | null>(null)

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter((u) => [u.name, u.surname, u.username, u.email, u.department, u.role].join(' ').toLowerCase().includes(q))
  }, [users, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  function handleDelete(user: AuthUser) {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(user.id)
    }
  }

  const columns: DataTableColumn<AuthUser>[] = [
    { key: 'name', header: 'Full Name', render: (u) => `${u.name} ${u.surname}` },
    { key: 'username', header: 'Username', render: (u) => u.username },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'department', header: 'Department', render: (u) => u.department },
    { key: 'role', header: 'User Type', render: (u) => u.role },
    {
      key: 'actions',
      header: 'Options',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (u) => (
        <div className="flex justify-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u)}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader
        title="Manage Users"
        action={
          <Link to="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            Return
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(u) => u.id}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users..."
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function EditUserModal({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: user.name,
    surname: user.surname,
    username: user.username,
    department: user.department,
    userType: user.role as string,
    email: user.email,
  })
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => usersApi.update(user.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Update failed') : 'Update failed')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Edit User</h2>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Surname</label>
              <Input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Username</label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Job Title</label>
              <select className={selectClass} value={form.userType} onChange={(e) => setForm({ ...form, userType: e.target.value })}>
                {JOB_TITLE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.role}>
                    {opt.label}
                  </option>
                ))}
                <option value="SuperAdmin">Super Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Department</label>
              <select className={selectClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENT_OPTIONS.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
