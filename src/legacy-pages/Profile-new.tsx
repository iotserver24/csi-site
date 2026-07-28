import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useProfileForm } from '../hooks/useProfileForm'
import ProfileHero from '../components/Profile/ProfileHero'
import ProfileCard from '../components/Profile/ProfileCard'
import ProfileForm from '../components/Profile/ProfileForm'
import MembershipDetails from '../components/Profile/MembershipDetails'
import QuickActions from '../components/Profile/QuickActions'


const Profile = () => {
  const { user, loading: authLoading } = useAuth()
  const {
    profileData,
    isEditing,
    loading: profileLoading,
    handleEdit,
    handleCancel,
    handleSave,
    handleInputChange
  } = useProfileForm()

  const router = useRouter()
  const returnTo = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('returnTo')

  // Auto-enable edit mode if returning from recruit page with incomplete profile
  useEffect(() => {
    if (returnTo && !profileLoading && profileData) {
      // Check if profile is actually incomplete before forcing edit mode
      const isProfileIncomplete = !profileData.phone || !profileData.branch || !profileData.year || !profileData.usn
      if (isProfileIncomplete) {
        handleEdit()
        // Optional: Notify user why they are in edit mode
        // toast('Please complete your profile to continue registration', { icon: '📝' })
      }
    }
  }, [returnTo, profileLoading, profileData])

  const handleSaveWrapper = async () => {
    const success = await handleSave()
    if (success && returnTo) {
      router.push(returnTo)
    }
    return success
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {authLoading || profileLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <ProfileHero />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Card & Quick Actions */}
              <div className="lg:col-span-1 space-y-6">
                <ProfileCard user={user!} membershipStatus={user?.membership?.status || ''} membershipType={user?.membership?.type || null} />
                <QuickActions />
              </div>

              {/* Right Column - Profile Form & Other Components */}
              <div className="lg:col-span-2 space-y-6">
                <ProfileForm
                  profileData={profileData}
                  isEditing={isEditing}
                  loading={profileLoading}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                  onSave={handleSaveWrapper}
                  onInputChange={handleInputChange as (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void}
                />
                <MembershipDetails
                  user={user}
                  isEditing={isEditing}
                  onSave={handleSaveWrapper}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}

export default Profile
