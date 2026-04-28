// components/SearchBar.tsx
import { useState } from "react"
import { color, radius, font, transition, spacing } from "~theme/tokens"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export default function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const isSearching = value.trim().length > 0

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
      <svg
        style={{
          position: "absolute",
          left: 14,
          width: 16,
          height: 16,
          color: color.textMuted,
          pointerEvents: "none",
        }}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="text"
        placeholder="Find a tab…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%",
          padding: `${spacing.sm + 2}px ${spacing.lg}px ${spacing.sm + 2}px 40px`,
          borderRadius: radius.md,
          border: `1px solid ${isFocused ? color.border : "transparent"}`,
          background: color.bgInput,
          fontSize: font.size.sm,
          outline: "none",
          color: color.textPrimary,
          transition: `border-color ${transition.fast}`,
          boxSizing: "border-box",
        }}
      />
      {isSearching && (
        <button
          onClick={onClear}
          style={{
            position: "absolute",
            right: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: color.textMuted,
            fontSize: font.size.sm,
            padding: `${spacing.xs}px`,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}