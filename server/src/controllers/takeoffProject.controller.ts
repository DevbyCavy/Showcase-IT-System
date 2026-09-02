import type { Request, Response } from 'express'
import * as takeoffProjectService from '../services/takeoffProject.service'
import * as takeoffProjectRepository from '../repositories/takeoffProject.repository'
import { ApiError } from '../middleware/errorHandler'
import { runExtraction } from '../services/takeoffExtraction.service'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid project id')
  }
  return id
}

export async function list(req: Request, res: Response) {
  const projects = await takeoffProjectService.list(req.user!.id)
  res.json({ success: true, data: { projects } })
}

export async function getOne(req: Request, res: Response) {
  const project = await takeoffProjectService.getOne(parseId(req), req.user!.id)
  res.json({ success: true, data: { project } })
}

export async function create(req: Request, res: Response) {
  const project = await takeoffProjectService.create(req.body, req.user!.id)
  res.status(201).json({ success: true, data: { project } })
}

export async function uploadDesign(req: Request, res: Response) {
  const projectId = parseId(req)
  await takeoffProjectService.assertOwnership(projectId, req.user!.id)

  const file = req.file
  if (!file) {
    throw new ApiError(400, 'A PDF design file is required.')
  }

  const design = await takeoffProjectRepository.createDesign({
    projectId,
    originalFilename: file.originalname,
    // The pipeline needs to read the actual bytes off disk (pdfjs-dist), so this stores the real
    // multer-assigned disk path, not a /uploads/... public URL like other upload fields in this
    // app — there's no "view the raw PDF" feature here to need the URL form.
    storagePath: file.path,
  })

  setImmediate(() => {
    runExtraction(design.id).catch((err) => {
      console.error(`Takeoff extraction failed for design ${design.id}:`, err)
    })
  })

  res.status(201).json({ success: true, data: { design } })
}
