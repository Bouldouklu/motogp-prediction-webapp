'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  count?: number
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleSection({
  title,
  count,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-12">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 mb-6 group"
        aria-expanded={isOpen}
      >
        <h2 className="text-3xl font-display font-black italic uppercase flex items-center gap-2">
          <span className="w-1 h-8 bg-gray-600 skew-x-12 inline-block"></span>
          {title}
          {count !== undefined && count > 0 && (
            <span className="text-base font-sans font-semibold not-italic normal-case text-gray-500 ml-1">
              ({count})
            </span>
          )}
        </h2>
        <span
          className={`text-gray-500 group-hover:text-gray-300 transition-all duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && children}
    </div>
  )
}
