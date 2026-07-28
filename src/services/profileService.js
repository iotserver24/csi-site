import { api } from '../lib/api-client'

export async function updateProfileWithImage(userId, profileData, imageFile) {
  if (imageFile) {
    const media = await api.post('/api/media/upload-url', {
      fileName: imageFile.name,
      contentType: imageFile.type,
      size: imageFile.size,
    })
    await fetch(media.uploadUrl, { method: 'PUT', headers: { 'Content-Type': imageFile.type }, body: imageFile })
    profileData = { ...profileData, photoURL: media.publicUrl }
  }
  return api.patch('/api/profile', profileData)
}

export function validateProfileData(data) {
  const errors = {}
  if (!data.name?.trim()) errors.name = 'Name is required'
  if (data.phone && !/^\+?[0-9\s-]{8,15}$/.test(data.phone)) errors.phone = 'Enter a valid phone number'
  if (data.linkedin && !/^https?:\/\//.test(data.linkedin)) errors.linkedin = 'Please enter a valid LinkedIn URL'
  return { isValid: Object.keys(errors).length === 0, errors }
}
