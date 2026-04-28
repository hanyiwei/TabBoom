// components/DomainCard.tsx
import { useState, useCallback, useRef, useEffect, useMemo } from "react"

if (typeof document !== 'undefined' && !document.querySelector('#domain-card-styles')) {
  const el = document.createElement('style')
  el.id = 'domain-card-styles'
  el.textContent = `
@keyframes cardShake {
  0%, 100% { transform: translateX(0); }
  20%  { transform: translateX(-3px); }
  40%  { transform: translateX(3px); }
  60%  { transform: translateX(-2px); }
  80%  { transform: translateX(2px); }
}`
  document.head.appendChild(el)
}
import type { TabInfo } from "~hooks/useTabs"
import TabItem, { type TabItemHandle } from "./TabItem"
import { color, spacing, radius, font, transition } from "~theme/tokens"

interface DomainCardProps {
      domain: string
      tabs: TabInfo[]
      onCloseTab: (tabId: number) => void
      onShake?: () => void
}

export default function DomainCard({
      domain,
      tabs,
      onCloseTab,
      onShake,
}: DomainCardProps) {
      const [expanded, setExpanded] = useState(false)
      const [moreHovered, setMoreHovered] = useState(false)
      const [longPressActive, setLongPressActive] = useState(false)
      const tabItemRefs = useRef<Map<number, TabItemHandle>>(new Map())
      const lpTimerRef  = useRef<ReturnType<typeof setTimeout>>()

      const hasDuplicates = tabs.some((t) => t.isDuplicate)
      const defaultShowCount = 10

      const [stableTabOrder, setStableTabOrder] = useState<string[]>([])
      const stableInitRef = useRef(false)
      const prevUrlsRef   = useRef(new Set<string>())

      useEffect(() => {
            const currentUrls = new Set(tabs.map(t => t.url || String(t.id)))
            const hasNew = Array.from(currentUrls).some(u => !prevUrlsRef.current.has(u))
            prevUrlsRef.current = currentUrls
            if (!stableInitRef.current || hasNew) {
                  stableInitRef.current = true
                  setStableTabOrder(
                        [...tabs]
                              .sort((a, b) => (b.isDuplicate ? 1 : 0) - (a.isDuplicate ? 1 : 0))
                              .map(t => t.url || String(t.id))
                  )
            }
      }, [tabs])

      const sortedTabs = useMemo(() => {
            const urlToTab = new Map(tabs.map(t => [t.url || String(t.id), t]))
            const ordered  = stableTabOrder.filter(u => urlToTab.has(u)).map(u => urlToTab.get(u)!)
            const extra    = tabs.filter(t => !stableTabOrder.includes(t.url || String(t.id)))
            return [...ordered, ...extra]
      }, [tabs, stableTabOrder])

      const displayTabs = expanded ? sortedTabs : sortedTabs.slice(0, defaultShowCount)
      const hiddenCount = tabs.length - defaultShowCount

      const handleShowAll = useCallback(() => setExpanded(true), [])

      const realCount = tabs.reduce((sum, t) => sum + (t.duplicateCount || 1), 0)

      const clearLpTimers = useCallback(() => {
            clearTimeout(lpTimerRef.current)
      }, [])

      useEffect(() => () => clearLpTimers(), [clearLpTimers])

      // Bomb all visible items + close every tab in this domain
      const handleDomainBomb = useCallback(() => {
            clearLpTimers()
            setLongPressActive(false)
            onShake?.()

            displayTabs.forEach((tab, i) => {
                  setTimeout(() => tabItemRefs.current.get(tab.id)?.triggerBombVisual(), i * 80)
            })

            const allIds = tabs.flatMap(t =>
                  t.duplicateIds && t.duplicateIds.length > 0 ? t.duplicateIds : [t.id]
            )
            const delay = Math.max(0, displayTabs.length - 1) * 80 + 500
            setTimeout(() => {
                  if (allIds.length > 0) chrome.tabs.remove(allIds)
            }, delay)
      }, [clearLpTimers, tabs, displayTabs, onShake])

      // Keep a stable ref so the 5s timer always calls the latest version
      const handleDomainBombRef = useRef(handleDomainBomb)
      useEffect(() => { handleDomainBombRef.current = handleDomainBomb }, [handleDomainBomb])

      const handleLongPressStart = useCallback(() => {
            clearLpTimers()
            setLongPressActive(true)
            lpTimerRef.current = setTimeout(() => handleDomainBombRef.current(), 3000)
      }, [clearLpTimers])

      const handleLongPressCancel = useCallback(() => {
            clearLpTimers()
            setLongPressActive(false)
      }, [clearLpTimers])

      const handleClearDuplicates = useCallback(async (e: React.MouseEvent) => {
            e.stopPropagation()

            const [activeTab] = await new Promise<chrome.tabs.Tab[]>(resolve =>
                  chrome.tabs.query({ active: true, currentWindow: true }, resolve)
            )
            const currentId  = activeTab?.id  ?? null
            const currentUrl = activeTab?.url ?? null

            const safeSlice = (ids: number[], groupUrl: string) => {
                  if (currentId && ids.includes(currentId)) {
                        return ids.filter(id => id !== currentId)
                  }
                  if (currentUrl && groupUrl === currentUrl) {
                        return ids
                  }
                  return ids.slice(1)
            }

            const visibleDuplicates = displayTabs.filter(t => t.isDuplicate)

            visibleDuplicates.forEach((tab, i) => {
                  setTimeout(() => tabItemRefs.current.get(tab.id)?.triggerBombVisual(), i * 80)
            })

            setTimeout(() => onShake?.(), 420)

            const idsToClose = visibleDuplicates.flatMap(t => safeSlice(t.duplicateIds ?? [], t.url))
            const delay = (visibleDuplicates.length - 1) * 80 + 450
            if (idsToClose.length > 0) setTimeout(() => chrome.tabs.remove(idsToClose), delay)

            const hiddenIds = sortedTabs
                  .slice(defaultShowCount)
                  .filter(t => t.isDuplicate)
                  .flatMap(t => safeSlice(t.duplicateIds ?? [], t.url))
            if (hiddenIds.length > 0) setTimeout(() => chrome.tabs.remove(hiddenIds), delay)
      }, [displayTabs, sortedTabs, onShake])


      return (
            <div
                  style={{
                        background: color.bgCard,
                        border: `1px solid ${color.border}`,
                        borderRadius: radius.lg,
                        overflow: "hidden",
                        animation: longPressActive ? 'cardShake 0.45s ease-in-out infinite' : 'none',
                  }}
            >
                  {/* Header */}
                  <div
                        style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: `${spacing.md}px ${spacing.lg}px`,
                              background: "#fafaf8",
                              borderBottom: `1px solid ${color.borderLight}`,
                              userSelect: "none",
                        }}
                  >
                        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                              <span
                                    style={{
                                          fontWeight: font.weight.semibold,
                                          fontSize: font.size.md,
                                          color: color.textPrimary,
                                          maxWidth: 240,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                    }}
                              >
                                    {domain}
                              </span>
                              <span
                                    style={{
                                          fontSize: font.size.xs,
                                          color: color.textMuted,
                                          padding: "3px 1px 0px 0px",
                                          lineHeight: 1.2,
                                    }}
                              >
                                    {realCount}
                              </span>
                        </div>

                        {hasDuplicates && (
                              <button
                                    style={{
                                          background: "none",
                                          border: "none",
                                          color: color.danger,
                                          fontSize: font.size.xs,
                                          cursor: "pointer",
                                          fontWeight: font.weight.medium,
                                          borderRadius: radius.sm,
                                          transition: `background ${transition.fast}`,
                                    }}
                                    onClick={handleClearDuplicates}
                              >
                                    Close Duplicates
                              </button>
                        )}
                  </div>

                  {/* Tab list */}
                  {displayTabs.map((tab) => (
                        <TabItem
                              key={tab.url || tab.id}
                              ref={(el) => {
                                    if (el) tabItemRefs.current.set(tab.id, el)
                                    else tabItemRefs.current.delete(tab.id)
                              }}
                              tab={tab}
                              onClose={onCloseTab}
                              onShake={onShake}
                              forceShowClose={longPressActive}
                              isCharging={longPressActive}
                              onLongPressStart={handleLongPressStart}
                              onLongPressCancel={handleLongPressCancel}
                        />
                  ))}

                  {/* Show all */}
                  {!expanded && hiddenCount > 0 && (
                        <div
                              style={{
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: color.brand,
                                    fontSize: font.size.sm,
                                    fontWeight: font.weight.medium,
                                    cursor: "pointer",
                                    background: moreHovered ? "#faf9f7" : "transparent",
                                    transition: `background ${transition.fast}`,
                              }}
                              onClick={handleShowAll}
                              onMouseEnter={() => setMoreHovered(true)}
                              onMouseLeave={() => setMoreHovered(false)}
                        >
                              More +{hiddenCount}
                        </div>
                  )}
            </div>
      )
}
