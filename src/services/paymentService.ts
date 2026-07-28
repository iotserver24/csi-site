import { api } from '../lib/api-client'
import { membershipPlans } from '../data/membershipData'
import { isValidEmail, isValidPhone, isValidUSN, sanitizeFormData } from '../utils/securityUtils'

interface PaymentFormData {
  name: string
  email: string
  phone: string
  usn: string
  whyJoin: string
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
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
      const order = await this.createOrder(userId, planId, formData)
      const plan = membershipPlans.find(item => item.id === planId)
      if (!plan) throw new Error('Plan not found')
      const razorpay = new window.Razorpay({
        key: this.razorpayKeyId, amount: order.amount, currency: order.currency, name: 'CSI NMAMIT',
        description: `${plan.name} - ${plan.duration}`, image: '/csi-logo.png', order_id: order.orderId,
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        handler: async (response: RazorpayResponse) => {
          const result = await api.post('/api/payments/verify', response as unknown as Record<string, unknown>)
          if (!result.verified) throw new Error('Payment verification failed')
          onSuccess(result)
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
