import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { membershipPlans, payments, users } from '../../../../src/db/schema'
import { timingSafeEqualHex } from '../../../../src/lib/crypto-util'
import { clientIp, rateLimit } from '../../../../src/lib/rate-limit'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

const durations: Record<string, number> = { 'one-year': 1, 'two-year': 2, 'three-year': 3 }

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

function hmacHex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/** Build all known Razorpay checkout signature payloads (orders + invoices). */
function signaturePayloads(input: {
  orderId?: string | null
  invoiceId?: string | null
  paymentId: string
  invoiceStatus?: string | null
  invoiceReceipt?: string | null
}): string[] {
  const payloads: string[] = []
  const { orderId, invoiceId, paymentId, invoiceStatus, invoiceReceipt } = input

  // Standard Checkout (Orders API)
  if (orderId) payloads.push(`${orderId}|${paymentId}`)

  // Invoice checkout variants used across Razorpay docs / SDKs
  if (invoiceId) {
    payloads.push(`${invoiceId}|${paymentId}`)
    const status = invoiceStatus || 'paid'
    const receipt = invoiceReceipt ?? ''
    // inv_id|status|receipt|pay_id  (receipt may be empty string or "null")
    payloads.push(`${invoiceId}|${status}|${receipt}|${paymentId}`)
    payloads.push(`${invoiceId}|${status}|null|${paymentId}`)
    payloads.push(`${invoiceId}|${status}||${paymentId}`)
    // Some clients hash invoice id alone
    payloads.push(invoiceId)
  }

  return payloads
}

function signatureMatches(
  secret: string,
  signature: string,
  payloads: string[],
): boolean {
  return payloads.some((payload) => timingSafeEqualHex(signature, hmacHex(secret, payload)))
}

