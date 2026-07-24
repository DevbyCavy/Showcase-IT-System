import type { Order, User } from '@prisma/client'
import { env } from '../config/env'

// Meta WhatsApp Cloud API requires business-initiated messages (i.e. not a reply within an
// existing 24h customer conversation window) to use a pre-approved message template — plain
// free-text sends are rejected for a first-contact number. `WHATSAPP_TEMPLATE_NAME` must match a
// template approved in Meta Business Manager with body variables in this order: order name, order
// number, location, deadline. Fire-and-forget by design: this must never throw, since a WhatsApp
// outage or missing credentials should not block order creation.
export async function sendOrderAssignmentNotification(user: Pick<User, 'whatsappNumber' | 'name'>, order: Order) {
  if (!user.whatsappNumber) return
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp notification skipped: WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID not configured')
    return
  }

  const deadline = order.deadlineDatetime
    ? new Date(order.deadlineDatetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'No deadline set'

  try {
    const res = await fetch(
      `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: user.whatsappNumber,
          type: 'template',
          template: {
            name: env.WHATSAPP_TEMPLATE_NAME,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: order.orderName },
                  { type: 'text', text: order.orderNumber },
                  { type: 'text', text: order.location },
                  { type: 'text', text: deadline },
                ],
              },
            ],
          },
        }),
      },
    )

    if (!res.ok) {
      console.error(`WhatsApp notification failed for order ${order.orderNumber}: ${res.status} ${await res.text()}`)
    }
  } catch (err) {
    console.error(`WhatsApp notification failed for order ${order.orderNumber}:`, err)
  }
}
