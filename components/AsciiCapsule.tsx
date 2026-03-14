'use client'

import { useRef, useEffect, useState } from 'react'

const ASCII_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&*.:;\'"+=<>?/\\|[]{}'

const PHRASE = 'INJECTIVE EVM'
const COLS = 52
const ROWS = 22

/** Indices in the grid where the phrase "INJECTIVE EVM" is shown (center row, centered). */
const PHRASE_ROW = Math.floor(ROWS / 2)
const PHRASE_START_COL = Math.floor((COLS - PHRASE.length) / 2)
const PHRASE_INDICES = Array.from(
  { length: PHRASE.length },
  (_, k) => PHRASE_ROW * COLS + PHRASE_START_COL + k
)

const PHRASE_INDEX_SET = new Set(PHRASE_INDICES)

function getRandomChar() {
  return ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)]
}

/** Deterministic initial grid so server and client render the same HTML (avoids hydration error). */
function getInitialGrid(): string[] {
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    if (PHRASE_INDEX_SET.has(i)) {
      return PHRASE[PHRASE_INDICES.indexOf(i)]
    }
    return ASCII_CHARS[i % ASCII_CHARS.length]
  })
}

export function AsciiCapsule({ className = '', bgColor = 'var(--Heres-bg)' }: { className?: string, bgColor?: string }) {
  const [grid, setGrid] = useState<string[]>(getInitialGrid)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef(false)
  const revealTimeoutRef = useRef<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mobileQuery = window.matchMedia('(max-width: 768px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncQueries = () => {
      setIsMobile(mobileQuery.matches)
      setPrefersReducedMotion(motionQuery.matches)
    }

    syncQueries()
    mobileQuery.addEventListener('change', syncQueries)
    motionQuery.addEventListener('change', syncQueries)

    return () => {
      mobileQuery.removeEventListener('change', syncQueries)
      motionQuery.removeEventListener('change', syncQueries)
    }
  }, [])

  useEffect(() => {
    const node = wrapperRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '120px 0px', threshold: 0.05 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const tickInterval = prefersReducedMotion ? 180 : isMobile ? 140 : 95
    const updateRatio = prefersReducedMotion ? 0.04 : isMobile ? 0.07 : 0.11

    const tick = () => {
      setGrid((prev) => {
        const next = [...prev]
        const toUpdate = Math.floor(COLS * ROWS * updateRatio) || 1
        let updated = 0

        while (updated < toUpdate) {
          const idx = Math.floor(Math.random() * (COLS * ROWS))
          if (revealRef.current && PHRASE_INDEX_SET.has(idx)) continue
          next[idx] = getRandomChar()
          updated++
        }

        return next
      })
    }

    const timer = window.setInterval(tick, tickInterval)
    return () => window.clearInterval(timer)
  }, [isMobile, isVisible, prefersReducedMotion])

  useEffect(() => {
    if (!isVisible) return

    const revealDuration = prefersReducedMotion ? 2200 : isMobile ? 2000 : 1800
    const revealCadence = prefersReducedMotion ? 6500 : isMobile ? 5600 : 4500

    const reveal = () => {
      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current)
      }
      revealRef.current = true
      setGrid((prev) => {
        const next = [...prev]
        PHRASE_INDICES.forEach((idx, i) => {
          next[idx] = PHRASE[i]
        })
        return next
      })
      revealTimeoutRef.current = window.setTimeout(() => {
        revealRef.current = false
      }, revealDuration)
    }

    reveal()
    const timer = window.setInterval(() => {
      reveal()
    }, revealCadence)

    return () => {
      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current)
        revealTimeoutRef.current = null
      }
      window.clearInterval(timer)
    }
  }, [isMobile, isVisible, prefersReducedMotion])

  // ?뱀궗?댄듃 ?됱긽: ?쒖븞(accent) #22d3ee, 蹂대씪(purple) #a78bfa
  const colorAccent = 'rgba(34, 211, 238, 0.95)'
  const colorAccentDim = 'rgba(34, 211, 238, 0.6)'
  const colorPurple = 'rgba(167, 139, 250, 0.9)'
  const colorPurpleDim = 'rgba(167, 139, 250, 0.5)'

  return (
    <div
      ref={wrapperRef}
      className={`ascii-capsule-wrapper relative mx-auto flex items-center justify-center py-4 ${className}`}
      style={{ maxWidth: 480 }}
      aria-hidden
    >
      {/* 罹≪뒓 = clip留??곸슜, ?뚮몢由??놁쓬 ???뚮몢由ш퉴吏 ?꾨? ASCII濡?梨꾩썙吏?*/}
      <div
        className="ascii-capsule relative overflow-hidden shadow-[0_0_32px_rgba(34,211,238,0.15)]"
        style={{
          width: '100%',
          aspectRatio: '2.2 / 1',
          backgroundColor: bgColor,
          maxHeight: 220,
          borderRadius: 9999,
          clipPath: 'inset(0 round 9999px)',
          transform: 'rotate(-8deg)',
        }}
      >
        <div
          className="absolute inset-0 grid place-content-center gap-0 p-1 font-mono leading-none"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            letterSpacing: '0.02em',
            fontSize: 'clamp(6px, 1.2vw, 9px)',
          }}
        >
          {grid.map((char, i) => {
            const col = i % COLS
            const row = Math.floor(i / COLS)
            const isPhrase = PHRASE_INDEX_SET.has(i)
            const opacity = isPhrase ? 1 : 0.5 + (i % 6) * 0.1
            const usePurple = (row + col) % 3 === 0
            const color = isPhrase ? colorAccent : usePurple ? colorPurpleDim : colorAccentDim
            return (
              <span
                key={i}
                className="ascii-char text-center transition-opacity duration-150"
                style={{
                  opacity,
                  color,
                  textShadow: isPhrase ? '0 0 6px rgba(34,211,238,0.5)' : 'none',
                }}
              >
                {char}
              </span>
            )
          })}
        </div>
        {/* 以묒븰 ?댁쭩 ?대몢?????쒋? */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            background: 'linear-gradient(90deg, transparent 38%, rgba(3,7,18,0.5) 50%, transparent 62%)',
          }}
        />
      </div>
    </div>
  )
}
