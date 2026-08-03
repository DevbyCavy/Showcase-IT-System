import type { Order, User } from '#prisma-client'
import { env } from '../../config/env'

// Meta WhatsApp Cloud API requires business-initiated messages (i.e. not a reply within an
// existing 24h customer conversation window) to use a pre-approved message template — plain
// free-text sends are rejected for a first-contact number. `WHATSAPP_TEMPLATE_NAME` must match a
// template approved in Meta Business Manager, created with Named parameter format using these
// exact variable names: name, order_name, order_number, location, deadline.
export async function sendViaMeta(user: Pick<User, 'whatsappNumber' | 'name'>, order: Order) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp notification skipped: WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID not configured')
    return
  }

  const deadline = order.deadlineDatetime
    ? new Date(order.deadlineDatetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'No deadline set'

  const res = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
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
        language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', parameter_name: 'name', text: user.name },
              { type: 'text', parameter_name: 'order_name', text: order.orderName },
              { type: 'text', parameter_name: 'order_number', text: order.orderNumber },
              { type: 'text', parameter_name: 'location', text: order.location },
              { type: 'text', parameter_name: 'deadline', text: deadline },
            ],
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Meta WhatsApp send failed: ${res.status} ${await res.text()}`)
  }
}
