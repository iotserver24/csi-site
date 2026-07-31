'use client'

import { useMemo, useState } from 'react'
import { Award, Download, ExternalLink, Loader, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

type Cert = {
  title?: string
  date?: string
  issuer?: string
  imageUrl?: string
  eventName?: string
  objectKey?: string
}

function safeFileBase(cert: Cert, index: number): string {
  const raw = (cert.title || cert.eventName || `certificate-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return raw || `certificate-${index + 1}`
}

function extFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname
    const m = path.match(/\.([a-zA-Z0-9]{2,5})$/)
    if (m) return m[1].toLowerCase()
  } catch { /* ignore */ }
  return 'png'
}

async function downloadCertificate(url: string, filename: string): Promise<void> {
  // Prefer blob download (works when CDN allows CORS). Fall back to new tab.
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
    toast.success('Download started')
  } catch {
    // Cross-origin without CORS: open file so user can save manually
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.message('Opened certificate — use Save / Download in the browser if needed')
  }
}

const CertificatesSection: React.FC = () => {
  const { user } = useAuth()
  const [preview, setPreview] = useState<{ url: string; title: string; filename: string } | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const certificates = useMemo(() => {
    const raw = (user as { certificates?: Cert[] } | null)?.certificates
    return Array.isArray(raw) ? raw : []
  }, [user])

  const handleDownload = async (cert: Cert, index: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!cert.imageUrl) {
      toast.error('No file available for this certificate')
      return
    }
    const filename = `${safeFileBase(cert, index)}.${extFromUrl(cert.imageUrl)}`
    setDownloading(cert.imageUrl)
    try {
      await downloadCertificate(cert.imageUrl, filename)
    } finally {
      setDownloading(null)
    }
  }

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
          {certificates.map((cert, i) => {
            const title = cert.title || cert.eventName || 'Certificate'
            const busy = downloading === cert.imageUrl
            return (
              <div
                key={`${cert.objectKey || cert.imageUrl || title}-${i}`}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-3 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!cert.imageUrl) return
                    setPreview({
                      url: cert.imageUrl,
                      title,
                      filename: `${safeFileBase(cert, i)}.${extFromUrl(cert.imageUrl)}`,
                    })
                  }}
                  disabled={!cert.imageUrl}
                  className="w-full text-left disabled:cursor-default"
                >
                  {cert.imageUrl && (
                    <div className="relative w-full aspect-[1.4] mb-2 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cert.imageUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {cert.date
                      ? new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : ''}
                    {cert.issuer ? ` · ${cert.issuer}` : ''}
                  </div>
                </button>

                {cert.imageUrl && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          url: cert.imageUrl!,
                          title,
                          filename: `${safeFileBase(cert, i)}.${extFromUrl(cert.imageUrl!)}`,
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={e => void handleDownload(cert, i, e)}
                      disabled={busy}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition disabled:opacity-60"
                    >
                      {busy ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Download
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate px-1">{preview.title}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => void downloadCertificate(preview.url, preview.filename)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={preview.title} className="w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificatesSection
