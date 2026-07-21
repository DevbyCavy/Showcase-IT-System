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

    const issuedTool = await tx.issuedTool.create({
      data: {
        productId: input.productId,
        dateOfCollection: input.dateOfCollection,
        collectorName: input.collectorName,
        toolName: input.toolName,
        quantityIssued: input.quantityIssued,
        jobName: input.jobName,
        dateOfReturn: input.dateOfReturn ?? null,
      },
    })

    await tx.product.update({
      where: { id: input.productId },
      data: { quantity: product.quantity - input.quantityIssued },
    })

    return issuedTool
  })
}
