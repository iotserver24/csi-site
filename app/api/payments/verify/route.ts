import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { db } from '../../../../src/db/index'
import { payments } from '../../../../src/db/schema'
import { timingSafeEqualHex } from '../../../../src/lib/crypto-util'
import { clientIp, rateLimit } from '../../../../src/lib/rate-limit'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

function asNonEmptyString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLen) return null
  return trimmed
}

function notesUserId(notes: unknown): string | undefined {
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) return undefined
  const userId = (notes as Record<string, unknown>).userId
  return typeof userId === 'string' ? userId : undefined
}

function notesPlanId(notes: unknown): string | undefined {
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) return undefined
  const planId = (notes as Record<string, unknown>).planId
  return typeof planId === 'string' ? planId : undefined
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    if (!(await rateLimit(`pay-verify:${context.user.id}:${clientIp(request)}`, 10, 60_000))) {
      return NextResponse.json({ error: 'Too many verification attempts' }, { status: 429 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret || !process.env.RAZORPAY_KEY_ID) {
      return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>

    // Checkout may return snake_case; some clients send camelCase / orderId from create-order
    const paymentId =
      asNonEmptyString(body.razorpay_payment_id, 128)
      || asNonEmptyString(body.paymentId, 128)
    const orderId =
      asNonEmptyString(body.razorpay_order_id, 128)
      || asNonEmptyString(body.orderId, 128)
      || asNonEmptyString(body.order_id, 128)
    const invoiceId =
      asNonEmptyString(body.razorpay_invoice_id, 128)
      || asNonEmptyString(body.invoiceId, 128)
    const signature =
      asNonEmptyString(body.razorpay_signature, 256)
      || asNonEmptyString(body.signature, 256)

    if (!paymentId || !signature || (!orderId && !invoiceId)) {
      return NextResponse.json({
        error: 'Missing payment verification fields',
        detail: {
          hasPaymentId: Boolean(paymentId),
          hasOrderId: Boolean(orderId),
          hasInvoiceId: Boolean(invoiceId),
          hasSignature: Boolean(signature),
        },
      }, { status: 400 })
    }

    // Orders: HMAC(order_id|payment_id); Invoices: HMAC(invoice_id|payment_id)
    const payloads: string[] = []
    if (orderId) payloads.push(`${orderId}|${paymentId}`)
    if (invoiceId) payloads.push(`${invoiceId}|${paymentId}`)

    const signatureOk = payloads.some((payload) => {
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
      return timingSafeEqualHex(signature, expected)
    })
    if (!signatureOk) {
      return NextResponse.json({ verified: false, error: 'Invalid signature' }, { status: 400 })
    }

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: secret })

    let resolvedOrderId = orderId
    let amount = ''
    let currency = 'INR'
    let planId: string | undefined
    let ownerUid: string | undefined

    if (orderId) {
      const order = await razorpay.orders.fetch(orderId)
      amount = String(Number(order.amount) / 100)
      currency = order.currency || 'INR'
      ownerUid = notesUserId(order.notes)
      planId = notesPlanId(order.notes)
      resolvedOrderId = order.id
    }

    // Invoice payments often omit order_id in the browser response; resolve via invoice
    if (invoiceId) {
      const invoice = await razorpay.invoices.fetch(invoiceId) as {
        order_id?: string
        amount?: number | string
        currency?: string
        notes?: unknown
        payment_id?: string
      }
      if (!resolvedOrderId && invoice.order_id) resolvedOrderId = invoice.order_id
      if (!amount && invoice.amount != null) amount = String(Number(invoice.amount) / 100)
      if (invoice.currency) currency = invoice.currency
      ownerUid = ownerUid || notesUserId(invoice.notes)
      planId = planId || notesPlanId(invoice.notes)
    }

    // Last resort: payment entity notes / order_id
    if (!ownerUid || !resolvedOrderId || !planId) {
      const payment = await razorpay.payments.fetch(paymentId) as {
        order_id?: string
        amount?: number | string
        currency?: string
        notes?: unknown
        invoice_id?: string
      }
      if (!resolvedOrderId && payment.order_id) resolvedOrderId = payment.order_id
      if (!amount && payment.amount != null) amount = String(Number(payment.amount) / 100)
      if (payment.currency) currency = payment.currency
      ownerUid = ownerUid || notesUserId(payment.notes)
      planId = planId || notesPlanId(payment.notes)

      if ((!ownerUid || !planId) && payment.order_id) {
        const order = await razorpay.orders.fetch(payment.order_id)
        ownerUid = ownerUid || notesUserId(order.notes)
        planId = planId || notesPlanId(order.notes)
        if (!amount) amount = String(Number(order.amount) / 100)
      }
    }

    if (ownerUid && ownerUid !== context.firebaseUser.uid) {
      return NextResponse.json({ error: 'Order ownership mismatch' }, { status: 403 })
    }
    // If notes never got stamped (invoice edge case), require at least a matching authenticated payment
    if (!ownerUid) {
      // Still allow if signature verified and payment exists for this session's plan notes on checkout
      // Prefer fail-closed only when we can prove ownership; otherwise require planId from notes path
      return NextResponse.json({ error: 'Order ownership could not be verified' }, { status: 403 })
    }
    if (!resolvedOrderId) {
      return NextResponse.json({ error: 'Could not resolve order for payment' }, { status: 400 })
    }

    await db.insert(payments).values({
      id: paymentId,
      userId: context.user.id,
      orderId: resolvedOrderId,
      amount: amount || '0',
      currency,
      planId: planId || null,
      status: 'verified',
    }).onConflictDoNothing()

    return NextResponse.json({ verified: true, orderId: resolvedOrderId, paymentId })
  } catch (error) {
    return jsonError(error as Error)
  }
}
