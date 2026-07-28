import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { db } from '../../../../src/db/index'
import { payments } from '../../../../src/db/schema'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    const body = await request.json()
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body
    if (!orderId || !paymentId || !signature) return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 })
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest('hex')
    if (signature !== expected) return NextResponse.json({ verified: false, error: 'Invalid signature' }, { status: 400 })
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! })
    const order = await razorpay.orders.fetch(orderId)
    if (order.notes?.userId !== context.firebaseUser.uid) return NextResponse.json({ error: 'Order ownership mismatch' }, { status: 403 })
    await db.insert(payments).values({ id: paymentId as string, userId: context.user.id, orderId: orderId as string, amount: String(Number(order.amount) / 100), currency: order.currency || 'INR', planId: order.notes?.planId as string, status: 'verified' }).onConflictDoNothing()
    return NextResponse.json({ verified: true })
  } catch (error) { return jsonError(error as Error) }
}
