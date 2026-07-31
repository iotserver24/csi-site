import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import RecruitHero from '../components/Recruit/RecruitHero'
import BenefitsSection from '../components/Recruit/BenefitsSection'
import MembershipPlans from '../components/Recruit/MembershipPlans'
import RegistrationForm from '../components/Recruit/RegistrationForm'
import { useSecureRecruit } from '../hooks/useSecureRecruit'
import { getPlanDisplayLabel, isMembershipActive } from '../data/membershipData'
import type { PaymentFormData } from '../types'

const Recruit = () => {
  const { user } = useAuth()
  const alreadyMember = isMembershipActive(user?.membership)
  
  const {
    formData,
    loading,
    selectedPlan,
    setSelectedPlan,
    handleInputChange,
    handleSubmit,
    signInWithGoogle
  } = useSecureRecruit()

  const planLabel = getPlanDisplayLabel(user?.membership?.type)
  const expiresAt = user?.membership?.expiresAt
    ? new Date(user.membership.expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen pt-20 pb-20">
      {/* Hero Section */}
      <RecruitHero />

      {/* Benefits Section */}
      <BenefitsSection />

      {alreadyMember ? (
        <section className="container-custom mb-16">
          <div className="max-w-2xl mx-auto text-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              You&apos;re already a CSI member
            </h2>
            <p className="mb-1 text-emerald-300/90 font-medium">
              {planLabel} membership · Active
            </p>
            {expiresAt && (
              <p className="mb-6 text-sm text-gray-400">Valid until {expiresAt}</p>
            )}
            {!expiresAt && <div className="mb-6" />}
            <p className="mb-8 text-gray-400">
              You cannot purchase another membership while yours is active.
              View your profile for membership details and certificates.
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-cyber-blue px-8 py-3 font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:opacity-95"
            >
              Go to Profile
            </Link>
          </div>
        </section>
      ) : (
        <>
          <MembershipPlans
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
          <RegistrationForm
            user={user}
            formData={formData as PaymentFormData & { whyJoin: string }}
            loading={loading}
            selectedPlan={selectedPlan}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onSignIn={signInWithGoogle}
          />
        </>
      )}
    </div>
  )
}

export default Recruit
