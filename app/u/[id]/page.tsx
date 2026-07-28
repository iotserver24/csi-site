'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Award, ExternalLink, Copy, Check } from 'lucide-react'
import { api } from '../../../src/lib/api-client'

const Github: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);
const Linkedin: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);

interface ProfileData {
  user: {
    id: string; name: string; email: string; photoURL: string; bio: string; usn: string;
    branch: string; year: string; college: string; github: string; linkedin: string;
    membershipStatus: string; certificates: Array<{ title: string; date: string; issuer?: string }>;
    createdAt: string;
  }
  role: string
  events: Array<{
    id: string; title: string; date: string; type: string; category: string; image: string;
    registrationStatus: string; teamName: string;
  }>
}

export default function SharedProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get(`/api/profile/${params.id}`)
        setProfile(data as unknown as ProfileData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Profile not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [params.id])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 grid place-items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
    </div>
  )

  if (error || !profile) return (
    <div className="min-h-screen bg-gray-950 grid place-items-center text-white">
      <div className="text-center">
        <p className="text-xl mb-4">Profile not found</p>
        <Link href="/" className="text-yellow-400 hover:underline">Go home</Link>
      </div>
    </div>
  )

  const { user, events, role } = profile
  const certificates = (user.certificates || []) as Array<{ title: string; date: string; issuer?: string }>

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={copyLink} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
          <div className="relative">
            <Image src={user.photoURL || '/default-avatar.svg'} alt={user.name} width={120} height={120} unoptimized
              className="w-28 h-28 rounded-full object-cover ring-4 ring-gray-800" />
            {user.membershipStatus === 'active' && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center">
                <Award size={14} className="text-yellow-900" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/15 text-yellow-400 capitalize">{role}</span>
            </div>
            {user.usn && <p className="text-gray-400 text-sm mb-1">{user.usn}</p>}
            {user.branch && user.year && <p className="text-gray-500 text-sm">{user.branch} · Year {user.year}</p>}
            {user.college && <p className="text-gray-500 text-sm">{user.college}</p>}
            {user.bio && <p className="text-gray-300 mt-3 max-w-lg">{user.bio}</p>}
            <div className="flex justify-center md:justify-start gap-3 mt-4">
              {user.github && <a href={user.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"><Github size={18} /></a>}
              {user.linkedin && <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"><Linkedin size={18} /></a>}
              <a href={`mailto:${user.email}`} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"><ExternalLink size={18} /></a>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Events', value: events.length },
            { label: 'Certificates', value: certificates.length },
            { label: 'Member since', value: new Date(user.createdAt).getFullYear() },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-gray-900 border border-gray-800 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Event History */}
        {events.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar size={18} /> Event History</h2>
            <div className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                  {e.image && <Image src={e.image} alt={e.title} width={60} height={60} unoptimized className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{e.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {e.date && <span>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                      {e.type && <span className="px-1.5 py-0.5 rounded bg-gray-800 text-xs">{e.type}</span>}
                      {e.teamName && <span className="text-yellow-400/70 text-xs">Team: {e.teamName}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                    e.registrationStatus === 'registered' ? 'bg-green-500/15 text-green-400' :
                    e.registrationStatus === 'attended' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{e.registrationStatus}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Award size={18} /> Certificates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((cert, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <h3 className="font-medium">{cert.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    {cert.date && <span>{new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                    {cert.issuer && <span>· {cert.issuer}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {events.length === 0 && certificates.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>No events or certificates yet.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-800 mt-10">
          <p className="text-sm text-gray-500">CSI NMAMIT · Computer Society of India</p>
          <Link href="/" className="text-xs text-yellow-400 hover:underline mt-1 inline-block">csinmamit.in</Link>
        </div>
      </div>
    </div>
  )
}
