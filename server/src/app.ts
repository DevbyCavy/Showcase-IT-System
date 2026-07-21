import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth.routes'
import { userRouter } from './routes/user.routes'
import { categoryRouter } from './routes/category.routes'
import { brandRouter } from './routes/brand.routes'
import { productRouter } from './routes/product.routes'
import { inventoryRouter } from './routes/inventory.routes'
import { orderRouter } from './routes/order.routes'
import { boqRouter } from './routes/boq.routes'
import { requisitionRouter } from './routes/requisition.routes'
import { vehicleRouter } from './routes/vehicle.routes'
import { fuelLogRouter } from './routes/fuelLog.routes'
import { maintenanceLogRouter } from './routes/maintenanceLog.routes'
import { vehicleTripRouter } from './routes/vehicleTrip.routes'
import { vehicleDocumentRouter } from './routes/vehicleDocument.routes'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

app.use('/uploads', express.static(env.UPLOADS_DIR))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/categories', categoryRouter)
app.use('/api/brands', brandRouter)
app.use('/api/products', productRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/orders', orderRouter)
app.use('/api/boqs', boqRouter)
app.use('/api/requisitions', requisitionRouter)
app.use('/api/vehicles', vehicleRouter)
app.use('/api/fuel-logs', fuelLogRouter)
app.use('/api/maintenance-logs', maintenanceLogRouter)
app.use('/api/trips', vehicleTripRouter)
app.use('/api/vehicle-documents', vehicleDocumentRouter)

// Further module routers mount here as they land

app.use(notFoundHandler)
app.use(errorHandler)
