import { ApiError } from '../middleware/errorHandler'
import * as designJobRepository from '../repositories/designJob.repository'
import type { DesignJobBody } from '../validations/designJob.validation'
import type { AuthenticatedUser } from '../types/auth.types'
import { toPublicUser } from '../utils/mapUser'

function toPublicDesignJob(j: Awaited<ReturnType<typeof designJobRepository.findAll>>[number]) {
  return {
    id: j.id,
    title: j.title,
    jobType: j.jobType,
    description: j.description,
    sampleFile: j.sampleFile,
    deadline: j.deadline,
    status: j.status,
    completedFile: j.completedFile,
    completedAt: j.completedAt,
    assignedBy: toPublicUser(j.assignedBy),
    assignedTo: toPublicUser(j.assignedTo),
    createdAt: j.createdAt,
  }
}

// Graphic Designers only see jobs assigned to them ("My Design Jobs"); Marketer/Super Admin (the
// only roles that can create a job — see designJob.routes.ts) see everything, since they're the
// ones tracking what they've handed out.
export async function list(user: AuthenticatedUser) {
  const jobs = await designJobRepository.findAll()
  const visible = user.role === 'GraphicDesigner' ? jobs.filter((j) => j.assignedToId === user.id) : jobs
  return visible.map(toPublicDesignJob)
}

export async function create(input: DesignJobBody, assignedById: number, sampleFile?: string) {
  const job = await designJobRepository.create({
    title: input.title,
    jobType: input.jobType,
    description: input.description,
    sampleFile,
    deadline: input.deadline,
    assignedById,
    assignedToId: input.assignedToId,
  })
  return toPublicDesignJob(job)
}

export async function markDone(id: number, userId: number, completedFile: string) {
  const ok = await designJobRepository.markDone(id, userId, completedFile)
  if (!ok) {
    throw new ApiError(403, 'You can only submit completed work for your own assigned design jobs.')
  }
  return toPublicDesignJob((await designJobRepository.findById(id))!)
}
