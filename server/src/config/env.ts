import { config } from 'dotenv'
import { z } from 'zod'

config({ quiet: true })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOADS_DIR: z.string().default('uploads'),
  WHATSAPP_PROVIDER: z.enum(['twilio', 'meta']).default('twilio'),
  WHATSAPP_ACCESS_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  WHATSAPP_TEMPLATE_NAME: z.string().default('order_assignment_v2'),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().default('en'),
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_WHATSAPP_FROM: z.string().default(''),
  TWILIO_CONTENT_SID: z.string().default(''),
  BROWSERLESS_TOKEN: z.string().default(''),
  // Region-pinned at account creation (shown in the Browserless dashboard) — not the same for
  // every account, so it's configurable rather than hardcoded.
  BROWSERLESS_WS_ENDPOINT: z.string().default('wss://production-sfo.browserless.io'),
})

export const env = envSchema.parse(process.env)
