import { ApiError } from '../middleware/errorHandler'
import * as takeoffProjectRepository from '../repositories/takeoffProject.repository'
import type { TakeoffProjectBody } from '../validations/takeoffProject.validation'

function toPublicProject(p: Awaited<ReturnType<typeof takeoffProjectRepository.findAllByUser>>[number]) {
  return {
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    createdAt: p.createdAt,
    designCount: p._count.designs,
  }
}

function toPublicProjectDetail(p: NonNullable<Awaited<ReturnType<typeof takeoffProjectRepository.findByIdWithDesigns>>>) {
  return {
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    createdAt: p.createdAt,
    designs: p.designs,
  }
}

export async function list(userId: number) {
  const projects = await takeoffProjectRepository.findAllByUser(userId)
  return projects.map(toPublicProject)
}

// Single-owner projects (no team sharing in v0.1 — see design doc §1 "Out of scope") — every
// caller regardless of role only ever sees/touches their own projects.
async function findOwned(id: number, userId: number) {
  const project = await takeoffProjectRepository.findByIdWithDesigns(id)
  if (!project) {
    throw new ApiError(404, 'Project not found.')
  }
  if (project.userId !== userId) {
    throw new ApiError(403, 'You do not have access to this project.')
  }
  return project
}

export async function getOne(id: number, userId: number) {
  return toPublicProjectDetail(await findOwned(id, userId))
}

export async function assertOwnership(id: number, userId: number) {
  await findOwned(id, userId)
}

export async function create(input: TakeoffProjectBody, userId: number) {
  const project = await takeoffProjectRepository.create({ userId, name: input.name, clientName: input.clientName })
  return { id: project.id, name: project.name, clientName: project.clientName, createdAt: project.createdAt, designCount: 0 }
}
