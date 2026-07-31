import type { Order, User } from '@prisma/client'
import { env } from '../../config/env'

// Twilio's WhatsApp Sandbox accepts plain free-text with no pre-approved template — the fast path
// for early dev/testing. Once an account moves past the sandbox (a paid/upgraded account, still
// using its own number rather than a Meta-verified Business number), Twilio requires the same
// kind of pre-approved template Meta does — there it's a Content Template (built in the Twilio
// Console's Content Template Builder), referenced by a ContentSid, with variables passed as
// ContentVariables. `TWILIO_CONTENT_SID` selects that path; leaving it blank falls back to plain
// text, which still works against the sandbox.
export async function sendViaTwilio(user: Pick<User, 'whatsappNumber' | 'name'>, order: Order) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM) {
    console.warn('WhatsApp notification skipped: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM not configured')
    return
  }

  const deadline = order.deadlineDatetime
    ? new Date(order.deadlineDatetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'No deadline set'

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')
  const params = new URLSearchParams({
    From: `whatsapp:${env.TWILIO_WHATSAPP_FROM}`,
    To: `whatsapp:${user.whatsappNumber}`,
  })

  if (env.TWILIO_CONTENT_SID) {
    params.set('ContentSid', env.TWILIO_CONTENT_SID)
    params.set(
      'ContentVariables',
      JSON.stringify({
        1: order.orderName,
        2: order.orderNumber,
        3: order.location,
        4: deadline,
      }),
    )
  } else {
    params.set('Body', `Hi ${user.name}, you've been assigned to order "${order.orderName}" (#${order.orderNumber}) at ${order.location}. Deadline: ${deadline}.`)
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  if (!res.ok) {
    throw new Error(`Twilio WhatsApp send failed: ${res.status} ${await res.text()}`)
  }
}
