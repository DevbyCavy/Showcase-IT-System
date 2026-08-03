// Translated from issueProduct.php + custom/js/issuedProduct.js. The legacy JS bound two separate
// submit handlers to the same form (one with no validation, one with validation) — both fired on
// every submit, double-issuing stock and creating two issued_tools rows per click. Fixed here by
// having exactly one issue path; not preserved, since duplicating that bug would double-deduct
// real inventory on every use.
//
// The stock check + decrement + insert also weren't atomic in PHP (three separate queries with no
// transaction) — wrapped in a Prisma transaction here so concurrent issues can't over-issue stock.

import { prisma } from '../config/prisma'
import { ApiError } from '../middleware/errorHandler'
import * as productRepository from '../repositories/product.repository'
import * as issuedToolRepository from '../repositories/issuedTool.repository'
import type { IssueProductBody } from '../validations/inventory.validation'

export function listAvailableProducts() {
  return productRepository.findAllAvailableForIssue()
}

export function listIssuedTools() {
  return issuedToolRepository.findAll()
}

export async function issueProduct(input: IssueProductBody) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } })
    if (!product) {
      throw new ApiError(404, 'Product not found')
    }
    if (product.quantity < input.quantityIssued) {
      throw new ApiError(400, 'Not enough stock available')
    }
    const collector = await tx.user.findUnique({ where: { id: input.collectorId } })
    if (!collector) {
      throw new ApiError(400, 'Selected collector could not be found')
    }

    const issuedTool = await tx.issuedTool.create({
      data: {
        productId: input.productId,
        dateOfCollection: input.dateOfCollection,
        collectorId: input.collectorId,
        collectorName: `${collector.name} ${collector.surname}`,
        toolName: input.toolName,
        quantityIssued: input.quantityIssued,
        jobName: input.jobName,
        isReturnable: input.isReturnable,
        dateOfReturn: input.isReturnable ? (input.dateOfReturn ?? null) : null,
      },
    })

    await tx.product.update({
      where: { id: input.productId },
      data: { quantity: product.quantity - input.quantityIssued },
    })

    return issuedTool
  })
}

// Due-date reminder popup, mirroring memo.service.ts's getDueReminders/acknowledge exactly, but
// with two independent audiences (see MIGRATION_PLAN.md §33): the collector who has the item, and
// Stores Admin/Super Admin who need it back. `role` decides whether the stores-wide list is even
// fetched — everyone else always just gets their own collector-side reminders (or none).
export async function getDueReminders(userId: number, role: string) {
  const [asCollector, asStores] = await Promise.all([
    issuedToolRepository.findDueForCollector(userId),
    role === 'StoresAdmin' || role === 'SuperAdmin' ? issuedToolRepository.findDueForStores() : Promise.resolve([]),
  ])
  return { asCollector, asStores }
}

export async function acknowledgeAsCollector(userId: number, ids: number[]) {
  const acknowledged = await issuedToolRepository.acknowledgeForCollector(ids, userId)
  return { acknowledged }
}

export async function acknowledgeAsStores(ids: number[]) {
  const acknowledged = await issuedToolRepository.acknowledgeForStores(ids)
  return { acknowledged }
}
