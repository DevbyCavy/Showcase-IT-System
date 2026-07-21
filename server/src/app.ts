import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth.routes'

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

// Further module routers mount here as they land

app.use(notFoundHandler)
app.use(errorHandler)
