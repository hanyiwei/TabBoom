// components/TabItem.tsx
import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import type { TabInfo } from "~hooks/useTabs"
import { color, spacing, font, transition } from "~theme/tokens"

const RING_R = 13
const RING_CIRCUM = parseFloat((2 * Math.PI * RING_R).toFixed(2))

const styleSheet = `
@keyframes bombExplode {
  0%   { opacity: 1; transform: scale(1.5); }
  50%  { opacity: 1; transform: scale(2.8); }
  100% { opacity: 0; transform: scale(4.5); }
}
@keyframes tabShake {
  0%, 100% { transform: translateX(0); }
  20%  { transform: translateX(-4px) rotate(-0.3deg); }
  40%  { transform: translateX(4px)  rotate(0.3deg); }
  60%  { transform: translateX(-3px); }
  80%  { transform: translateX(3px); }
}
@keyframes ringFill {
  from { stroke-dashoffset: ${RING_CIRCUM}; }
  to   { stroke-dashoffset: 0; }
}
`

if (typeof document !== 'undefined' && !document.querySelector('#tab-explode-styles')) {
  const el = document.createElement('style')
  el.id = 'tab-explode-styles'
  el.textContent = styleSheet
  document.head.appendChild(el)
}

export interface TabItemHandle {
  triggerBomb: () => void
  triggerBombVisual: () => void
}

interface TabItemProps {
  tab: TabInfo
  onClose: (tabId: number) => void
  onShake?: () => void
  forceShowClose?: boolean
  isCharging?: boolean
  onLongPressStart?: () => void
  onLongPressCancel?: () => void
}

