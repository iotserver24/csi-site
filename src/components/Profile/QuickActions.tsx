import { CreditCard } from 'lucide-react'
import Link from 'next/link'

const QuickActions: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-6 mt-6">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <Link
          href="/recruit"
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <CreditCard size={18} />
            Manage Membership
          </span>
        </Link>
      </div>
    </div>
  )
}

export default QuickActions
