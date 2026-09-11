// Replaces move_uploaded_file() + uniqid()-based naming used across createProduct.php,
// editProductImage.php, createOrder.php, and the vehicle-documents module. One reusable factory
// instead of reimplementing disk storage + filename generation per module.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { env } from '../config/env'

// Security-audit hardening: the extension check alone only looks at the client-supplied
// filename, which costs an attacker nothing to spoof (rename a .html payload to
// "artwork.jpg"). Cross-checking the client-supplied MIME type closes that off cheaply. It's
// still client-supplied (not a magic-byte sniff of the actual bytes), so this is defense in
// depth, not a content-inspection guarantee — but it stops the trivial rename attack.
// Browsers/OSes are inconsistent about the MIME type they attach to design-tool formats
// (.ai/.eps commonly arrive as application/octet-stream), so those two allow the generic
// fallback alongside their "correct" type rather than being locked to one exact value.
const MIME_TYPES_BY_EXTENSION: Record<string, string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  svg: ['image/svg+xml'],
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ai: ['application/postscript', 'application/illustrator', 'application/octet-stream'],
  eps: ['application/postscript', 'application/octet-stream'],
}

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
      const allowedMimeTypes = MIME_TYPES_BY_EXTENSION[ext]
      if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
        cb(new Error(`File content type "${file.mimetype}" does not match its .${ext} extension.`))
        return
      }
      cb(null, true)
    },
  })
}

export function publicUploadPath(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`.replace(/\\/g, '/')
}
