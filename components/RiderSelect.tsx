'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Rider } from '@/types'

interface RiderSelectProps {
  label: string
  riders: Rider[]
  value: string
  onChange: (value: string) => void
  excludeIds?: string[]
  required?: boolean
}

export default function RiderSelect({
  label,
  riders,
  value,
  onChange,
  excludeIds = [],
  required = true,
}: RiderSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // format helper
  const getDisplayRider = (rider: Rider) => {
    const nameParts = rider.name.trim().split(' ')
    const lastName = nameParts.length > 1 ? nameParts.pop() : ''
    const firstName = nameParts.join(' ')
    const displayName = lastName ? `${lastName} ${firstName}` : rider.name
    return {
      displayName,
      fullText: `#${rider.number} ${displayName}`,
    }
  }

  // Filter and sort riders
  const availableRiders = useMemo(() => {
    // First, filter out excluded riders (keeping the currently selected one if any)
    let filtered = riders.filter(
      (rider) => !excludeIds.includes(rider.id) || rider.id === value
    )

    // Sort alphabetically by last name (same logic as before)
    filtered.sort((a, b) => {
      const getLastName = (name: string) => {
        const parts = name.trim().split(' ')
        return parts.length > 1 ? parts[parts.length - 1] : parts[0]
      }
      return getLastName(a.name)
        .toLowerCase()
        .localeCompare(getLastName(b.name).toLowerCase())
    })

    // Then filter by search query if open
    if (searchQuery.trim()) {
      const normalize = (str: string) =>
        str
          .normalize('NFD') // Decompose combined characters (e.g. 'è' -> 'e' + '̀')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
          .toLowerCase()

      const query = normalize(searchQuery)

      filtered = filtered.filter((rider) => {
        const { displayName } = getDisplayRider(rider)
        return (
          normalize(displayName).includes(query) ||
          rider.number.toString().includes(query)
        )
      })
    }

    return filtered
  }, [riders, excludeIds, value, searchQuery])

  // Sync selected value to input text when not open or when value changes externally
  useEffect(() => {
    const selectedRider = riders.find((r) => r.id === value)
    if (selectedRider) {
      if (!isOpen) {
        setSearchQuery(getDisplayRider(selectedRider).displayName)
      }
    } else {
      if (!isOpen) {
        setSearchQuery('')
      }
    }
  }, [value, riders, isOpen])

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        // Reset query to selected value on close
        const selectedRider = riders.find((r) => r.id === value)
        if (selectedRider) {
          setSearchQuery(getDisplayRider(selectedRider).displayName)
        } else {
          setSearchQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value, riders])

  const handleSelect = (rider: Rider) => {
    onChange(rider.id)
    setSearchQuery(getDisplayRider(rider).displayName)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < availableRiders.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && availableRiders[highlightedIndex]) {
        handleSelect(availableRiders[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative group" ref={containerRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-motogp-red mb-1 font-display italic">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => {
            setIsOpen(true)
            // Optional: clear query on focus to show all?
            // Or keep it to filter? Let's keep existing text but select all so they can overwrite easily
            // e.target.select()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Select a rider..."
          className="w-full px-4 py-3 bg-track-gray border-l-4 border-gray-700 text-white font-bold uppercase focus:outline-none focus:border-motogp-red focus:bg-gray-900 transition-all rounded-r placeholder-gray-600"
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg
            className={`fill-current h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''
              }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded shadow-xl max-h-60 overflow-y-auto">
            {availableRiders.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 italic">
                No riders found
              </div>
            ) : (
              <ul>
                {availableRiders.map((rider, index) => {
                  const { displayName, fullText } = getDisplayRider(rider)
                  const isSelected = rider.id === value
                  const isHighlighted = index === highlightedIndex

                  return (
                    <li
                      key={rider.id}
                      onClick={() => handleSelect(rider)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-4 py-2 cursor-pointer transition-colors flex items-center justify-between ${isHighlighted
                        ? 'bg-motogp-red text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                        } ${isSelected ? 'bg-gray-800 border-l-2 border-motogp-red' : ''}`}
                    >
                      <span className="font-bold uppercase">{fullText}</span>
                      {isSelected && (
                        <span className="text-xs font-black italic">SELECTED</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
