import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import TeamHero from '../components/Team/TeamHero'
import StudentGrid from '../components/Team/StudentGrid'
import MemberModal from '../components/Team/MemberModal'
import { fetchAllMembers } from '../services/teamService'
import teamData from '../data/teamData.json'
import { toast } from 'sonner'
import type { TeamMember } from '../types'

const Team = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [students, setStudents] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const fetchTeamData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [studentData] = await Promise.all([
        fetchAllMembers()
      ])
      setStudents(studentData)
    } catch (err: unknown) {
      console.log('Error fetching team data:', err instanceof Error ? err.message : err)
      setStudents((Array.isArray(teamData.studentTeamData) ? teamData.studentTeamData : []) as unknown as TeamMember[])
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const openFromQueryIfAvailable = async () => {
      await fetchTeamData()
      const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
      const memberId = params.get('memberId')
      if (memberId) {
        const member = students.find(m => m.id === memberId)
        if (member) setSelectedMember(member)
      }
    }
    openFromQueryIfAvailable()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
    if (selectedMember?.id) {
      params.set('memberId', selectedMember.id)
    } else {
      params.delete('memberId')
    }
    router.replace(`${pathname}${params.toString() ? `?${params}` : ''}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMember])

  const handleRefresh = () => {
    toast.promise(
      fetchTeamData(),
      { loading: 'Refreshing team data...', success: 'Team data refreshed!', error: 'Failed to refresh data' }
    )
  }

  return (
    <div className="min-h-screen pt-20">
      <TeamHero />

      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">Loading team members...</p>
            </motion.div>
          ) : error ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={handleRefresh} className="btn-primary">Try Again</button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Core Team</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">The people behind CSI NMAMIT</p>
                </motion.div>
                <StudentGrid
                  students={students}
                  onMemberClick={setSelectedMember}
                />
              </div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}

export default Team
