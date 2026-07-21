import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { loginSchema } from '../validations/auth.validation'

export const authRouter = Router()

authRouter.post('/login', validateBody(loginSchema), authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.post('/logout', authController.logout)
authRouter.get('/me', authenticate, authController.me)
