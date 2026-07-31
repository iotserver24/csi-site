import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { toast } from 'sonner'
import { getPlanDisplayLabel, isMembershipActive } from '../../data/membershipData'
import type { AppUser } from '../../types'

interface MembershipDetailsProps {
  user: AppUser | null
  isEditing: boolean
  onSave: () => Promise<boolean>
}

const MembershipDetails = ({ user, isEditing, onSave }: MembershipDetailsProps) => {
  const router = useRouter()
  const active = isMembershipActive(user?.membership)
  const membershipStatus = active ? 'active' : (user?.membership?.status || 'inactive')
  const planLabel = getPlanDisplayLabel(user?.membership?.type)
  const membershipExpiry = user?.membership?.expiresAt
    ? new Date(user.membership.expiresAt)
    : null

  const handleActivateClick = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault()
    if (active) return
    if (isEditing) {
      toast.loading('Saving profile before redirecting...', { id: 'save-redirect' })
      const success = await onSave()
      if (success) {
        toast.success('Profile saved! Redirecting...', { id: 'save-redirect' })
        router.push('/recruit')
      } else {
        toast.error('Failed to save profile. Please try again.', { id: 'save-redirect' })
      }
    } else {
      router.push('/recruit')
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Membership Details</h3>
        {active && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 border border-yellow-400/40">
            <Award size={12} />
            CSI Member
          </span>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between gap-4 items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <p className={`font-semibold capitalize ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              {membershipStatus}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
            <p className="font-semibold">{active ? planLabel : '—'}</p>
          </div>
          {membershipExpiry && active && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expires</p>
              <p className="font-semibold">
                {membershipExpiry.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {!active && (
          <button
            onClick={handleActivateClick}
            className="w-full btn-primary block text-center py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            {isEditing ? 'Save & Activate Membership' : 'Activate Membership'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default MembershipDetails
