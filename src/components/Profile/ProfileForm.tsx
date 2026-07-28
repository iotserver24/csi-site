import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  Building,
  BookOpen,
  GraduationCap,
  Edit,
  Save,
  X,
  Loader,
  CreditCard
} from 'lucide-react'

import type { ProfileData } from '../../types'

const Github: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);
const Linkedin: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);

interface ProfileFormProps {
  profileData: ProfileData
  isEditing: boolean
  loading: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

const ProfileForm = ({
  profileData,
  isEditing,
  loading,
  onEdit,
  onSave,
  onCancel,
  onInputChange
}: ProfileFormProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="lg:col-span-2"
    >
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Profile Information</h3>
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <Edit size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save
              </button>
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User size={16} />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={onInputChange}
              disabled={!isEditing}
              className="input-field"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              disabled
              className="input-field opacity-60"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={onInputChange}
              disabled={!isEditing}
              placeholder="+91 XXXXX XXXXX"
              className="input-field"
            />
          </div>

          {/* College */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building size={16} />
              College
            </label>
            <input
              type="text"
              name="college"
              value={profileData.college}
              disabled
              className="input-field opacity-60"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BookOpen size={16} />
              Branch
            </label>
            <select
              name="branch"
              value={profileData.branch}
              onChange={onInputChange}
              disabled={!isEditing}
              className="input-field"
            >
              <option value="">Select Branch</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Science">Information Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <GraduationCap size={16} />
              Year
            </label>
            <select
              name="year"
              value={profileData.year}
              onChange={onInputChange}
              disabled={!isEditing}
              className="input-field"
            >
              <option value="">Select Year</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
              <option value="Final Year">Final Year</option>
            </select>
          </div>

          {/* USN */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <CreditCard size={16} />
              USN
            </label>
            <input
              type="text"
              name="usn"
              value={profileData.usn || ''}
              onChange={onInputChange}
              disabled={!isEditing}
              placeholder="4NM21CS000"
              className="input-field"
            />
          </div>

          {/* GitHub */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Github size={16} />
              GitHub Username
            </label>
            <input
              type="text"
              name="github"
              value={profileData.github || ''}
              onChange={onInputChange}
              disabled={!isEditing}
              placeholder="username"
              className="input-field"
            />
          </div>

          {/* LinkedIn */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Linkedin size={16} />
              LinkedIn Profile URL
            </label>
            <input
              type="text"
              name="linkedin"
              value={profileData.linkedin || ''}
              onChange={onInputChange}
              disabled={!isEditing}
              placeholder="https://linkedin.com/in/username"
              className="input-field"
            />
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User size={16} />
              Bio
            </label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={onInputChange}
              disabled={!isEditing}
              rows={4}
              placeholder="Tell us about yourself..."
              className="input-field resize-none"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfileForm
