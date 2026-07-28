import { api } from '../lib/api-client'
import teamData from '../data/teamData.json'

const fallbackStudents = (teamData.studentTeamData || []).map((member, index) => ({ ...member, id: member.id || `student-${index}` }))

export const fetchAllMembers = async () => {
  try { return (await api.get('/api/team')).students } catch { return fallbackStudents }
}
export const fetchCoreMembers = async () => (await fetchAllMembers()).filter(member => member.isCoreMember)
export const fetchFacultyMembers = async () => teamData.facultyData || []
export const transformUserToTeamMember = user => ({
  id: user.uid || user.id, name: user.name || 'Unknown', role: user.roleName || user.role || 'Member',
  usn: user.usn || '', branch: user.branch || user.profile?.branch || '', year: user.year || user.profile?.year || '',
  linkedin: user.linkedin || '#', github: user.github || '#', imageSrc: user.photoURL || '/default-avatar.png',
  skills: user.skills || [], bio: user.bio || '', email: user.email || '', isCoreMember: user.role === 'coreMember',
})
export const isProfileComplete = member => Boolean(member.photoURL && member.name && member.email)
