import type { InferSelectModel } from 'drizzle-orm'
import type { payments, membershipPlans, recruits } from '../db/schema'

export type DbPayment = InferSelectModel<typeof payments>
export type DbMembershipPlan = InferSelectModel<typeof membershipPlans>
export type DbRecruit = InferSelectModel<typeof recruits>

export interface MembershipPlan {
  id: string
  name: string
  price: number
  duration: string
  durationYears: number
  features: string[]
  popular?: boolean
}

export interface PaymentFormData {
  name: string
  email: string
  phone: string
  usn: string
  college: string
  branch: string
  year: string
}

export interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface MediaUploadResponse {
  uploadUrl: string
  publicUrl: string
  objectKey: string
}
