'use client'

import Image from 'next/image'
import { useState } from 'react'

type Props = {
  src: string
  alt: string
  caption?: string
  /** file path shown in chrome */
  path?: string
  className?: string
  aspect?: string
  /** green phosphor CRT look */
  phosphor?: boolean
  priority?: boolean
  unoptimized?: boolean
  onClick?: () => void
}

/** Image framed like a terminal media viewer / sixel pane */
export function TermMedia({
  src,
  alt,
  caption,
  path,
  className = '',
  aspect = 'aspect-video',
  phosphor = true,
  priority,
  unoptimized,
  onClick,
}: Props) {
  const [err, setErr] = useState(false)
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group block w-full text-left overflow-hidden rounded border border-emerald-500/25 bg-[#0a0f0a] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.06)] ${
        onClick ? 'cursor-pointer hover:border-emerald-400/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400' : ''
      } ${className}`}
    >
      {/* Chrome */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 bg-[#0d140d] px-2 py-1 font-mono text-[10px] text-emerald-500/70">
        <span className="truncate">
          <span className="text-emerald-600/80">media://</span>
          {path || alt}
        </span>
        <span className="shrink-0 text-emerald-700/80">sixel · 16</span>
      </div>

      <div className={`relative ${aspect} bg-black overflow-hidden`}>
        {!err ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            unoptimized={unoptimized}
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setErr(true)}
            className={`object-cover transition duration-500 ${
              phosphor
                ? 'contrast-[1.05] saturate-[0.35] hue-rotate-[70deg] brightness-[0.92] group-hover:saturate-[0.55] group-hover:brightness-100'
                : 'group-hover:scale-[1.02]'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-emerald-700">
            [ image decode failed ]
          </div>
        )}

        {/* CRT scanlines + vignette */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.35) 2px, transparent 3px)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-emerald-500/10" />

        {caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pb-2 pt-6">
            <p className="font-mono text-[10px] text-emerald-300/90 truncate">{caption}</p>
          </div>
        )}
      </div>
    </Tag>
  )
}

/** Compact square thumbnail for grids */
export function TermThumb({
  src,
  label,
  path,
  onClick,
  unoptimized,
}: {
  src: string
  label: string
  path?: string
  onClick?: () => void
  unoptimized?: boolean
}) {
  return (
    <TermMedia
      src={src}
      alt={label}
      caption={label}
      path={path || label}
      aspect="aspect-square"
      unoptimized={unoptimized}
      onClick={onClick}
      className="text-left"
    />
  )
}
