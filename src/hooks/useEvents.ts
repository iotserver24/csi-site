import { useEffect, useState } from 'react'
import { api } from '../lib/api-client'
import { mockEvents } from '../data/eventsData'
import { filterEvents } from '../utils/eventUtils'
import type { Event, MockEvent } from '../types'

export const useEvents = (initialYear: string = '2024') => {
  const [events, setEvents] = useState<(Event | MockEvent)[]>([])
  const [filteredEvents, setFilteredEvents] = useState<(Event | MockEvent)[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(initialYear)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get('/api/events').then(({ events: rows }) => {
      if (cancelled) return
      const year = Number(selectedYear)
      const result = (rows as Event[]).filter((event: Event) => Number(event.year || String(event.date || '').slice(0, 4)) === year)
      const fallback = result.length ? result : mockEvents[selectedYear as keyof typeof mockEvents] || []
      setEvents(fallback); setFilteredEvents(fallback); setError(null)
    }).catch(() => {
      if (!cancelled) { const fallback = mockEvents[selectedYear as keyof typeof mockEvents] || []; setEvents(fallback); setFilteredEvents(fallback); setError(null) }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedYear])

  useEffect(() => setFilteredEvents(filterEvents(events as { title: string; description: string; type: string }[], searchTerm, selectedType) as (Event | MockEvent)[]), [events, searchTerm, selectedType])
  return { events, filteredEvents, loading, error, selectedYear, setSelectedYear, selectedType, setSelectedType, searchTerm, setSearchTerm }
}
