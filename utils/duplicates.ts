// utils/duplicates.ts
import type { TabInfo } from "~hooks/useTabs"

export function countAllDuplicates(groups: Map<string, TabInfo[]>): number {
      let count = 0
      for (const [, tabs] of groups) {
            for (const tab of tabs) {
                  if (tab.duplicateCount && tab.duplicateCount > 1) {
                        count += tab.duplicateCount - 1
                  }
            }
      }
      return count
}