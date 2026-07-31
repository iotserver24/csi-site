import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import EventsHero from '../components/Events/EventsHero'
import EventsFilter from '../components/Events/EventsFilter'
import EventsGrid from '../components/Events/EventsGrid'
import EventsEmpty from '../components/Events/EventsEmpty'
import EventDetailsModal, { type RegistrationUpdate } from '../components/Events/EventDetailsModal'
import { useEvents } from '../hooks/useEvents'
import { getEventById } from '../services/eventService'
import { toast } from 'sonner'
import type { Event, MockEvent } from '../types'

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | MockEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  
  const {
    filteredEvents,
    loading,
    selectedYear,
    setSelectedYear,
    selectedType,
    setSelectedType,
    totalCount,
    patchEvent,
    refresh,
  } = useEvents('2026')

  // Check for event parameter in URL on mount
  useEffect(() => {
    const eventId = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('event')
    if (eventId && !loading) {
      // First try to find the event in the current year's events
      const event = filteredEvents.find(e => e.id === eventId)
      if (event) {
        setSelectedEvent(event)
        setIsModalOpen(true)
      } else if (filteredEvents.length > 0) {
        // If not found in current events, try to fetch it by ID
        const fetchEvent = async () => {
          try {
            const eventData = await getEventById(eventId)
            if (eventData) {
              setSelectedEvent(eventData)
              setIsModalOpen(true)
            }
          } catch {
            toast.error('Event not found')
            router.replace('/events')
          }
        }
        fetchEvent()
      }
    }
  }, [filteredEvents, loading, router])

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
    // Update URL without reloading the page
    router.push(`/events?event=${event.id}`)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
    // Remove event parameter from URL
    router.replace('/events')
  }

  const handleRegistered = useCallback((update: RegistrationUpdate) => {
    patchEvent(update.eventId, {
      participantCount: update.participantCount,
      spotsLeft: update.spotsLeft,
    })
    setSelectedEvent(prev =>
      prev && prev.id === update.eventId
        ? { ...prev, participantCount: update.participantCount, spotsLeft: update.spotsLeft }
        : prev
    )
    void refresh()
  }, [patchEvent, refresh])

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <EventsHero eventCount={filteredEvents.length} totalCount={totalCount} year={selectedYear} />

      {/* Filters Section */}
      <EventsFilter
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />

      {/* Events Grid */}
      <section className="pt-1 pb-16">
        <div className="container-custom">
          {filteredEvents.length > 0 ? (
            <EventsGrid 
              events={filteredEvents as Event[]} 
              loading={loading}
              onEventClick={handleEventClick}
            />
          ) : (
            !loading && <EventsEmpty />
          )}
        </div>
      </section>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent as Event}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onRegistered={handleRegistered}
        />
      )}
    </div>
  )
}

export default Events
