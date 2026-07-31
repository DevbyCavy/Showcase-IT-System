import type { LocationPing } from '@/api/tracking'

// Unsent GPS pings (e.g. the device went offline mid-trip) are cached here and flushed once the
// connection returns, so a driver's route doesn't get gaps just because their signal dropped —
// see MIGRATION_PLAN.md §24's "background tracking" requirement.
const STORAGE_KEY = 'showcaseit_tracking_queue'

function readQueue(): LocationPing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LocationPing[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: LocationPing[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Storage full/unavailable — dropping the point is the best we can do.
  }
}

export function enqueuePing(ping: LocationPing) {
  writeQueue([...readQueue(), ping])
}

// Retries queued pings in order, oldest first; whatever still fails stays queued.
export async function flushQueue(send: (ping: LocationPing) => Promise<unknown>) {
  const queue = readQueue()
  if (queue.length === 0) return
  const remaining: LocationPing[] = []
  for (const ping of queue) {
    try {
      await send(ping)
    } catch {
      remaining.push(ping)
    }
  }
  writeQueue(remaining)
}
