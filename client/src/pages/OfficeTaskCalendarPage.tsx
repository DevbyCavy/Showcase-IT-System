import { TaskCalendar } from '@/components/TaskCalendar'

// Full-page version of the Office Task Calendar widget embedded on the Super Admin dashboard —
// gives every role direct sidebar access to it, not just Super Admin (see MIGRATION_PLAN.md §10.5).
export default function OfficeTaskCalendarPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="mb-4 text-xl font-bold">Office Task Calendar</h1>
      <TaskCalendar />
    </div>
  )
}
