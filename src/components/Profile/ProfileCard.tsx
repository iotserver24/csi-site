import { motion } from 'framer-motion'
import Image from 'next/image'
import { Award, AlertCircle } from 'lucide-react'
import ProfileStats from './ProfileStats'
import { getPlanDisplayLabel } from '../../data/membershipData'
import type { AppUser } from '../../types'

interface ProfileCardProps {
  user: AppUser
  membershipStatus: string
  membershipType: string | null
  eventsCount?: number
}

const ProfileCard = ({ user, membershipStatus, membershipType, eventsCount }: ProfileCardProps) => {
  const isActive = membershipStatus === 'active'
  const planLabel = getPlanDisplayLabel(membershipType)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="lg:col-span-1"
    >
      <div className="bg-white dark:bg-gray-950 border border-gray-100 
                      dark:border-gray-800 rounded-2xl p-8 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-6">
          <Image
            src={user.photoURL || '/default-avatar.svg'}
            alt={user.name ?? ''}
            width={96}
            height={96}
            unoptimized
            className={`w-24 h-24 rounded-full object-cover ring-4 ${
              isActive
                ? 'ring-yellow-400/60 dark:ring-yellow-400/40'
                : 'ring-gray-100 dark:ring-gray-900'
            }`}
          />
          {isActive ? (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-md">
              <Award size={14} className="text-yellow-900" />
            </div>
          ) : (
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-gray-400 rounded-full border-2 border-white dark:border-gray-950" />
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{user.email}</p>

        {/* Membership Badge */}
        <div className="mb-8 flex flex-col items-center gap-2">
          {isActive ? (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                              bg-yellow-400/15 text-yellow-700 dark:text-yellow-400
                              border border-yellow-400/40 shadow-sm">
                <Award size={14} />
                <span className="text-xs font-bold uppercase tracking-wide">CSI Member</span>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {planLabel} plan
              </p>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                            bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 
                            border border-gray-100 dark:border-gray-800">
              <AlertCircle size={14} />
              <span className="text-xs font-bold uppercase tracking-wide">Not a member</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <ProfileStats eventsCount={eventsCount} />
      </div>
    </motion.div>
  )
}

export default ProfileCard
