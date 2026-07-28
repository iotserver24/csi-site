import { api } from '../lib/api-client'
import type { Event, EventFilters } from '../types'

export const getAllEvents = async (filters?: EventFilters) => {
  const { events } = await api.get(`/api/events${filters?.includeDrafts ? '?includeDrafts=true' : ''}`)
  return events as Event[]
}
export const getEventById = async (id: string) => {
  const event = (await getAllEvents({ includeDrafts: true })).find(item => item.id === id)
  if (!event) throw new Error('Event not found')
  return event
}
export const createEvent = async (eventData: Record<string, unknown>) => (await api.post('/api/events', eventData) as { event: { id: string } }).event.id
export const updateEvent = (id: string, data: Record<string, unknown>) => api.patch(`/api/events/${id}`, data)
export const deleteEvent = (id: string) => api.delete(`/api/events/${id}`)
export const toggleEventPublished = (id: string, published: boolean) => api.patch(`/api/events/${id}`, { published })
export const getEventsByYear = (year: number | string) => getAllEvents().then(events => events.filter(event => Number(event.year) === Number(year)))
