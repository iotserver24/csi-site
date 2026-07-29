'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEventHandler } from 'react'

/** Soft desktop pointer spotlight. Disabled on touch / reduced-motion. */
export function usePointerGlow(enabled = true) {
  const hostRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef(0)
  const posRef = useRef({ x: 50, y: 40 })
  const [style, setStyle] = useState<CSSProperties>({})
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setActive(false)
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    const sync = () => setActive(!reduce.matches && fine.matches)
    sync()
    reduce.addEventListener('change', sync)
    fine.addEventListener('change', sync)
    return () => {
      reduce.removeEventListener('change', sync)
      fine.removeEventListener('change', sync)
    }
  }, [enabled])

  const onPointerMove: PointerEventHandler<HTMLElement> = useCallback(
    e => {
      if (!active) return
      const el = hostRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      posRef.current = { x, y }
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        const { x: px, y: py } = posRef.current
        setStyle({
          background: `radial-gradient(600px circle at ${px}% ${py}%, rgba(59,130,246,0.14), transparent 45%)`,
        })
      })
    },
    [active]
  )

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  return { hostRef, onPointerMove, glowStyle: active ? style : undefined, glowActive: active }
}
