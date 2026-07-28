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
export const formatEventDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Filter events based on search term and type
 * @param {Array} events - Array of events
 * @param {string} searchTerm - Search term
 * @param {string} selectedType - Selected event type
 * @returns {Array} - Filtered events
 */
export const filterEvents = <T extends { title: string; description: string; type: string }>(events: T[], searchTerm: string, selectedType: string) => {
  let filtered = [...events]

  if (searchTerm) {
    filtered = filtered.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (selectedType !== 'all') {
    filtered = filtered.filter(event => event.type === selectedType)
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
