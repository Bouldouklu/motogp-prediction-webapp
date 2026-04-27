'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Rider } from '@/types'

interface RiderSelectProps {
  label: string
  riders: Rider[]
  value: string
  onChange: (value: string) => void
  excludeIds?: string[]  // kept for API compat but no longer used for filtering
  isDuplicate?: boolean
  required?: boolean
}

export default function RiderSelect({
  label,
  riders,
  value,
  onChange,
  isDuplicate = false,
  required = true,
}: RiderSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // format helper — DB stores names as "Firstname Surname(s)", e.g. "Fabio Di Giannantonio"
  const getDisplayRider = (rider: Rider) => {
    const parts = rider.name.trim().split(' ')
    const firstName = parts[0] ?? ''
    const surname = parts.slice(1).join(' ') || firstName
    // Plain string for the input field: "DI GIANNANTONIO Fabio"
    const displayName = surname
      ? `${surname.toUpperCase()} ${firstName}`
      : rider.name.toUpperCase()
    return {
      firstName,
      surname,
      displayName,
    }
  }

  // Filter and sort riders
  const availableRiders = useMemo(() => {
    // Show all riders — no exclusion, so user can always see the full list
    let filtered = [...riders]

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
  }, [riders, value, searchQuery])

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
      const selectedRider = riders.find((r) => r.id === value)
      if (selectedRider) setSearchQuery(getDisplayRider(selectedRider).displayName)
      else setSearchQuery('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative group" ref={containerRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-motogp-red mb-1 font-display italic">
        {label}
      </label>
      {isDuplicate && (
        <div className="mb-1 px-2 py-1 bg-amber-500/20 border border-amber-500/60 rounded text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          ⚠ Duplicate rider — check your podium
        </div>
      )}
      <div className={`relative ${isDuplicate ? 'ring-2 ring-amber-500/60 rounded-r' : ''}`}>
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
            setSearchQuery('')
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onClick={() => {
            setSearchQuery('')
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Select a rider..."
          className="w-full px-4 py-3 bg-track-gray border-l-4 border-gray-700 text-white font-bold uppercase focus:outline-none focus:border-motogp-red focus:bg-gray-900 transition-all rounded-r placeholder-gray-600 pr-16"
        />

        <div className="absolute inset-y-0 right-0 flex items-center gap-1 px-2">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setSearchQuery('')
                setIsOpen(false)
              }}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded"
              aria-label="Clear selection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <div className="pointer-events-none text-gray-400">
            <svg
              className={`fill-current h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
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
                  const { firstName, surname, displayName } = getDisplayRider(rider)
                  const isSelected = rider.id === value
                  const isHighlighted = index === highlightedIndex

                  return (
                    <li
                      key={rider.id}
                      onClick={() => handleSelect(rider)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${isHighlighted
                        ? 'bg-motogp-red text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                        } ${isSelected ? 'bg-gray-800 border-l-2 border-motogp-red' : ''}`}
                    >
                      <span className="truncate min-w-0 font-sans text-sm">
                        <span className="font-normal">{rider.number}_</span>
                        <span className="font-bold">{surname.toUpperCase()} {firstName}</span>
                      </span>
                      {isSelected && (
                        <span className="text-xs font-black italic shrink-0 ml-2">✓</span>
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
