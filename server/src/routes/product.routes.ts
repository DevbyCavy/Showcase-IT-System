import { Router } from 'express'
import * as productController from '../controllers/product.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createUploader } from '../middleware/upload'
import { productSchema, updateProductSchema, updateQuantitySchema } from '../validations/product.validation'

// product.php requires a session but calls no requireRole() — any logged-in user, any role.
export const productRouter = Router()

const upload = createUploader('products', ['jpg', 'jpeg', 'png', 'gif', 'webp'])

productRouter.use(authenticate)
productRouter.get('/', productController.list)
productRouter.get('/form-options', productController.formOptions)
productRouter.get('/:id', productController.getOne)
productRouter.post('/', upload.single('productImage'), validateBody(productSchema), productController.create)
productRouter.put('/:id', validateBody(updateProductSchema), productController.update)
productRouter.put('/:id/image', upload.single('productImage'), productController.updateImage)
productRouter.put('/:id/quantity', validateBody(updateQuantitySchema), productController.updateQuantity)
productRouter.delete('/:id', productController.remove)
