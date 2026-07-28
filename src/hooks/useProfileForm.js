import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

export const useProfileForm = () => {
  const { user, updateUserProfile } = useAuth()
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', college: 'NMAMIT', branch: '', year: '', bio: '', usn: '', github: '', linkedin: '' })
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [originalData, setOriginalData] = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const profile = {
      name: user.name || '', email: user.email || '', phone: user.phone || user.profile?.phone || '',
      college: user.college || user.profile?.college || 'NMAMIT', branch: user.branch || user.profile?.branch || '',
      year: user.year || user.profile?.year || '', bio: user.bio || user.profile?.bio || '', usn: user.usn || '',
      github: user.github || '', linkedin: user.linkedin || '',
    }
    setProfileData(profile); setOriginalData(profile); setLoading(false)
  }, [user])

  const handleInputChange = event => setProfileData(prev => ({ ...prev, [event.target.name]: event.target.value }))
  const validate = data => {
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
    } catch (e) { toast.error(e.message || 'Failed to save profile'); return false } finally { setLoading(false) }
  }
  return { profileData, isEditing, loading, handleEdit: () => setIsEditing(true), handleCancel: () => { setIsEditing(false); if (originalData) setProfileData(originalData) }, handleSave, handleInputChange }
}
