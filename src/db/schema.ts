import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  photoUrl: text('photo_url'),
  phone: text('phone'),
  college: text('college').default('NMAMIT'),
  branch: text('branch'),
  year: text('year'),
  bio: text('bio'),
  usn: text('usn'),
  github: text('github'),
  linkedin: text('linkedin'),
  membershipStatus: text('membership_status').default('inactive').notNull(),
  membershipType: text('membership_type'),
  membershipStartsAt: timestamp('membership_starts_at', { withTimezone: true }),
  membershipExpiresAt: timestamp('membership_expires_at', { withTimezone: true }),
  certificates: jsonb('certificates').default([]).notNull(),
  ...timestamps,
})

export const roles = pgTable('roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  permissions: jsonb('permissions').default([]).notNull(),
  level: integer('level').default(99).notNull(),
  ...timestamps,
}, table => ({ pk: primaryKey({ columns: [table.userId, table.role] }) }))

export const membershipPlans = pgTable('membership_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  durationYears: integer('duration_years').notNull(),
  active: boolean('active').default(true).notNull(),
  ...timestamps,
})

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }),
  year: integer('year'),
  type: text('type'),
  category: text('category'),
  location: text('location'),
  image: text('image'),
  published: boolean('published').default(false).notNull(),
  featured: boolean('featured').default(false).notNull(),
  registrationsAvailable: boolean('registrations_available').default(false).notNull(),
  capacity: integer('capacity'),
  participantCount: integer('participant_count').default(0).notNull(),
  contactPersons: jsonb('contact_persons').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
})

export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: text('email'),
  registrationCode: text('registration_code').notNull(),
  teamName: text('team_name'),
  teamLeader: text('team_leader'),
  teamMembers: jsonb('team_members').default([]).notNull(),
  status: text('status').default('registered').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
}, table => ({ codeIdx: uniqueIndex('event_registrations_code_idx').on(table.registrationCode) }))

export const recruits = pgTable('recruits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  planId: text('plan_id').references(() => membershipPlans.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  branch: text('branch'),
  year: text('year'),
  usn: text('usn'),
  whyJoin: text('why_join'),
  status: text('status').default('pending').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
})

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  recruitId: uuid('recruit_id').references(() => recruits.id, { onDelete: 'set null' }),
  orderId: text('order_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  planId: text('plan_id').references(() => membershipPlans.id),
  status: text('status').notNull(),
  webhookPayload: jsonb('webhook_payload'),
  ...timestamps,
}, table => ({ orderIdx: uniqueIndex('payments_order_id_idx').on(table.orderId) }))

export const adminOtps = pgTable('admin_otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  otpHash: text('otp_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').default(false).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  ...timestamps,
})

export const coreMembers = pgTable('core_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull(),
  position: text('position'),
  quote: text('quote'),
  image: text('image'),
  usn: text('usn'),
  permissions: jsonb('permissions').default([]).notNull(),
  level: integer('level').default(99).notNull(),
  ...timestamps,
})

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  objectKey: text('object_key').notNull().unique(),
  publicUrl: text('public_url'),
  contentType: text('content_type'),
  size: integer('size'),
  ...timestamps,
})
