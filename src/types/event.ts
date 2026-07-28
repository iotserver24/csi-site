import type { InferSelectModel } from 'drizzle-orm'
import type { events, eventRegistrations } from '../db/schema'

export type DbEvent = InferSelectModel<typeof events>
export type DbEventRegistration = InferSelectModel<typeof eventRegistrations>

export interface Event extends Omit<DbEvent, 'metadata'> {
  contact_persons?: ContactPerson[]
  metadata: Record<string, unknown>
  time?: string
  venue?: string
  entryFee?: number
  brief?: string
  organizers?: string
  allowViewOtherTeams?: boolean
  teamSizeOptions?: number[]
}

export interface ContactPerson {
  name: string
  phone?: string
  email?: string
}

export interface EventRegistration extends DbEventRegistration {
  team_members?: string[]
}

export interface EventFilters {
  year?: number | string
  type?: string
  category?: string
  search?: string
  includeDrafts?: boolean
}

export interface MockEvent {
  id: number
  title: string
  date: string
  time: string
  location: string
  type: string
  description: string
  participants: number
  status: string
  image: string
}
