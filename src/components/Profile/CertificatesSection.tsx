'use client'

import { useMemo, useState } from 'react'
import { Award, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

type Cert = {
  title?: string
  date?: string
  issuer?: string
  imageUrl?: string
  eventName?: string
}

const CertificatesSection: React.FC = () => {
  const { user } = useAuth()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const certificates = useMemo(() => {
    const raw = (user as { certificates?: Cert[] } | null)?.certificates
    return Array.isArray(raw) ? raw : []
  }, [user])

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-5">
        <Award className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Certificates</h3>
        {certificates.length > 0 && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{certificates.length}</span>
        )}
      </div>

      {certificates.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          No certificates yet. Event certificates uploaded by CSI for your USN will show up here.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {certificates.map((cert, i) => (
            <button
              key={i}
              type="button"
              onClick={() => cert.imageUrl && setPreviewUrl(cert.imageUrl)}
              disabled={!cert.imageUrl}
              className="text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-3 hover:border-yellow-400/50 transition-colors disabled:cursor-default overflow-hidden"
            >
              {cert.imageUrl && (
                <div className="relative w-full aspect-[1.4] mb-2 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cert.imageUrl} alt={cert.title || 'Certificate'} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {cert.title || cert.eventName || 'Certificate'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {cert.date ? new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                {cert.issuer ? ` · ${cert.issuer}` : ''}
              </div>
              {cert.imageUrl && (
                <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-1.5">View</p>
              )}
            </button>
          ))}
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewUrl(null)}>
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-md bg-black/50 text-white hover:bg-black/70"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Certificate" className="w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificatesSection
