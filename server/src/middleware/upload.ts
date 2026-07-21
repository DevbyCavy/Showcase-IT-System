// Replaces move_uploaded_file() + uniqid()-based naming used across createProduct.php,
// editProductImage.php, createOrder.php, and the vehicle-documents module. One reusable factory
// instead of reimplementing disk storage + filename generation per module.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { env } from '../config/env'

export function createUploader(subdir: string, allowedExtensions: string[]) {
  const destination = path.join(env.UPLOADS_DIR, subdir)
  fs.mkdirSync(destination, { recursive: true })

  const storage = multer.diskStorage({
    destination,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '')
      if (!allowedExtensions.includes(ext)) {
        cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`))
        return
      }
      cb(null, true)
    },
  })
}

export function publicUploadPath(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`.replace(/\\/g, '/')
}
