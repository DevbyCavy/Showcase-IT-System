import { api } from './client'

export type DesignJobType = 'Artwork' | 'ThreeDDesign'
export type DesignJobStatus = 'Pending' | 'Done'

export interface DesignJobUser {
  id: number
  name: string
  surname: string
}

export interface DesignJob {
  id: number
  title: string
  jobType: DesignJobType
  description: string | null
  sampleFile: string | null
  deadline: string
  status: DesignJobStatus
  completedFile: string | null
  completedAt: string | null
  assignedBy: DesignJobUser
  assignedTo: DesignJobUser
  createdAt: string
}

interface DesignJobListResponse {
  success: true
  data: { designJobs: DesignJob[] }
}

interface DesignJobResponse {
  success: true
  data: { designJob: DesignJob }
}

export function list() {
  return api.get<DesignJobListResponse>('/design-jobs').then((r) => r.data.data.designJobs)
}

export interface DesignJobInput {
  title: string
  jobType: DesignJobType
  description?: string
  deadline: string
  assignedToId: number
  sampleFile?: File
}

export function create(input: DesignJobInput) {
  const formData = new FormData()
  formData.append('title', input.title)
  formData.append('jobType', input.jobType)
  if (input.description) formData.append('description', input.description)
  formData.append('deadline', input.deadline)
  formData.append('assignedToId', String(input.assignedToId))
  if (input.sampleFile) formData.append('sampleFile', input.sampleFile)
  return api
    .post<DesignJobResponse>('/design-jobs', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.data.designJob)
}

export function markDone(id: number, completedFile: File) {
  const formData = new FormData()
  formData.append('completedFile', completedFile)
  return api
    .put<DesignJobResponse>(`/design-jobs/${id}/done`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.data.designJob)
}
