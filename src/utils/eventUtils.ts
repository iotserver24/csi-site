import { EVENT_TYPE_COLORS } from '../constants/eventConstants'

/**
 * Get the color gradient for an event type
 * @param {string} type - The event type
 * @returns {string} - The Tailwind gradient classes
 */
export const getEventTypeColor = (type: string) => {
  return EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.default
}

/**
 * Format event date to readable string
 * @param {string} date - The date string
 * @returns {string} - Formatted date
 */
export const formatEventDate = (date: string | Date | null | undefined) => {
  if (date == null || date === '') return ''
  if (typeof date === 'string' && /^\d{4}$/.test(date.trim())) return date.trim()
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return String(date)
  // Year-only placeholders were stored as Jan 1
  if (d.getUTCMonth() === 0 && d.getUTCDate() === 1) {
    return String(d.getUTCFullYear())
  }
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Filter events based on search term and type
 * @param {Array} events - Array of events
 * @param {string} searchTerm - Search term
 * @param {string} selectedType - Selected event type
 * @returns {Array} - Filtered events
 */
export const filterEvents = <T extends { title: string; description?: string | null; type?: string | null }>(
  events: T[],
  searchTerm: string,
  selectedType: string
) => {
  let filtered = [...events]

  if (searchTerm) {
    const q = searchTerm.toLowerCase()
    filtered = filtered.filter(event =>
      (event.title || '').toLowerCase().includes(q) ||
      (event.description || '').toLowerCase().includes(q)
    )
  }

  if (selectedType !== 'all') {
    filtered = filtered.filter(event => (event.type || '').toLowerCase() === selectedType.toLowerCase())
  }

  return filtered
}

/**
 * Sort events by date
 * @param {Array} events - Array of events
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} - Sorted events
 */
export const sortEventsByDate = <T extends { date: Date | string }>(events: T[], order: 'asc' | 'desc' = 'asc') => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
}
