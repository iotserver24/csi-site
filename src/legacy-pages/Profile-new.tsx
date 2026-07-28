import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useProfileForm } from '../hooks/useProfileForm'
import ProfileHero from '../components/Profile/ProfileHero'
import ProfileCard from '../components/Profile/ProfileCard'
import ProfileForm from '../components/Profile/ProfileForm'
import MembershipDetails from '../components/Profile/MembershipDetails'
import QuickActions from '../components/Profile/QuickActions'
import CertificatesSection from '../components/Profile/CertificatesSection'


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

  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const returnTo = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('returnTo')

  const shareProfile = () => {
    const url = `${window.location.origin}/u/${user?.uid || user?.id || ''}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
  }, [returnTo, profileLoading, profileData, handleEdit])

  const handleSaveWrapper = async () => {
    const success = await handleSave()
    if (success && returnTo) {
      router.push(returnTo)
    }
    return success
  }

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/')
  }, [authLoading, user, router])

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {authLoading || profileLoading || !user ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <ProfileHero />

            {/* Share Profile Button */}
            <div className="flex justify-end mb-4">
              <Link href={`/u/${user?.uid || user?.id || ''}`} target="_blank"
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                View Public Profile ↗
              </Link>
              <button onClick={shareProfile}
                className="ml-2 flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium transition-colors">
                {copied ? '✓ Copied!' : '📋 Copy Share Link'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Card & Quick Actions */}
              <div className="lg:col-span-1 space-y-6">
                {user && <ProfileCard user={user} membershipStatus={user.membership?.status || ''} membershipType={user.membership?.type || null} />}
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
                <CertificatesSection />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}

export default Profile
