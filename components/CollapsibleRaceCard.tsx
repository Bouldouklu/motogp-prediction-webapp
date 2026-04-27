'use client'

import { useState } from 'react'

interface CollapsibleRaceCardProps {
  header: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleRaceCard({
  header,
  children,
  defaultOpen = false,
}: CollapsibleRaceCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="group bg-track-gray/60 rounded-xl border border-gray-800 hover:border-motogp-red/50 transition-all duration-300 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-motogp-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative w-full text-left p-6"
        aria-expanded={isOpen}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">{header}</div>
          <span
            className={`text-gray-500 hover:text-gray-300 transition-all duration-200 shrink-0 mt-1 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            aria-hidden="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  )
}
