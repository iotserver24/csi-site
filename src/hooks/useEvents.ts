import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api-client'
import { mockEvents } from '../data/eventsData'
import { filterEvents } from '../utils/eventUtils'
import type { Event, MockEvent } from '../types'

export const useEvents = (initialYear: string = '2024') => {
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get('/api/events')
      .then(({ events: rows }) => {
        if (cancelled) return
        setAllEvents(Array.isArray(rows) ? (rows as Event[]) : [])
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setAllEvents([])
        setError(err instanceof Error ? err.message : 'Failed to load events')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const events = useMemo(() => {
    const year = Number(selectedYear)
    const fromApi = allEvents.filter(
      e => Number(e.year || String(e.date || '').slice(0, 4)) === year
    )
    if (fromApi.length) return fromApi
    // Dev fallback only when API empty for that year
    return (mockEvents[selectedYear as keyof typeof mockEvents] || []) as (Event | MockEvent)[]
  }, [allEvents, selectedYear])

  const filteredEvents = useMemo(
    () =>
      filterEvents(
        events as { title: string; description?: string | null; type?: string | null }[],
        searchTerm,
        selectedType
      ) as (Event | MockEvent)[],
    [events, searchTerm, selectedType]
  )

  return {
    events,
    filteredEvents,
    loading,
    error,
    selectedYear,
    setSelectedYear,
    selectedType,
    setSelectedType,
    searchTerm,
    setSearchTerm,
    totalCount: allEvents.length,
  }
}
