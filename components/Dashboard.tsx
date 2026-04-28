// components/Dashboard.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import tabBoomLogo from "data-base64:~assets/TabBoom_logogroup.png"
import { useTabs } from "~hooks/useTabs"
import type { TabGroups, TabInfo } from "~hooks/useTabs"
import { countAllDuplicates } from "~utils/duplicates"
import { color, spacing, radius, font, transition } from "~theme/tokens"
import SearchBar from "./SearchBar"
import DomainCard from "./DomainCard"

export default function Dashboard() {
      const { groups, allTabs } = useTabs()
      const [searchQuery, setSearchQuery] = useState("")

      // 过滤并生成最终显示的分组
      const filteredGroups = useMemo(() => {
            const result: TabGroups = new Map()
            const query = searchQuery.trim().toLowerCase()

            for (const [domain, tabs] of groups) {
                  let filtered = tabs

                  if (query) {
                        filtered = tabs.filter(
                              (tab) =>
                                    tab.title.toLowerCase().includes(query) ||
                                    tab.url.toLowerCase().includes(query)
                        )
                  }

                  if (filtered.length > 0) result.set(domain, filtered)
            }
            return result
      }, [groups, searchQuery])

      // 稳定排序：只在有域名 tab 数量增加时重排，关 tab 不改变顺序
      const [stableOrder, setStableOrder] = useState<string[]>([])
      const prevCountsRef = useRef<Map<string, number>>(new Map())
      const initializedRef = useRef(false)

      useEffect(() => {
            const currentCounts = new Map(
                  Array.from(groups.entries()).map(([d, tabs]) => [d, tabs.length])
            )
            const hasIncrease = Array.from(currentCounts.entries()).some(
                  ([d, count]) => count > (prevCountsRef.current.get(d) ?? 0)
            )
            prevCountsRef.current = currentCounts

            if (!initializedRef.current || hasIncrease) {
                  initializedRef.current = true
                  setStableOrder(
                        Array.from(groups.entries())
                              .sort((a, b) => b[1].length - a[1].length)
                              .map(([d]) => d)
                  )
            }
      }, [groups])

      const sortedDomains = useMemo(() => {
            const currentSet = new Set(filteredGroups.keys())
            // 新出现但不在 stableOrder 里的域名（罕见，保底）
            const extra = Array.from(filteredGroups.keys())
                  .filter(d => !stableOrder.includes(d))
                  .sort((a, b) => (filteredGroups.get(b)?.length ?? 0) - (filteredGroups.get(a)?.length ?? 0))
            return [...stableOrder.filter(d => currentSet.has(d)), ...extra]
                  .map(d => [d, filteredGroups.get(d)!] as [string, TabInfo[]])
      }, [filteredGroups, stableOrder])

      const isSearching = searchQuery.trim().length > 0
      const totalDuplicates = isSearching ? 0 : countAllDuplicates(groups)
      const totalTabs = sortedDomains.reduce((acc, [, tabs]) => acc + tabs.length, 0)

      // 问候语
      const greeting = useMemo(() => {
            const hour = new Date().getHours()
            if (hour < 12) return "Good Morning"
            if (hour < 18) return "Good  Afternoon"
            return "Good Evening"
      }, [])

      // 日期简写
      const dateString = useMemo(() => {
            const d = new Date()
            return d.toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
            })
      }, [])

      const handleCloseTab = useCallback((tabId: number) => {
            chrome.tabs.remove(tabId)
      }, [])

      const duplicatesLabelRef = useRef<HTMLSpanElement>(null)
      const contentRef = useRef<HTMLDivElement>(null)

      const triggerShake = useCallback(() => {
            contentRef.current?.animate(
                  [
                        { transform: "translate(0, 0)" },
                        { transform: "translate(-10px, -5px)" },
                        { transform: "translate(9px, 4px)" },
                        { transform: "translate(-7px, -3px)" },
                        { transform: "translate(5px, 2px)" },
                        { transform: "translate(-3px, -1px)" },
                        { transform: "translate(1px, 0px)" },
                        { transform: "translate(0, 0)" },
                  ],
                  { duration: 480, easing: "ease-out" }
            )
      }, [])

      const handleCloseAllDuplicates = useCallback(async () => {
            const [activeTab] = await new Promise<chrome.tabs.Tab[]>(resolve =>
                  chrome.tabs.query({ active: true, currentWindow: true }, resolve)
            )
            const currentId  = activeTab?.id  ?? null
            const currentUrl = activeTab?.url ?? null

            const allIds: number[] = []
            for (const [, tabs] of groups) {
                  for (const tab of tabs) {
                        if (!tab.duplicateIds) continue
                        const ids = tab.duplicateIds
                        if (currentId && ids.includes(currentId)) {
                              // 当前 tab 在这组里 → 保留当前，关其余
                              allIds.push(...ids.filter(id => id !== currentId))
                        } else if (currentUrl && tab.url === currentUrl) {
                              // 当前 tab 与这组 URL 相同但已被过滤掉（如 TabBoom 自身）→ 关掉组内全部
                              allIds.push(...ids)
                        } else {
                              allIds.push(...ids.slice(1))
                        }
                  }
            }
            if (allIds.length === 0) return

            // 炸弹飞向 "N duplicates" 文字
            const targetEl = duplicatesLabelRef.current
            if (targetEl) {
                  const r = targetEl.getBoundingClientRect()
                  const expX = r.left + r.width / 2
                  const expY = r.top + r.height / 2

                  const bomb = document.createElement("div")
                  bomb.textContent = "💣"
                  Object.assign(bomb.style, {
                        position: "fixed",
                        left: `${expX + 60}px`,
                        top: `${expY - 16}px`,
                        fontSize: "28px",
                        lineHeight: "1",
                        zIndex: "9999999",
                        pointerEvents: "none",
                  })
                  document.body.appendChild(bomb)

                  const dx = expX - (expX + 60 + 14)
                  const dy = expY - (expY - 16 + 14)
                  bomb.animate(
                        [
                              { transform: "translate(0,0) rotate(0deg) scale(1)", offset: 0 },
                              { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 40}px) rotate(-42deg) scale(1.4)`, offset: 0.45 },
                              { transform: `translate(${dx}px,${dy}px) rotate(-8deg) scale(1.4)`, offset: 1 },
                        ],
                        { duration: 380, easing: "cubic-bezier(0.2,0,0.8,1)", fill: "forwards" }
                  ).onfinish = () => {
                        bomb.remove()

                        // 屏幕抖动（衰减震荡，模拟冲击波）
                        triggerShake()

                        // 爆炸闪光
                        const flash = document.createElement("div")
                        Object.assign(flash.style, {
                              position: "fixed",
                              left: `${expX}px`, top: `${expY}px`,
                              width: "80px", height: "80px", borderRadius: "50%",
                              background: "rgba(255,255,255,1)",
                              boxShadow: "0 0 40px rgba(255,240,180,1), 0 0 80px rgba(255,200,80,0.8)",
                              transform: "translate(-50%,-50%)",
                              zIndex: "9999999", pointerEvents: "none",
                        })
                        document.body.appendChild(flash)
                        flash.animate(
                              [{ opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
                               { opacity: 0, transform: "translate(-50%,-50%) scale(4)" }],
                              { duration: 400, easing: "ease-out", fill: "forwards" }
                        ).onfinish = () => flash.remove()

                        // 火焰粒子
                        const fireColors = ["#ff4500", "#ff6b00", "#ff8c00", "#ffa500", "#ffcc00"]
                        const container = document.createElement("div")
                        Object.assign(container.style, {
                              position: "fixed", left: "0", top: "0",
                              width: "0", height: "0",
                              overflow: "visible", pointerEvents: "none", zIndex: "9999999",
                        })
                        document.body.appendChild(container)
                        for (let i = 0; i < 14; i++) {
                              const angle = (i * (360 / 14)) * (Math.PI / 180)
                              const dist  = 40 + Math.random() * 55
                              const dx2   = Math.cos(angle) * dist
                              const dy2   = Math.sin(angle) * dist
                              const size  = 10 + Math.random() * 8
                              const p     = document.createElement("div")
                              Object.assign(p.style, {
                                    position: "fixed", left: `${expX}px`, top: `${expY}px`,
                                    width: `${size}px`, height: `${size}px`, borderRadius: "50%",
                                    background: fireColors[i % fireColors.length],
                                    boxShadow: `0 0 8px ${fireColors[(i + 2) % fireColors.length]}`,
                                    transform: "translate(-50%,-50%)",
                              })
                              container.appendChild(p)
                              p.animate(
                                    [{ opacity: 1,  transform: "translate(-50%,-50%) scale(2)" },
                                     { opacity: 0,  transform: `translate(calc(-50% + ${dx2}px),calc(-50% + ${dy2}px)) scale(0.2)` }],
                                    { duration: 600, easing: "ease-out", fill: "forwards" }
                              ).onfinish = () => p.remove()
                        }
                        setTimeout(() => container.remove(), 700)

                        // "N duplicates" 文字淡出
                        const label = duplicatesLabelRef.current
                        if (label) {
                              label.animate(
                                    [
                                          { opacity: 1, transform: "scale(1)",   filter: "blur(0px)" },
                                          { opacity: 0, transform: "scale(1.6)", filter: "blur(4px)" },
                                    ],
                                    { duration: 320, easing: "ease-out", fill: "forwards" }
                              )
                        }

                        // 等文字淡完再关 tab，React re-render 时已不可见
                        setTimeout(() => chrome.tabs.remove(allIds), 350)
                  }
            } else {
                  chrome.tabs.remove(allIds)
            }
      }, [groups])

      return (
            <div
                  style={{
                        background: color.bgPage,
                        minHeight: "100vh",
                        fontFamily: font.family.body,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                  }}
            >
                  {/* 内容容器 */}
                  <div
                        ref={contentRef}
                        style={{
                              width: "100%",
                              maxWidth: 960,
                              margin: "0 auto",
                              padding: `${spacing.xxl}px ${spacing.lg}px ${spacing.xxl}px`,
                              display: "flex",
                              flexDirection: "column",
                              flex: 1,
                        }}
                  >
                        {/* 顶栏：左侧 Logo，右侧统计+关闭重复按钮 */}
                        <div
                              style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: spacing.xl,
                                    width: "100%",
                              }}
                        >
                              <img
                                    src={tabBoomLogo}
                                    alt="TabBoom"
                                    style={{ height: 48}}
                              />
                              {!isSearching && (
                                    <div
                                          style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: spacing.sm,
                                                fontSize: font.size.sm,
                                                color: color.textSecondary,
                                                flexWrap: "wrap",
                                                justifyContent: "flex-end",
                                          }}
                                    >
                                          <span style={{
                                                marginRight: `${spacing.sm}px`
                                          }}>
                                                {allTabs.length} tabs
                                                {totalDuplicates > 0 && (
                                                      <span ref={duplicatesLabelRef} style={{ color: color.danger, marginLeft: spacing.xs }}>
                                                            {" "}
                                                            · {totalDuplicates} duplicates
                                                      </span>
                                                )}

                                          </span>
                                          {totalDuplicates > 0 && (
                                                <button
                                                      onClick={handleCloseAllDuplicates}
                                                      style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: color.danger,
                                                            cursor: "pointer",
                                                            fontWeight: font.weight.semibold,
                                                            fontSize: font.size.sm,
                                                            padding: `${spacing.xs}px ${spacing.sm}px`,
                                                            borderRadius: radius.sm,
                                                            textDecoration: "underline",
                                                            transition: `color ${transition.fast}`,
                                                      }}
                                                >
                                                      Close Duplicates
                                                </button>
                                          )}
                                    </div>
                              )}
                        </div>

                        {/* 搜索栏 */}
                        <div style={{ width: "100%", marginBottom: spacing.lg }}>
                              <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    onClear={() => setSearchQuery("")}
                              />
                        </div>

                        {/* 域名卡片网格 */}
                        <div
                              style={{
                                    width: "100%",
                                    display: "grid",
                                    gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`,
                                    gap: spacing.lg,
                                    justifyContent: "flex-start",
                              }}
                        >
                              {sortedDomains.map(([domain, tabs]) => (
                                    <DomainCard
                                          key={domain}
                                          domain={domain}
                                          tabs={tabs}
                                          onCloseTab={handleCloseTab}
                                          onShake={triggerShake}
                                    />
                              ))}
                        </div>

                        {/* 空状态 */}
                        {totalTabs === 0 && (
                              <p
                                    style={{
                                          color: color.textMuted,
                                          textAlign: "left",
                                          marginTop: spacing.xxl,
                                          fontSize: font.size.lg,
                                          width: "100%",
                                    }}
                              >
                                    {isSearching ? "No tabs found" : "No tabs open"}
                              </p>
                        )}


                        {/* 分割线 */}
                        <hr
                              style={{
                                    width: "100%",
                                    border: "none",
                                    borderTop: `1px solid ${color.border}`,
                                    marginTop: spacing.xxl * 4,
                              }}
                        />


                        {/* footer */}
                        <footer
                              style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-end",
                                    color: color.textMuted,
                                    fontSize: font.size.sm,
                                    letterSpacing: "0.03em",
                                    userSelect: "none",
                                    marginTop: spacing.xxl,
                              }}
                        >
                              <div>
                                    {greeting} &nbsp; · &nbsp; {dateString}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                    By{" "}
                                    <a
                                          href="https://github.com/hanyiwei"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                                color: "inherit",
                                                textDecoration: "none",
                                                cursor: "pointer",
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                                    >
                                          大花
                                    </a>{" "}
                                    & VibeCoding
                              </div>
                        </footer>
                  </div>
            </div>
      )
}