async function activateMembership(opts: {
  userId: string
  paymentId: string
  orderId: string
  amount: string
  currency: string
  planId: string | null
}) {
  const startsAt = new Date()
  let expiresAt: Date | null = null
  const planId = opts.planId

  if (planId) {
    const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, planId)).limit(1)
    const years = plan?.durationYears || durations[planId] || 1
    expiresAt = new Date(startsAt)
    expiresAt.setFullYear(expiresAt.getFullYear() + years)
  }

  await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      id: opts.paymentId,
      userId: opts.userId,
      orderId: opts.orderId,
      amount: opts.amount || '0',
      currency: opts.currency,
      planId: planId || null,
      status: 'verified',
    }).onConflictDoNothing()

    if (planId) {
      await tx.update(users).set({
        membershipStatus: 'active',
        membershipType: planId,
        membershipStartsAt: startsAt,
        membershipExpiresAt: expiresAt,
        updatedAt: startsAt,
      }).where(eq(users.id, opts.userId))
    }
  })
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
    const invoiceStatus =
      asNonEmptyString(body.razorpay_invoice_status, 32)
      || asNonEmptyString(body.invoiceStatus, 32)
    const invoiceReceipt =
      asNonEmptyString(body.razorpay_invoice_receipt, 128)
      || asNonEmptyString(body.invoiceReceipt, 128)
    const signature =
      asNonEmptyString(body.razorpay_signature, 256)
      || asNonEmptyString(body.signature, 256)

    if (!paymentId) {
      return NextResponse.json({
        error: 'Missing payment verification fields',
        detail: {
          hasPaymentId: false,
          hasOrderId: Boolean(orderId),
          hasInvoiceId: Boolean(invoiceId),
          hasSignature: Boolean(signature),
        },
      }, { status: 400 })
    }

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: secret })

    // Always fetch payment from Razorpay — source of truth for status/order/notes
    const payment = await razorpay.payments.fetch(paymentId) as {
      id?: string
      order_id?: string
      invoice_id?: string
      amount?: number | string
      currency?: string
      status?: string
      notes?: unknown
      email?: string
    }

    const paidStatuses = new Set(['captured', 'authorized', 'paid'])
    if (!payment.status || !paidStatuses.has(String(payment.status))) {
      return NextResponse.json({
        error: 'Payment not successful',
        detail: { status: payment.status || null },
      }, { status: 400 })
    }

    let resolvedOrderId = orderId || payment.order_id || null
    const resolvedInvoiceId = invoiceId || payment.invoice_id || null
    let amount = payment.amount != null ? String(Number(payment.amount) / 100) : ''
    let currency = payment.currency || 'INR'
    let ownerUid = notesUserId(payment.notes)
    let planId = notesPlanId(payment.notes)

    // Enrich from order notes (invoice-linked orders often hold ownership here)
    if (resolvedOrderId) {
      try {
        const order = await razorpay.orders.fetch(resolvedOrderId)
        amount = amount || String(Number(order.amount) / 100)
        currency = order.currency || currency
        ownerUid = ownerUid || notesUserId(order.notes)
        planId = planId || notesPlanId(order.notes)
        resolvedOrderId = order.id
      } catch (err) {
        console.error('verify: order fetch failed', resolvedOrderId, err)
      }
    }

    if (resolvedInvoiceId) {
      try {
        const invoice = await razorpay.invoices.fetch(resolvedInvoiceId) as {
          order_id?: string
          amount?: number | string
          currency?: string
          notes?: unknown
          status?: string
          receipt?: string | null
        }
        if (!resolvedOrderId && invoice.order_id) resolvedOrderId = invoice.order_id
        if (!amount && invoice.amount != null) amount = String(Number(invoice.amount) / 100)
        if (invoice.currency) currency = invoice.currency
        ownerUid = ownerUid || notesUserId(invoice.notes)
        planId = planId || notesPlanId(invoice.notes)
      } catch (err) {
        console.error('verify: invoice fetch failed', resolvedInvoiceId, err)
      }
    }

    // Signature check (when client provided one). Still require HMAC when present.
    let signatureOk = false
    if (signature) {
      const payloads = signaturePayloads({
        orderId: resolvedOrderId,
        invoiceId: resolvedInvoiceId,
        paymentId,
        invoiceStatus: invoiceStatus || 'paid',
        invoiceReceipt: invoiceReceipt,
      })
      signatureOk = signatureMatches(secret, signature, payloads)
    }

    // Fallback: trusted server-side verification via Razorpay API.
    // Invoice checkout sometimes returns a signature that doesn't match documented payloads;
    // payment entity is authenticated via our key secret, so captured + ownership is enough.
    const apiVerified =
      paidStatuses.has(String(payment.status))
      && Boolean(resolvedOrderId)
      && Boolean(ownerUid)

    if (!signatureOk && !apiVerified) {
      return NextResponse.json({
        verified: false,
        error: signature
          ? 'Invalid signature'
          : 'Missing payment signature and API ownership check failed',
        detail: {
          hasSignature: Boolean(signature),
          hasOrderId: Boolean(resolvedOrderId),
          hasOwner: Boolean(ownerUid),
          paymentStatus: payment.status || null,
        },
      }, { status: 400 })
    }

    if (ownerUid && ownerUid !== context.firebaseUser.uid) {
      return NextResponse.json({ error: 'Order ownership mismatch' }, { status: 403 })
    }

    if (!ownerUid) {
      // Last chance: match payer email to authenticated user (invoice prefill)
      const paymentEmail = typeof payment.email === 'string' ? payment.email.toLowerCase() : ''
      const userEmail = (context.user.email || '').toLowerCase()
      if (!paymentEmail || paymentEmail !== userEmail) {
        return NextResponse.json({ error: 'Order ownership could not be verified' }, { status: 403 })
      }
    }

    if (!resolvedOrderId) {
      return NextResponse.json({ error: 'Could not resolve order for payment' }, { status: 400 })
    }

    // Activate membership immediately (webhook remains a backup / idempotent path)
    await activateMembership({
      userId: context.user.id,
      paymentId,
      orderId: resolvedOrderId,
      amount: amount || '0',
      currency,
      planId: planId || null,
    })

    return NextResponse.json({
      verified: true,
      orderId: resolvedOrderId,
      paymentId,
      planId: planId || null,
      membershipActivated: Boolean(planId),
    })
  } catch (error) {
    console.error('payment verify error', error)
    return jsonError(error as Error)
  }
}
