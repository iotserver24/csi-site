import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import paymentService from '../services/paymentService'
import {
  sanitizeFormData,
  isValidEmail,
  isValidPhone,
  isValidUSN
} from '../utils/securityUtils'

const POLL_INTERVAL = 1500
const MAX_POLL_ATTEMPTS = 12

export const useSecureRecruit = () => {
  const router = useRouter()
  const { user, signInWithGoogle, getUserData } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState('one-year')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const paymentAttempts = useRef(0)
  const lastPaymentTime = useRef(null)

  const [formData, setFormData] = useState({
    whyJoin: ''
  })

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    const sanitizedValue = typeof value === 'string'
      ? value.trim().substring(0, 100)
      : value

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }

    validateField(name, sanitizedValue)
  }, [errors])

  const validateField = (name, value) => {
    let error = null
    switch (name) {
      case 'email':
        if (value && !isValidEmail(value)) error = 'Invalid email format'
        break
      case 'phone':
        if (value && !isValidPhone(value)) error = 'Invalid phone number (10 digits starting with 6-9)'
        break
      case 'usn':
        if (value && !isValidUSN(value)) error = 'Invalid USN format (must start with NNM or NU)'
        break
    }
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const checkProfileCompletion = async () => {
    if (!user) return false
    let userData = user
    try {
      const freshData = await getUserData(user.uid)
      if (freshData) userData = { ...user, ...freshData }
    } catch (error) {
    }

    const requiredFields = ['phone', 'branch', 'year', 'usn']
    const missingFields = requiredFields.filter(field => {
      const value = userData[field] || userData.profile?.[field]
      return !value || String(value).trim() === ''
    })
    return missingFields.length === 0 && userData.name
  }

  const checkPaymentRateLimit = () => {
    const now = Date.now()
    if (lastPaymentTime.current && now - lastPaymentTime.current > 300000) {
      paymentAttempts.current = 0
    }
    if (paymentAttempts.current >= 3) {
      const timeLeft = Math.ceil((300000 - (now - lastPaymentTime.current)) / 60000)
      toast.error(`Too many payment attempts. Please wait ${timeLeft} minutes.`)
      return false
    }
    return true
  }

  const pollMembershipStatus = async (userId) => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL))
      try {
        const freshData = await getUserData(userId)
        if (freshData?.membership?.status === 'active') {
          return true
        }
      } catch (error) {
      }
    }
    return false
  }

  const handlePayment = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to continue')
        return
      }

      if (user.membership?.status === 'active') {
        toast.error('You already have an active subscription')
        return
      }

      let userData = user
      try {
        const freshData = await getUserData(user.uid)
        if (freshData) userData = { ...user, ...freshData }
      } catch (error) {
      }

      const requiredFields = ['phone', 'branch', 'year', 'usn']
      const missingFields = requiredFields.filter(field => {
        const value = userData[field] || userData.profile?.[field]
        return !value || String(value).trim() === ''
      })

      if (missingFields.length > 0 || !userData.name) {
        const missing = missingFields.join(', ')
        toast.error(`Please complete your profile. Missing: ${missing}`)
        router.push('/profile?returnTo=/recruit')
        return
      }

      if (!checkPaymentRateLimit()) return

      setLoading(true)
      paymentAttempts.current++
      lastPaymentTime.current = Date.now()

      const paymentData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || userData.profile?.phone,
        branch: userData.branch || userData.profile?.branch,
        year: userData.year || userData.profile?.year,
        usn: userData.usn || userData.profile?.usn,
        whyJoin: formData.whyJoin
      }

      const sanitizedData = sanitizeFormData(paymentData)

      const scriptLoaded = await paymentService.loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway')
      }

      await paymentService.initializePayment(
        user.uid,
        selectedPlan,
        sanitizedData,
        async () => {
          const processingToast = toast.loading('Payment confirmed! Activating your membership...')

          const activated = await pollMembershipStatus(user.uid)

          toast.dismiss(processingToast)
          if (activated) {
            toast.success('Membership activated! Welcome to CSI NMAMIT!')
          } else {
            toast.success('Payment successful! Your membership will be active shortly.')
          }

          paymentAttempts.current = 0
          setLoading(false)
          router.push('/profile')
        },
        (error) => {
          toast.error(error || 'Payment failed. Please try again.')
          setLoading(false)
        }
      )
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handlePayment()
  }

  const secureSignIn = async () => {
    try {
      const result = await signInWithGoogle()
      if (result) toast.success('Signed in successfully!')
    } catch (error) {
      toast.error('Failed to sign in. Please try again.')
    }
  }

  return {
    formData,
    loading,
    errors,
    selectedPlan,
    setSelectedPlan,
    handleInputChange,
    handleSubmit,
    signInWithGoogle: secureSignIn,
    checkProfileCompletion
  }
}
