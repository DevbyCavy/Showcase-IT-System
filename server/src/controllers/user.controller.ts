import type { Request, Response } from 'express'
import * as userService from '../services/user.service'
import { ApiError } from '../middleware/errorHandler'

export async function list(_req: Request, res: Response) {
  const users = await userService.list()
  res.json({ success: true, data: { users } })
}

export async function signup(req: Request, res: Response) {
  const user = await userService.signup(req.body)
  res.status(201).json({ success: true, data: { user } })
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid user id')
  }
  const user = await userService.update(id, req.body)
  res.json({ success: true, data: { user } })
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid user id')
  }
  await userService.remove(id)
  res.json({ success: true })
}
