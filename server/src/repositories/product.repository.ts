import { prisma } from '../config/prisma'

// Mirrors fetchProduct.php: `WHERE product.status = 1`, joined with brand/category names.
export function findAllActive() {
  return prisma.product.findMany({
    where: { status: 'Active' },
    include: { brand: true, category: true },
  })
}

export function findById(id: number) {
  return prisma.product.findUnique({ where: { id }, include: { brand: true, category: true } })
}

export interface ProductCreateData {
  name: string
  imageUrl: string
  brandId: number
  categoryId: number
  quantity: number
  rate: number
  isActive: boolean
}

export function create(data: ProductCreateData) {
  return prisma.product.create({
    data: { ...data, code: '', status: 'Active' },
    include: { brand: true, category: true },
  })
}

export interface ProductUpdateData {
  name: string
  brandId: number
  categoryId: number
  quantity: number
  rate: number
  isActive: boolean
}

// Mirrors editProduct.php: name/brand/category/quantity/rate/active only — never touches the image.
export function update(id: number, data: ProductUpdateData) {
  return prisma.product.update({ where: { id }, data, include: { brand: true, category: true } })
}

// Mirrors editProductImage.php: the image is updated independently of the rest of the product.
export function updateImage(id: number, imageUrl: string) {
  return prisma.product.update({ where: { id }, data: { imageUrl } })
}

// Mirrors updateQuantity.php — used by the Inventory/Issued Tools module (Module 7).
export function updateQuantity(id: number, quantity: number) {
  return prisma.product.update({ where: { id }, data: { quantity } })
}

// Mirrors store.php's grid query: `WHERE p.active = 1 AND p.status = 1` — narrower than
// fetchProduct.php's plain `status = 1` (Manage Products shows both Available/Not Available rows;
// the issuing grid only shows stock that's actually Available).
export function findAllAvailableForIssue() {
  return prisma.product.findMany({
    where: { status: 'Active', isActive: true },
    include: { brand: true, category: true },
  })
}

// Mirrors removeProduct.php: `active = 2, status = 2` — both the business flag and the
// soft-delete flag get flipped on removal (unlike brand/category, which only touch status).
export function softDelete(id: number) {
  return prisma.product.update({ where: { id }, data: { isActive: false, status: 'Deleted' } })
}
