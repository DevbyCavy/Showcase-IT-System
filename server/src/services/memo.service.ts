// Translated from memos.php + createMemo.php/updateMemoStatus.php/deleteMemo.php (scoped from the
// Marketer Memos feature, see MIGRATION_PLAN.md §10.7). Legacy gated this to requireRole('Marketer'),
// a role dropped in Module 2's normalization — open to any authenticated user instead, same
// precedent as Requisitions/Quotations/Office Tasks. The due-date reminder popup/acknowledge flow
// from that feature is out of scope (never requested); this is just the to-do list itself.

import { ApiError } from '../middleware/errorHandler'
import * as memoRepository from '../repositories/memo.repository'
import type { CreateMemoBody } from '../validations/memo.validation'
import type { Memo } from '@prisma/client'

function toPublicMemo(m: Memo) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    dueDate: m.dueDate,
    status: m.status,
    createdAt: m.createdAt,
  }
}

export async function list(userId: number) {
  const memos = await memoRepository.findAllForUser(userId)
  return memos.map(toPublicMemo)
}

export async function create(userId: number, input: CreateMemoBody) {
  const memo = await memoRepository.create({
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    createdById: userId,
  })
  return toPublicMemo(memo)
}

export async function markDone(userId: number, id: number) {
  const ok = await memoRepository.markDone(id, userId)
  if (!ok) {
    throw new ApiError(400, 'Could not update — not found.')
  }
}

export async function remove(userId: number, id: number) {
  const ok = await memoRepository.remove(id, userId)
  if (!ok) {
    throw new ApiError(400, 'Could not delete — not found.')
  }
}