const TabItem = forwardRef<TabItemHandle, TabItemProps>(function TabItem(
  { tab, onClose, onShake, forceShowClose, isCharging, onLongPressStart, onLongPressCancel },
  ref
) {
  const [hovered, setHovered] = useState(false)
  const [faviconFailed, setFaviconFailed] = useState(false)
  const isBrowserPage = tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://") || tab.url?.startsWith("about:")

  const [burst, setBurst] = useState(false)
  const [exploding, setExploding] = useState(false)
  const [visualMode, setVisualMode] = useState(false)
  const [explosionPos, setExplosionPos] = useState({ x: 0, y: 0 })
  const [displayCount, setDisplayCount] = useState(tab.duplicateCount ?? 1)
  const tabRef       = useRef<HTMLDivElement>(null)
  const wrapperRef   = useRef<HTMLDivElement>(null)
  const counterRef   = useRef<HTMLSpanElement>(null)
  const closeModeRef = useRef<'close' | 'visual'>('close')
  const prevCountRef = useRef(tab.duplicateCount ?? 1)
  const pressStartRef = useRef(0)
  const pressingRef   = useRef(false)

  // Count decrement slot-machine animation
  useEffect(() => {
    const next = tab.duplicateCount ?? 1
    const prev = prevCountRef.current
    prevCountRef.current = next
    if (next >= prev) { setDisplayCount(next); return }
    const el = counterRef.current
    if (!el) { setDisplayCount(next); return }
    const exitAnim = el.animate(
      [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-120%)', opacity: 0 }],
      { duration: 160, easing: 'ease-in', fill: 'forwards' }
    )
    exitAnim.onfinish = () => {
      exitAnim.cancel()
      setDisplayCount(next)
      el.animate(
        [{ transform: 'translateY(80%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 200, easing: 'ease-out' }
      )
    }
  }, [tab.duplicateCount])

  const handleClick = useCallback(() => {
    chrome.tabs.update(tab.id, { active: true })
    chrome.windows.update(tab.windowId, { focused: true })
  }, [tab.id, tab.windowId])

  const launchBomb = useCallback((mode: 'close' | 'visual') => {
    if (burst || exploding) return

    const r = tabRef.current?.getBoundingClientRect()
    if (!r) return

    const bombLeft = r.right - 5 - 32
    const bombTop  = r.top + (r.height - 32) / 2
    const expX = r.right - 141
    const expY = r.top + r.height / 2
    setExplosionPos({ x: expX, y: expY })
    closeModeRef.current = mode
    setVisualMode(mode === 'visual')
    setBurst(true)

    const bomb = document.createElement("div")
    bomb.textContent = "💣"
    Object.assign(bomb.style, {
      position:      "fixed",
      left:          `${bombLeft}px`,
      top:           `${bombTop}px`,
      fontSize:      "32px",
      lineHeight:    "1",
      zIndex:        "9999999",
      pointerEvents: "none",
    })
    document.body.appendChild(bomb)

    const dx = expX - (bombLeft + 16)
    const dy = expY - (bombTop  + 16)
    bomb.animate(
      [
        { transform: "translate(0,0) rotate(0deg) scale(1)",                                  offset: 0 },
        { transform: "translate(4px,3px) rotate(10deg) scale(0.88)",                          offset: 0.08 },
        { transform: `translate(${dx*0.45}px,${dy*0.45 - 52}px) rotate(-42deg) scale(1.5)`, offset: 0.45 },
        { transform: `translate(${dx}px,${dy}px) rotate(-8deg) scale(1.5)`,                  offset: 1 },
      ],
      { duration: 420, easing: "cubic-bezier(0.2,0,0.8,1)", fill: "forwards" }
    ).onfinish = () => {
      bomb.remove()
      onShake?.()
      setBurst(false)
      setExploding(true)
    }
  }, [burst, exploding, onShake])

  const startBombAnimation = useCallback(() => launchBomb('close'),  [launchBomb])
  const startBombVisual    = useCallback(() => launchBomb('visual'), [launchBomb])

  useImperativeHandle(ref, () => ({
    triggerBomb:       startBombAnimation,
    triggerBombVisual: startBombVisual,
  }), [startBombAnimation, startBombVisual])

  const handleCloseMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    pressStartRef.current = Date.now()
    pressingRef.current   = true
    onLongPressStart?.()
  }, [onLongPressStart])

  const handleCloseRelease = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!pressingRef.current) return
    pressingRef.current = false
    const elapsed = Date.now() - pressStartRef.current
    onLongPressCancel?.()
    // Treat as a click only if released quickly; longer holds are long-press attempts
    if (elapsed < 200) {
      if (tab.duplicateCount && tab.duplicateCount > 1) {
        launchBomb('visual')
        setTimeout(() => onClose(tab.id), 450)
      } else {
        launchBomb('close')
      }
    }
  }, [onLongPressCancel, tab.duplicateCount, tab.id, launchBomb, onClose])

  const handleCloseMouseLeave = useCallback(() => {
    if (!pressingRef.current) return
    pressingRef.current   = false
    pressStartRef.current = 0
    onLongPressCancel?.()
  }, [onLongPressCancel])

  useEffect(() => {
    if (!exploding) return
    if (closeModeRef.current === 'close') {
      const wrapper = wrapperRef.current
      if (wrapper) {
        const h = wrapper.offsetHeight
        wrapper.animate(
          [{ height: `${h}px` }, { height: "0px" }],
          { duration: 350, easing: "cubic-bezier(0.4,0,0.2,1)", fill: "forwards" }
        )
      }
      const closeTimer = setTimeout(() => onClose(tab.id), 350)
      const cleanTimer = setTimeout(() => setExploding(false), 420)
      return () => { clearTimeout(closeTimer); clearTimeout(cleanTimer) }
    } else {
      const cleanTimer = setTimeout(() => { setExploding(false); setVisualMode(false) }, 420)
      return () => clearTimeout(cleanTimer)
    }
  }, [exploding])

  const showClose = forceShowClose || hovered

  return (
    <div ref={wrapperRef} style={{ overflow: "hidden" }}>
      <div
        ref={tabRef}
        style={{
          display:    "flex",
          alignItems: "center",
          padding:    `${spacing.sm}px ${spacing.sm}px ${spacing.sm}px ${spacing.lg}px`,
          height:     48,
          overflow:   "hidden",
          borderBottom: `1px solid ${color.borderLight}`,
          background: hovered && !exploding ? "#faf9f7" : "transparent",
          transition: exploding
            ? (visualMode ? "none" : "opacity 0.2s ease-out")
            : `background ${transition.fast}`,
          opacity:    (exploding && !visualMode) ? 0 : 1,
          cursor:     "pointer",
          userSelect: "none",
          position:   "relative",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        {/* Favicon */}
        <div style={{ position: "relative", marginRight: spacing.md, flexShrink: 0, width: 24, height: 24 }}>
          {!faviconFailed && tab.favIconUrl ? (
            <img
              src={tab.favIconUrl}
              style={{ width: 24, height: 24, borderRadius: 4, background: color.white, flexShrink: 0 }}
              onError={() => setFaviconFailed(true)}
            />
          ) : isBrowserPage ? (
            <img
              src="https://www.google.com/favicon.ico"
              style={{ width: 24, height: 24, borderRadius: 4, background: color.bgPage, flexShrink: 0, display: "block" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
                setFaviconFailed(true)
              }}
            />
          ) : (
            <div style={{ width: 24, height: 24, borderRadius: 4, background: color.bgPage }} />
          )}
          {tab.isDuplicate && (
            <div style={{
              position: "absolute", top: -4, right: -4,
              width: 6, height: 6, borderRadius: "50%",
              background: "#fbbf24", border: "3px solid white",
            }} />
          )}
        </div>

        {/* Title */}
        <span style={{ flex: 1, display: "flex", alignItems: "center", overflow: "hidden", minWidth: 0 }}>
          <span style={{
            fontSize: font.size.sm, color: color.textPrimary,
            overflow: "hidden", flexShrink: 1,
            ...(hovered ? {
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              whiteSpace: "normal",
              lineHeight: "16px",
            } : {
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              lineHeight: "22px",
            }),
          }}>
            {tab.title || tab.url}
          </span>
          {(displayCount > 1 || (tab.duplicateCount && tab.duplicateCount > 1)) && (
            <span style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', flexShrink: 0, height: '1.4em' }}>
              <span ref={counterRef} style={{
                color: color.danger, marginLeft: 4,
                fontWeight: font.weight.medium, fontSize: font.size.sm,
                whiteSpace: "nowrap", display: 'inline-block',
              }}>
                {" "}(×{displayCount})
              </span>
            </span>
          )}
        </span>

        {/* Close button */}
        <button
          style={{
            background: "none", border: "none", fontSize: 15, cursor: "pointer",
            color: burst ? "transparent" : (showClose ? "#999" : "transparent"),
            padding: `0 ${spacing.xs}px`, marginLeft: spacing.sm,
            transition: `color ${transition.fast}`, lineHeight: 1,
            flexShrink: 0, width: "30px", height: "30px",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
          onMouseDown={handleCloseMouseDown}
          onMouseUp={handleCloseRelease}
          onMouseLeave={handleCloseMouseLeave}
          onClick={(e) => e.stopPropagation()}
          title="Close tab"
        >
          {!burst && <span>✕</span>}
          {isCharging && (
            <svg
              width="30" height="30"
              style={{
                position: 'absolute', inset: 0,
                pointerEvents: 'none',
                transform: 'rotate(-90deg)',
              }}
            >
              <circle
                cx="15" cy="15" r={RING_R}
                fill="none"
                stroke={color.danger}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUM}
                strokeDashoffset={RING_CIRCUM}
                style={{ animation: 'ringFill 3s linear forwards' }}
              />
            </svg>
          )}
        </button>

        {/* Exploding bomb visual */}
        {exploding && (
          <div style={{
            position: "absolute", right: "125px", top: "50%",
            transform: "translateY(-50%)", fontSize: "32px",
            animation: "bombExplode 0.35s ease-out forwards",
            zIndex: 99999, pointerEvents: "none",
          }}>
            💣
          </div>
        )}

        {/* Particles */}
        {exploding && <ExplosionParticles position={explosionPos} />}
      </div>
    </div>
  )
})

function ExplosionParticles({ position }: { position: { x: number; y: number } }) {
  useEffect(() => {
    const { x: cx, y: cy } = position

    const container = document.createElement("div")
    Object.assign(container.style, {
      position: "fixed", left: "0", top: "0",
      width: "0", height: "0",
      overflow: "visible", pointerEvents: "none", zIndex: "9999999",
    })
    document.body.appendChild(container)

    const fireColors = ["#ff4500", "#ff6b00", "#ff8c00", "#ffa500", "#ffcc00"]

    const flash = document.createElement("div")
    Object.assign(flash.style, {
      position: "fixed", left: `${cx}px`, top: `${cy}px`,
      width: "100px", height: "100px", borderRadius: "50%",
      background: "rgba(255,255,255,1)",
      boxShadow: "0 0 60px rgba(255,240,180,1), 0 0 120px rgba(255,200,80,0.8)",
      transform: "translate(-50%,-50%)",
    })
    container.appendChild(flash)
    flash.animate(
      [{ opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
       { opacity: 0, transform: "translate(-50%,-50%) scale(5)" }],
      { duration: 500, easing: "ease-out", fill: "forwards" }
    ).onfinish = () => flash.remove()

    for (let i = 0; i < 16; i++) {
      const angle = (i * 22.5) * (Math.PI / 180)
      const dist  = 55 + Math.random() * 75
      const dx    = Math.cos(angle) * dist
      const dy    = Math.sin(angle) * dist
      const size  = 12 + Math.random() * 10
      const p     = document.createElement("div")
      Object.assign(p.style, {
        position: "fixed", left: `${cx}px`, top: `${cy}px`,
        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
        background:  fireColors[i % fireColors.length],
        boxShadow:   `0 0 12px ${fireColors[(i + 2) % fireColors.length]}`,
        transform:   "translate(-50%,-50%)",
      })
      container.appendChild(p)
      p.animate(
        [{ opacity: 1,  transform: "translate(-50%,-50%) scale(2.5)" },
         { opacity: 0,  transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0.3)` }],
        { duration: 700, easing: "ease-out", fill: "forwards" }
      ).onfinish = () => p.remove()
    }

    setTimeout(() => {
      const smokeColors = ["#666", "#888", "#aaa"]
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * (Math.PI / 180)
        const dx    = Math.cos(angle) * (35 + Math.random() * 45)
        const dy    = Math.sin(angle) * (35 + Math.random() * 45) - 50
        const size  = 20 + Math.random() * 14
        const s     = document.createElement("div")
        Object.assign(s.style, {
          position: "fixed", left: `${cx}px`, top: `${cy}px`,
          width: `${size}px`, height: `${size}px`, borderRadius: "50%",
          background: smokeColors[i % smokeColors.length],
          opacity: "0.7", transform: "translate(-50%,-50%)",
        })
        container.appendChild(s)
        s.animate(
          [{ opacity: 0.7, transform: "translate(-50%,-50%) scale(1)" },
           { opacity: 0,   transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(3.5)` }],
          { duration: 900, easing: "ease-out", fill: "forwards" }
        ).onfinish = () => s.remove()
      }
    }, 100)

    return () => container.remove()
  }, [position])

  return null
}

export default TabItem
