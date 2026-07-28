import { motion } from 'framer-motion'
import Image from 'next/image'
import { CheckCircle, AlertCircle } from 'lucide-react'
import ProfileStats from './ProfileStats'
import type { AppUser } from '../../types'

interface ProfileCardProps {
  user: AppUser
  membershipStatus: string
  membershipType: string | null
}

const ProfileCard = ({ user, membershipStatus, membershipType }: ProfileCardProps) => {
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
            className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-900"
          />
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-950" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{user.email}</p>

        {/* Membership Badge */}
        <div className="mb-8">
          {membershipStatus === 'active' ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                            bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 
                            dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
              <CheckCircle size={14} />
              <span className="text-xs font-bold uppercase tracking-wide">{membershipType} Member</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                            bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 
                            border border-gray-100 dark:border-gray-800">
              <AlertCircle size={14} />
              <span className="text-xs font-bold uppercase tracking-wide">Inactive</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <ProfileStats />
      </div>
    </motion.div>
  )
}

export default ProfileCard
