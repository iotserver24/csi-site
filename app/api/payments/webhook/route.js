import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index.js'
import { membershipPlans, payments, users } from '../../../../src/db/schema.js'

const durations = { 'one-year': 1, 'two-year': 2, 'three-year': 3 }

export async function POST(request) {
  const raw = Buffer.from(await request.arrayBuffer())
  const signature = request.headers.get('x-razorpay-signature')
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(raw).digest('hex')
  if (!signature || signature !== expected) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  const body = JSON.parse(raw.toString('utf8'))
  if (body.event !== 'payment.captured') return NextResponse.json({ status: 'ignored' })
  const payment = body.payload?.payment?.entity
  const planId = payment?.notes?.planId
  const firebaseUid = payment?.notes?.userId
  if (!payment?.id || !planId || !firebaseUid) return NextResponse.json({ error: 'Invalid payment payload' }, { status: 400 })
  const [existing] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1)
  if (existing) return NextResponse.json({ status: 'ok', duplicate: true })
  const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, planId)).limit(1)
  const startsAt = new Date()
  const expiresAt = new Date(startsAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + (plan?.durationYears || durations[planId] || 1))
  await db.transaction(async tx => {
    await tx.insert(payments).values({ id: payment.id, userId: user.id, orderId: payment.order_id, amount: String(payment.amount / 100), currency: payment.currency || 'INR', planId, status: payment.status || 'captured', webhookPayload: body })
    await tx.update(users).set({ membershipStatus: 'active', membershipType: planId, membershipStartsAt: startsAt, membershipExpiresAt: expiresAt, updatedAt: startsAt }).where(eq(users.id, user.id))
  })
  return NextResponse.json({ status: 'ok' })
}
