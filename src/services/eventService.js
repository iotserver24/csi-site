import { api } from '../lib/api-client'

export const getAllEvents = async filters => {
  const { events } = await api.get(`/api/events${filters?.includeDrafts ? '?includeDrafts=true' : ''}`)
  return events
}
export const getEventById = async id => {
  const event = (await getAllEvents({ includeDrafts: true })).find(item => item.id === id)
  if (!event) throw new Error('Event not found')
  return event
}
export const createEvent = async eventData => (await api.post('/api/events', eventData)).event.id
export const updateEvent = (id, data) => api.patch(`/api/events/${id}`, data)
export const deleteEvent = id => api.delete(`/api/events/${id}`)
export const toggleEventPublished = (id, published) => api.patch(`/api/events/${id}`, { published })
export const getEventsByYear = year => getAllEvents().then(events => events.filter(event => Number(event.year) === Number(year)))
