import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index'
import { membershipPlans, payments, users } from '../../../../src/db/schema'
import { timingSafeEqualHex } from '../../../../src/lib/crypto-util'
import { clientIp, rateLimit } from '../../../../src/lib/rate-limit'

const durations: Record<string, number> = { 'one-year': 1, 'two-year': 2, 'three-year': 3 }

export async function POST(request: NextRequest) {
  if (!(await rateLimit(`webhook:${clientIp(request)}`, 60, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const raw = Buffer.from(await request.arrayBuffer())
  if (raw.length > 256 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const signature = request.headers.get('x-razorpay-signature') || ''
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  if (!signature || !timingSafeEqualHex(signature, expected)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let body: {
    event?: string
    payload?: { payment?: { entity?: Record<string, unknown> } }
  }
  try {
    body = JSON.parse(raw.toString('utf8'))
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.event !== 'payment.captured') return NextResponse.json({ status: 'ignored' })

  const payment = body.payload?.payment?.entity as {
    id?: string
    order_id?: string
    amount?: number
    currency?: string
    status?: string
    notes?: { planId?: string; userId?: string }
  } | undefined

  const planId = payment?.notes?.planId
  const firebaseUid = payment?.notes?.userId
  if (!payment?.id || !payment.order_id || !planId || !firebaseUid) {
    return NextResponse.json({ error: 'Invalid payment payload' }, { status: 400 })
  }

  const [existing] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1)
  if (existing) return NextResponse.json({ status: 'ok', duplicate: true })

  const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, planId)).limit(1)
  const expectedRupees = plan ? Number(plan.price) : null
  if (expectedRupees != null && Number.isFinite(expectedRupees) && typeof payment.amount === 'number') {
    const paidRupees = payment.amount / 100
    // Allow 1 paise float noise only
    if (Math.abs(paidRupees - expectedRupees) > 0.02) {
      console.error('Webhook amount mismatch', { paymentId: payment.id, paidRupees, expectedRupees, planId })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }
  }

  const startsAt = new Date()
  const expiresAt = new Date(startsAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + (plan?.durationYears || durations[planId as string] || 1))

  await db.transaction(async tx => {
    await tx.insert(payments).values({
      id: payment.id as string,
      userId: user.id,
      orderId: payment.order_id as string,
      amount: String((payment.amount || 0) / 100),
      currency: payment.currency || 'INR',
      planId,
      status: payment.status || 'captured',
      webhookPayload: body,
    })
    await tx.update(users).set({
      membershipStatus: 'active',
      membershipType: planId,
      membershipStartsAt: startsAt,
      membershipExpiresAt: expiresAt,
      updatedAt: startsAt,
    }).where(eq(users.id, user.id))
  })

  return NextResponse.json({ status: 'ok' })
}
