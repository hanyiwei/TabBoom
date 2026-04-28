// theme/tokens.ts
export const color = {
      bgPage: "#faf9f7",          // warm off-white
      bgCard: "#ffffff",
      bgInput: "#f5f5f4",
      border: "#e5e7eb",
      borderLight: "#f5f5f5",
      textPrimary: "#1e1e1e",
      textSecondary: "#6b7280",
      textMuted: "#9ca3af",
      brand: "#da7756",           // terracotta
      brandLight: "#faeae5",
      danger: "#e05a4a",          // slightly warmer red for duplicates
      dangerBg: "#fef2f2",
      dangerBorder: "#f5c6c2",
      dotActive: "#10b981",
      dotIdle: "#f59e0b",
      dotDuplicate: "#e05a4a",
      // faviconBg: "#f5f5f4",
      white: "#ffffff",
} as const

export const spacing = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      xxl: 32,
} as const

export const radius = {
      sm: 6,
      md: 8,
      lg: 12,
      full: 999,
} as const

export const font = {
      family: {
            heading: `Georgia, "Times New Roman", serif`,
            body: `"Anthropic Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`,
      },
      size: {
            xs: 12,
            sm: 13,
            md: 14,
            lg: 16,
            xl: 20,
            xxl: 28,
            xxxl: 32,
      },
      weight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
      },
} as const

export const transition = {
      fast: "0.15s ease",
      normal: "0.25s ease",
} as const

export const breakpoints = {
      wide: 960,
      medium: 720,
} as const