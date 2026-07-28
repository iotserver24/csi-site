import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { eq } from 'drizzle-orm'
import { db } from '../../../../src/db/index.js'
import { membershipPlans } from '../../../../src/db/schema.js'
import { jsonError, requireUser } from '../../../../src/lib/server-auth.js'

const fallbackPlans = { 'one-year': { price: 358, name: '1-Year Executive Membership' }, 'two-year': { price: 664, name: '2-Year Executive Membership' }, 'three-year': { price: 919, name: '3-Year Executive Membership' } }

export async function POST(request) {
  try {
    const context = await requireUser(request)
    const { userId, planId } = await request.json()
    if (userId !== context.firebaseUser.uid) return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
    const [dbPlan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, planId)).limit(1)
    const plan = dbPlan || fallbackPlans[planId]
    if (!plan) return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    if (context.user.membershipStatus === 'active' && context.user.membershipExpiresAt > new Date()) return NextResponse.json({ error: 'Active membership already exists' }, { status: 400 })
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    const order = await razorpay.orders.create({ amount: Math.round(Number(plan.price) * 100), currency: 'INR', receipt: `membership_${context.user.id}_${Date.now()}`, notes: { userId, planId, planName: plan.name } })
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID })
  } catch (error) { return jsonError(error) }
}
