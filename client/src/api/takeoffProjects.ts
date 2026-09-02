import { api } from './client'

export type TakeoffDesignStatus = 'Pending' | 'Processing' | 'Ready' | 'Failed'
export type TakeoffPdfType = 'Cad' | 'Rendered' | 'Mixed'

export interface TakeoffDesignSummary {
  id: number
  originalFilename: string
  status: TakeoffDesignStatus
  pdfType: TakeoffPdfType | null
  uploadedAt: string
}

export interface TakeoffProject {
  id: number
  name: string
  clientName: string | null
  createdAt: string
  designCount: number
}

export interface TakeoffProjectDetail {
  id: number
  name: string
  clientName: string | null
  createdAt: string
  designs: TakeoffDesignSummary[]
}

interface TakeoffProjectListResponse {
  success: true
  data: { projects: TakeoffProject[] }
}

interface TakeoffProjectDetailResponse {
  success: true
  data: { project: TakeoffProjectDetail }
}

interface TakeoffProjectCreateResponse {
  success: true
  data: { project: TakeoffProject }
}

interface TakeoffDesignUploadResponse {
  success: true
  data: { design: TakeoffDesignSummary }
}

export function list() {
  return api.get<TakeoffProjectListResponse>('/takeoff-projects').then((r) => r.data.data.projects)
}

export function getOne(id: number) {
  return api.get<TakeoffProjectDetailResponse>(`/takeoff-projects/${id}`).then((r) => r.data.data.project)
}

export interface TakeoffProjectInput {
  name: string
  clientName?: string
}

export function create(input: TakeoffProjectInput) {
  return api.post<TakeoffProjectCreateResponse>('/takeoff-projects', input).then((r) => r.data.data.project)
}

export function uploadDesign(projectId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api
    .post<TakeoffDesignUploadResponse>(`/takeoff-projects/${projectId}/designs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.data.design)
}
