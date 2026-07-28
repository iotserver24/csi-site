import { ROLE_CATEGORIES } from '../config/coreMembers'
import {
  Calendar,
  Users,
  Briefcase,
  Award,
  Code,
  TrendingUp,
  Target,
  Star,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const getRoleCategory = (getUserRoleDisplay: () => string | null) => {
  const role = getUserRoleDisplay() || ''
  for (const [category, roles] of Object.entries(ROLE_CATEGORIES)) {
    if (roles.includes(role)) {
      return category
    }
  }
  return 'Team Member'
}

export const getRoleColor = (getRoleCategory: (fn: () => string | null) => string, getUserRoleDisplay: () => string | null) => {
  const category = getRoleCategory(getUserRoleDisplay)
  const colors: Record<string, string> = {
    'Executive Board': 'from-purple-500 to-purple-600',
    'Technical': 'from-cyan-500 to-cyan-600',
    'Creative': 'from-pink-500 to-pink-600',
    'Events': 'from-green-500 to-green-600',
    'Marketing': 'from-orange-500 to-orange-600'
  }
  return colors[category] || 'from-gray-500 to-gray-600'
}

export const getStats = (getUserRoleDisplay: () => string | null) => {
  const role = getUserRoleDisplay() || ''
  const statsArray: Array<{ label: string; value: string; icon: LucideIcon }> = []
  if (role === 'President' || role === 'Vice President') {
    statsArray.push(
      { label: 'Events Organized', value: '25', icon: Calendar },
      { label: 'Members Mentored', value: '50+', icon: Users },
      { label: 'Projects Led', value: '10', icon: Briefcase },
      { label: 'Achievement Points', value: '950', icon: Award }
    )
  } else if (role.includes('Technical')) {
    statsArray.push(
      { label: 'Projects Completed', value: '15', icon: Code },
      { label: 'Pull Requests', value: '45', icon: TrendingUp },
      { label: 'Issues Resolved', value: '30', icon: Target },
      { label: 'Tech Stack', value: '8+', icon: Star }
    )
  } else {
    statsArray.push(
      { label: 'Tasks Completed', value: '30', icon: CheckCircle },
      { label: 'Events Participated', value: '20', icon: Calendar },
      { label: 'Team Projects', value: '8', icon: Users },
      { label: 'Hours Contributed', value: '120+', icon: Clock }
    )
  }
  return statsArray
}
