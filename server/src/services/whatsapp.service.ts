import type { Order, User } from '#prisma-client'
import { env } from '../config/env'
import { sendViaTwilio } from './whatsappProviders/twilio'
import { sendViaMeta } from './whatsappProviders/meta'

// Provider is swappable via a single env var (WHATSAPP_PROVIDER) so moving from Twilio (fast to
// set up for dev/testing — its sandbox needs no template approval) to Meta's Cloud API (the plan
// once this deploys) is a config change, not a code change. order.service.ts only ever calls this
// one function; it doesn't know or care which provider is behind it. Fire-and-forget by design:
// this must never throw, since a WhatsApp outage or missing credentials should not block order
// creation — each provider throws on failure, and this is the one place that catches it.
export async function sendOrderAssignmentNotification(user: Pick<User, 'whatsappNumber' | 'name'>, order: Order) {
  if (!user.whatsappNumber) return

  try {
    if (env.WHATSAPP_PROVIDER === 'meta') {
      await sendViaMeta(user, order)
    } else {
      await sendViaTwilio(user, order)
    }
  } catch (err) {
    console.error(`WhatsApp notification failed for order ${order.orderNumber}:`, err)
  }
}
