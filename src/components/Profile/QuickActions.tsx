import { Award, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { isMembershipActive } from '../../data/membershipData'

const QuickActions: React.FC = () => {
  const { user } = useAuth()
  const alreadyMember = isMembershipActive(user?.membership)

  return (
    <div className="glass-card rounded-xl p-6 mt-6">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {alreadyMember ? (
          <div className="w-full flex items-center justify-between p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-700 dark:text-yellow-400">
            <span className="flex items-center gap-2 font-medium">
              <Award size={18} />
              Membership active
            </span>
          </div>
        ) : (
          <Link
            href="/recruit"
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CreditCard size={18} />
              Activate Membership
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

export default QuickActions
