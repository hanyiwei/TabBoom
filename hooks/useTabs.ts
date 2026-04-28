// hooks/useTabs.ts
import { useState, useEffect, useCallback, useRef } from "react"

export interface TabInfo {
      id: number
      title: string
      url: string
      favIconUrl?: string
      windowId: number
      isDuplicate: boolean
      duplicateCount?: number
      duplicateIds?: number[]
}

export type TabGroups = Map<string, TabInfo[]>

const BROWSER_PAGES_DOMAIN = "Browser pages"

function extractDomain(url: string): string {
      if (!url) return BROWSER_PAGES_DOMAIN
      if (
            url.startsWith("chrome://") ||
            url.startsWith("chrome-extension://") ||
            url.startsWith("about:") ||
            url.startsWith("edge://") ||
            url.startsWith("brave://")
      ) {
            return BROWSER_PAGES_DOMAIN
      }
      try {
            const { hostname } = new URL(url)
            const clean = hostname.replace(/^www\./, "")
            const parts = clean.split(".")
            if (parts.length <= 2) return clean
            const last = parts[parts.length - 1]
            const secondLast = parts[parts.length - 2]
            // 形如 .com.cn / .co.uk 等双后缀，保留最后三段
            if (last.length <= 3 && secondLast.length <= 3) return parts.slice(-3).join(".")
            return parts.slice(-2).join(".")
      } catch {
            return BROWSER_PAGES_DOMAIN
      }
}

function collapseDuplicates(tabs: TabInfo[]): TabInfo[] {
      const urlMap = new Map<string, TabInfo[]>()
      for (const tab of tabs) {
            const key = tab.url || ""
            const list = urlMap.get(key) || []
            list.push(tab)
            urlMap.set(key, list)
      }

      const collapsed: TabInfo[] = []
      for (const [, group] of urlMap) {
            if (group.length === 1) {
                  collapsed.push(group[0])
            } else {
                  const representative = { ...group[0] }
                  representative.isDuplicate = true
                  representative.duplicateCount = group.length
                  representative.duplicateIds = group.map(t => t.id)
                  collapsed.push(representative)
            }
      }
      return collapsed
}

function groupTabsByDomain(tabs: TabInfo[]): TabGroups {
      const groups: TabGroups = new Map()

      for (const tab of tabs) {
            const domain = extractDomain(tab.url)
            const existing = groups.get(domain) || []
            existing.push(tab)
            groups.set(domain, existing)
      }
      for (const [domain, tabList] of groups) {
            tabList.sort((a, b) => a.title.localeCompare(b.title))
            groups.set(domain, collapseDuplicates(tabList))
      }
      return groups
}

export function useTabs() {
      const [groups, setGroups] = useState<TabGroups>(new Map())
      const [allTabs, setAllTabs] = useState<TabInfo[]>([])
      const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

      const refreshTabs = useCallback(() => {
            chrome.tabs.getCurrent((currentTab) => {
                  const selfId = currentTab?.id
                  chrome.tabs.query({}, (tabs) => {
                        const simplified: TabInfo[] = tabs
                              .filter(t => t.id !== selfId)
                              .map((tab) => ({
                                    id: tab.id ?? -1,
                                    title: tab.title ?? "",
                                    url: tab.url ?? "",
                                    favIconUrl: tab.favIconUrl ?? "",
                                    windowId: tab.windowId,
                                    isDuplicate: false,
                              }))

                        setAllTabs(simplified)
                        setGroups(groupTabsByDomain(simplified))
                  })
            })
      }, [])

      const debouncedRefresh = useCallback(() => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(refreshTabs, 200)
      }, [refreshTabs])

      useEffect(() => {
            refreshTabs()

            chrome.tabs.onCreated.addListener(refreshTabs)
            chrome.tabs.onRemoved.addListener(refreshTabs)
            chrome.tabs.onUpdated.addListener(debouncedRefresh)

            return () => {
                  if (debounceRef.current) clearTimeout(debounceRef.current)
                  chrome.tabs.onCreated.removeListener(refreshTabs)
                  chrome.tabs.onRemoved.removeListener(refreshTabs)
                  chrome.tabs.onUpdated.removeListener(debouncedRefresh)
            }
      }, [refreshTabs, debouncedRefresh])

      return { groups, allTabs }
}
