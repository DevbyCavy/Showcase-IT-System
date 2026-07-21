import { Router } from 'express'
import { Role } from '@prisma/client'
import * as userController from '../controllers/user.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { signupSchema, updateUserSchema } from '../validations/user.validation'

export const userRouter = Router()

// Public — mirrors signup.php having no auth_guard at all.
userRouter.post('/', validateBody(signupSchema), userController.signup)

// Any authenticated user — mirrors createOrder.php's assignee dropdown query.
userRouter.get('/assignable', authenticate, userController.listAssignable)

// Protected — mirrors manage_users.php's requireRole("Super Admin").
userRouter.get('/', authenticate, requireRole(Role.SuperAdmin), userController.list)
userRouter.put('/:id', authenticate, requireRole(Role.SuperAdmin), validateBody(updateUserSchema), userController.update)
userRouter.delete('/:id', authenticate, requireRole(Role.SuperAdmin), userController.remove)
