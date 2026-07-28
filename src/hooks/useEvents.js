import { useEffect, useState } from 'react'
import { api } from '../lib/api-client'
import { mockEvents } from '../data/eventsData'
import { filterEvents } from '../utils/eventUtils'

export const useEvents = (initialYear = '2024') => {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get('/api/events').then(({ events: rows }) => {
      if (cancelled) return
      const year = Number(selectedYear)
      const result = rows.filter(event => Number(event.year || String(event.date || '').slice(0, 4)) === year)
      const fallback = result.length ? result : mockEvents[selectedYear] || []
      setEvents(fallback); setFilteredEvents(fallback); setError(null)
    }).catch(() => {
      if (!cancelled) { const fallback = mockEvents[selectedYear] || []; setEvents(fallback); setFilteredEvents(fallback); setError(null) }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedYear])

  useEffect(() => setFilteredEvents(filterEvents(events, searchTerm, selectedType)), [events, searchTerm, selectedType])
  return { events, filteredEvents, loading, error, selectedYear, setSelectedYear, selectedType, setSelectedType, searchTerm, setSearchTerm }
}
