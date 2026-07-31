import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getPlanById, getPlanPriceBreakdown } from '../../../../src/data/membershipData'
import { clientIp, rateLimit } from '../../../../src/lib/rate-limit'
import { jsonError, requireUser } from '../../../../src/lib/server-auth'

function digitsOnlyPhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return undefined
  return digits.length === 10 ? `+91${digits}` : `+${digits}`
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser(request)
    if (!(await rateLimit(`pay-order:${context.user.id}:${clientIp(request)}`, 5, 60_000))) {
      return NextResponse.json({ error: 'Too many order attempts' }, { status: 429 })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const planId = typeof body.planId === 'string' ? body.planId : ''
    // Never trust client userId — always bind to authenticated user
    const userId = context.firebaseUser.uid

    if (!planId || planId.length > 64) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }
    if (body.userId && body.userId !== userId) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
    }

    const plan = getPlanById(planId)
    if (!plan) return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })

    if (
      context.user.membershipStatus === 'active'
      && context.user.membershipExpiresAt
      && context.user.membershipExpiresAt > new Date()
    ) {
      return NextResponse.json({ error: 'Active membership already exists' }, { status: 400 })
    }

    const breakdown = getPlanPriceBreakdown(plan)
    const totalPaise = Math.round(breakdown.total * 100)
    const membershipPaise = Math.round(breakdown.membership * 100)
    const feePaise = Math.round(breakdown.transactionFee * 100)

    const formData = (body.formData && typeof body.formData === 'object')
      ? body.formData as Record<string, unknown>
      : {}
    const customerName =
      (typeof formData.name === 'string' && formData.name.trim())
      || context.user.name
      || 'CSI Member'
    const customerEmail =
      (typeof formData.email === 'string' && formData.email.trim())
      || context.user.email
      || undefined
    const customerContact =
      digitsOnlyPhone(formData.phone)
      || digitsOnlyPhone(context.user.phone)

    const notes: Record<string, string> = {
      userId,
      planId,
      planName: plan.name,
      membershipAmount: String(breakdown.membership),
      transactionFee: String(breakdown.transactionFee),
      totalAmount: String(breakdown.total),
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Prefer Invoices so Razorpay bill shows membership + transaction fee as separate lines
    let orderId: string
    let amount: number | string = totalPaise
    let currency = 'INR'
    let invoiceId: string | undefined

    try {
      if (!customerEmail) throw new Error('Customer email required for invoice')

      const invoice = await razorpay.invoices.create({
        type: 'invoice',
        description: `${plan.name} (membership + transaction fee)`,
        customer: {
          name: customerName.slice(0, 50),
          email: customerEmail,
          ...(customerContact ? { contact: customerContact } : {}),
        },
        line_items: [
          {
            name: plan.name,
            description: `CSI NMAMIT membership — ${plan.duration}`,
            amount: membershipPaise,
            currency: 'INR',
            quantity: 1,
          },
          {
            name: 'Transaction fee',
            description: 'Payment gateway / processing fee',
            amount: feePaise,
            currency: 'INR',
            quantity: 1,
          },
        ],
        currency: 'INR',
        sms_notify: 0,
        email_notify: 0,
        notes,
      })

      let issued = invoice
      if (invoice.id && invoice.status === 'draft') {
        issued = await razorpay.invoices.issue(invoice.id)
      }

      if (!issued.order_id) {
        throw new Error('Invoice created without order_id')
      }

      orderId = issued.order_id
      invoiceId = issued.id
      amount = issued.amount ?? totalPaise
      currency = issued.currency || 'INR'

      // Orders linked to invoices may not inherit notes — stamp ownership on the order
      try {
        await razorpay.orders.edit(orderId, { notes })
      } catch {
        // Non-fatal: verify still works if notes land on payment via checkout notes
      }
    } catch {
      // Fallback: single-amount order (breakdown still in notes + checkout description)
      const order = await razorpay.orders.create({
        amount: totalPaise,
        currency: 'INR',
        receipt: `membership_${context.user.id}_${Date.now()}`.slice(0, 40),
        notes,
      })
      orderId = order.id
      amount = order.amount
      currency = order.currency || 'INR'
    }

    return NextResponse.json({
      orderId,
      amount,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      invoiceId,
      breakdown: {
        membership: breakdown.membership,
        transactionFee: breakdown.transactionFee,
        total: breakdown.total,
      },
      description: `${plan.name} ₹${breakdown.membership} + Transaction fee ₹${breakdown.transactionFee}`,
    })
  } catch (error) {
    return jsonError(error as Error)
  }
}
