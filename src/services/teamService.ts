import { api } from '../lib/api-client'
import teamData from '../data/teamData.json'
import type { TeamMember, AppUser } from '../types'

const fallbackStudents: TeamMember[] = (teamData.studentTeamData || []).map((member: Record<string, unknown>, index: number) => ({ ...member, id: member.id || `student-${index}` } as TeamMember))

export const fetchAllMembers = async (): Promise<TeamMember[]> => {
  try { return (await api.get('/api/team')).students as TeamMember[] } catch { return fallbackStudents }
}
export const fetchCoreMembers = async (): Promise<TeamMember[]> => (await fetchAllMembers()).filter(member => member.isCoreMember)
export const fetchFacultyMembers = async () => teamData.facultyData || []
export const transformUserToTeamMember = (user: AppUser): TeamMember => ({
  id: user.uid || user.id, name: user.name || 'Unknown', role: user.roleName || user.role || 'Member',
  usn: user.usn || '', branch: user.branch || user.profile?.branch || '', year: user.year || user.profile?.year || '',
  linkedin: user.linkedin || '#', github: user.github || '#', imageSrc: user.photoURL || '/default-avatar.png',
  skills: (user as unknown as Record<string, unknown>).skills as string[] || [], bio: user.bio || '', email: user.email || '', isCoreMember: user.role === 'coreMember',
})
export const isProfileComplete = (member: TeamMember) => Boolean(member.imageSrc && member.name && member.email)
