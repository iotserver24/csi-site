import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EventsHero from '../components/Events/EventsHero'
import EventsFilter from '../components/Events/EventsFilter'
import EventsGrid from '../components/Events/EventsGrid'
import EventsEmpty from '../components/Events/EventsEmpty'
import EventDetailsModal from '../components/Events/EventDetailsModal'
import { useEvents } from '../hooks/useEvents'
import { getEventById } from '../services/eventService'
import { toast } from 'sonner'

const Events = () => {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  
  const {
    filteredEvents,
    loading,
    selectedYear,
    setSelectedYear,
    selectedType,
    setSelectedType,
    searchTerm,
    setSearchTerm
  } = useEvents('2025')

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
          } catch (error) {
            toast.error('Event not found')
            router.replace('/events')
          }
        }
        fetchEvent()
      }
    }
  }, [filteredEvents, loading, router])

  const handleEventClick = (event) => {
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

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <EventsHero eventCount={filteredEvents.length} />

      {/* Filters Section */}
      <EventsFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {/* Events Grid */}
      <section className="pt-1 pb-16">
        <div className="container-custom">
          {filteredEvents.length > 0 ? (
            <EventsGrid 
              events={filteredEvents} 
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
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default Events
