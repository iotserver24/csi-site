import { api } from '../lib/api-client'
import { getPlanById, getPlanPriceBreakdown, membershipPlans } from '../data/membershipData'
import { isValidEmail, isValidPhone, isValidUSN, sanitizeFormData } from '../utils/securityUtils'

interface PaymentFormData {
  name: string
  email: string
  phone: string
  usn: string
  whyJoin: string
}

interface RazorpayResponse {
  razorpay_payment_id?: string
  razorpay_order_id?: string
  razorpay_invoice_id?: string
  razorpay_invoice_status?: string
  razorpay_invoice_receipt?: string | null
  razorpay_signature?: string
  [key: string]: unknown
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

class PaymentService {
  razorpayKeyId: string
  constructor() { this.razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '' }

  validatePaymentData(data: PaymentFormData, planId: string) {
    if (!membershipPlans.find(plan => plan.id === planId)) throw new Error('Invalid membership plan selected')
    if (!isValidEmail(data.email) || !isValidPhone(data.phone) || !isValidUSN(data.usn)) throw new Error('Please check your membership details')
  }

  async createOrder(userId: string, planId: string, formData: PaymentFormData) {
    this.validatePaymentData(formData, planId)
    return api.post('/api/payments/order', { userId, planId, formData: sanitizeFormData(formData as unknown as Record<string, unknown>) })
  }

  async initializePayment(userId: string, planId: string, formData: PaymentFormData, onSuccess: (result: Record<string, unknown>) => void, onFailure: (error: string) => void) {
    try {
      if (!this.razorpayKeyId) throw new Error('Payment gateway not configured')
      const order = await this.createOrder(userId, planId, formData) as {
        amount: number
        currency: string
        orderId: string
        invoiceId?: string
        description?: string
        breakdown?: { membership: number; transactionFee: number; total: number }
      }
      if (!order.orderId) throw new Error('Payment order was not created')
      const plan = getPlanById(planId)
      if (!plan) throw new Error('Plan not found')
      const breakdown = order.breakdown || getPlanPriceBreakdown(plan)
      const description =
        order.description
        || `${plan.name} ₹${breakdown.membership} + Transaction fee ₹${breakdown.transactionFee}`
      const createdOrderId = order.orderId
      const createdInvoiceId = order.invoiceId
      const razorpay = new window.Razorpay({
        key: this.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CSI NMAMIT',
        description,
        image: '/csi-logo.png',
        order_id: createdOrderId,
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        notes: {
          userId,
          planId,
          membershipAmount: String(breakdown.membership),
          transactionFee: String(breakdown.transactionFee),
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Invoice checkout often omits order_id / uses invoice_* fields — send everything we have
            const verifyPayload: Record<string, unknown> = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id || createdOrderId,
              razorpay_signature: response.razorpay_signature,
              razorpay_invoice_id: response.razorpay_invoice_id || createdInvoiceId,
              razorpay_invoice_status: response.razorpay_invoice_status,
              razorpay_invoice_receipt: response.razorpay_invoice_receipt ?? null,
            }
            if (!verifyPayload.razorpay_payment_id) {
              throw new Error('Payment completed but Razorpay did not return a payment id')
            }
            // Signature is preferred but not required — server also verifies via Razorpay API
            const result = await api.post('/api/payments/verify', verifyPayload)
            if (!result.verified) throw new Error((result.error as string) || 'Payment verification failed')
            onSuccess(result)
          } catch (err) {
            onFailure((err as Error).message || 'Payment verification failed')
          }
        },
        modal: { ondismiss: () => onFailure('Payment cancelled by user') },
        theme: { color: '#3b82f6' },
      })
      razorpay.open()
    } catch (error) { onFailure((error as Error).message) }
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise(resolve => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true); script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }
}

export default new PaymentService()
