import { api } from '../lib/api-client'
import type { ProfileData } from '../types'

export async function updateProfileWithImage(userId: string, profileData: ProfileData, imageFile?: File) {
  if (imageFile) {
    const media = await api.post('/api/media/upload-url', {
      fileName: imageFile.name,
      contentType: imageFile.type,
      size: imageFile.size,
    })
    await fetch(media.uploadUrl as string, { method: 'PUT', headers: { 'Content-Type': imageFile.type }, body: imageFile })
    profileData = { ...profileData, photoURL: media.publicUrl as string }
  }
  return api.patch('/api/profile', profileData as unknown as Record<string, unknown>)
}

export function validateProfileData(data: ProfileData) {
  const errors: Record<string, string> = {}
  if (!data.name?.trim()) errors.name = 'Name is required'
  if (data.phone && !/^\+?[0-9\s-]{8,15}$/.test(data.phone)) errors.phone = 'Enter a valid phone number'
  if (data.linkedin && !/^https?:\/\//.test(data.linkedin)) errors.linkedin = 'Please enter a valid LinkedIn URL'
  return { isValid: Object.keys(errors).length === 0, errors }
}
