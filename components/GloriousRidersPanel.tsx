'use client'

import { useState } from 'react'
import type { Rider } from '@/types'

interface Props {
    raceId: string
    allRiders: Rider[]
    initialGloriousRiders: Rider[]
}

const EMPTY_SLOT = ''

export default function GloriousRidersPanel({ raceId, allRiders, initialGloriousRiders }: Props) {
    const padded = [...initialGloriousRiders.map(r => r.id), ...Array(7).fill(EMPTY_SLOT)].slice(0, 7)
    const [slots, setSlots] = useState<string[]>(padded)
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const sortedRiders = [...allRiders].sort((a, b) => a.name.localeCompare(b.name))

    const duplicates = new Set<string>()
    const seen = new Set<string>()
    for (const id of slots) {
        if (id && seen.has(id)) duplicates.add(id)
        if (id) seen.add(id)
    }

    const handleGenerate = async () => {
        setGenerating(true)
        setMessage(null)
        try {
            const res = await fetch('/api/admin/generate-glorious-7', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raceId }),
            })
            const data = await res.json()
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Generation failed' })
                return
            }
            const generated: { id: string }[] = data.riders
            setSlots(generated.map(r => r.id))
            setMessage({ type: 'success', text: 'Suggestion generated — review and save when ready.' })
        } catch {
            setMessage({ type: 'error', text: 'Network error during generation' })
        } finally {
            setGenerating(false)
        }
    }

    const handleSave = async () => {
        if (slots.some(s => !s)) {
            setMessage({ type: 'error', text: 'All 7 slots must be filled before saving.' })
            return
        }
        if (duplicates.size > 0) {
            setMessage({ type: 'error', text: 'Duplicate riders detected — each slot must have a unique rider.' })
            return
        }
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch('/api/admin/glorious-riders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raceId, riderIds: slots }),
            })
            const data = await res.json()
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Save failed' })
                return
            }
            setMessage({ type: 'success', text: 'Glorious 7 saved successfully.' })
        } catch {
            setMessage({ type: 'error', text: 'Network error while saving' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Glorious 7 Riders</h2>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {generating ? 'Generating…' : 'Generate suggestion'}
                </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Select 7 riders for the Glorious 7 mini-league. Use &quot;Generate suggestion&quot; to auto-fill based on current championship standings (excludes top 3 and bottom 3, max 2 per manufacturer).
            </p>

            <div className="space-y-3 mb-6">
                {slots.map((selectedId, i) => {
                    const isDuplicate = selectedId && duplicates.has(selectedId)
                    return (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-12 shrink-0">
                                Slot {i + 1}
                            </span>
                            <select
                                value={selectedId}
                                onChange={e => {
                                    const next = [...slots]
                                    next[i] = e.target.value
                                    setSlots(next)
                                    setMessage(null)
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isDuplicate
                                        ? 'border-red-400 dark:border-red-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                <option value="">— Select a rider —</option>
                                {sortedRiders.map(rider => (
                                    <option key={rider.id} value={rider.id}>
                                        #{rider.number} {rider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )
                })}
            </div>

            {duplicates.size > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Duplicate riders detected — each slot must have a unique rider.
                </p>
            )}

            {message && (
                <div
                    className={`mb-4 p-3 rounded-lg text-sm ${
                        message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={saving || slots.some(s => !s) || duplicates.size > 0}
                className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
            >
                {saving ? 'Saving…' : 'Save Glorious 7'}
            </button>
        </div>
    )
}
