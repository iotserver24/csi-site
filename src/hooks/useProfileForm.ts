import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import type { ProfileData as _ProfileData } from '../types'

interface ProfileFormData {
  name: string
  email: string
  username: string
  phone: string
  college: string
  branch: string
  year: string
  bio: string
  usn: string
  github: string
  linkedin: string
}

export const useProfileForm = () => {
  const { user, updateUserProfile } = useAuth()
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    email: '',
    username: '',
    phone: '',
    college: 'NMAMIT',
    branch: '',
    year: '',
    bio: '',
    usn: '',
    github: '',
    linkedin: '',
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const usn = user.usn || ''
    const defaultFromUsn = usn
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 24)
    const profile: ProfileFormData = {
      name: user.name || '',
      email: user.email || '',
      // Prefer existing handle, else default username = USN
      username: user.username || defaultFromUsn || '',
      phone: user.phone || user.profile?.phone || '',
      college: user.college || user.profile?.college || 'NMAMIT',
      branch: user.branch || user.profile?.branch || '',
      year: user.year || user.profile?.year || '',
      bio: user.bio || user.profile?.bio || '',
      usn,
      github: user.github || '',
      linkedin: user.linkedin || '',
    }
    setProfileData(profile)
    setOriginalData(profile)
    setLoading(false)
  }, [user])

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setProfileData(prev => {
      if (name === 'username') {
        return {
          ...prev,
          username: value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        }
      }
      // Typing USN auto-fills username when handle was empty or still tracked the previous USN
      if (name === 'usn') {
        const nextUsn = value
        const nextHandle = nextUsn
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '')
          .slice(0, 24)
        const prevUsnHandle = prev.usn
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '')
          .slice(0, 24)
        const shouldSyncUsername =
          !prev.username || prev.username === prevUsnHandle
        return {
          ...prev,
          usn: nextUsn,
          username: shouldSyncUsername && nextHandle.length >= 3 ? nextHandle : prev.username,
        }
      }
      return { ...prev, [name]: value }
    })
  }
  const validate = (data: ProfileFormData) => {
    if (data.username) {
      const u = data.username.trim()
      if (u.length < 3) return 'Username must be at least 3 characters.'
      if (u.length > 24) return 'Username must be at most 24 characters.'
      if (!/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/.test(u)) {
        return 'Username: letters, numbers, _ or - only.'
      }
    }
    if (data.usn && data.usn.length < 3) return 'USN must be at least 3 characters long.'
    if (data.phone && data.phone.length < 8) return 'Phone number must be at least 8 characters long.'
    return null
  }
  const handleSave = async () => {
    if (!user?.uid) return false
    const error = validate(profileData)
    if (error) { toast.error(error); return false }
    setLoading(true)
    try {
      await updateUserProfile(profileData)
      setOriginalData(profileData); setIsEditing(false); return true
    } catch (e) { toast.error((e as Error).message || 'Failed to save profile'); return false } finally { setLoading(false) }
  }
  return { profileData, isEditing, loading, handleEdit: () => setIsEditing(true), handleCancel: () => { setIsEditing(false); if (originalData) setProfileData(originalData) }, handleSave, handleInputChange }
}
