import 'dotenv/config'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { inArray } from 'drizzle-orm'
import * as schema from '../src/db/schema.ts'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required')
const adminApp = getApps()[0] || initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) })
const firestore = getFirestore(adminApp)
const client = postgres(process.env.DATABASE_URL, { max: 10, prepare: false })
const db = drizzle(client, { schema })
const date = value => value?.toDate ? value.toDate() : value ? new Date(value) : null
const json = value => JSON.parse(JSON.stringify(value, (_, item) => item?.toDate ? item.toDate().toISOString() : item))
const read = async name => (await firestore.collection(name).get()).docs.map(doc => ({ id: doc.id, ...doc.data() }))
const batch = (arr, size) => { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out }

console.log('Reading Firestore...')
const [userRows, coreRows, adminRows, eventRows, registrationRows, recruitRows, paymentRows] = await Promise.all([
  read('users'), read('coreMembers'), read('admins'), read('events'),
  read('eventRegistrations'), read('recruits'), read('payments')
])
console.log(`Firestore: ${userRows.length} users, ${coreRows.length} coreMembers, ${adminRows.length} admins, ${eventRows.length} events, ${registrationRows.length} registrations, ${recruitRows.length} recruits, ${paymentRows.length} payments`)

console.log('Inserting membership plans...')
await db.insert(schema.membershipPlans).values([
  { id: 'one-year', name: '1-Year Executive Membership', price: '358', durationYears: 1 },
  { id: 'two-year', name: '2-Year Executive Membership', price: '664', durationYears: 2 },
  { id: 'three-year', name: '3-Year Executive Membership', price: '919', durationYears: 3 },
]).onConflictDoNothing()

console.log('Inserting users (batched)...')
const userValues = userRows.map(item => ({
  firebaseUid: item.uid || item.id, email: item.email || `${(item.uid || item.id).slice(0, 12)}@placeholder.local`, name: item.name || null, photoUrl: item.photoURL || null,
  phone: item.phone || item.profile?.phone || null, college: item.profile?.college || 'NMAMIT', branch: item.branch || item.profile?.branch || null,
  year: item.profile?.year || item.year ? String(item.profile?.year || item.year) : null, bio: item.bio || item.profile?.bio || null,
  usn: item.usn || null, github: item.github || null, linkedin: item.linkedin || null,
  membershipStatus: item.membership?.status || 'inactive', membershipType: item.membership?.type || null,
  membershipStartsAt: date(item.membership?.startDate), membershipExpiresAt: date(item.membership?.expiresAt), certificates: json(item.certificates || []),
  createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}))
for (const chunk of batch(userValues, 50)) await db.insert(schema.users).values(chunk).onConflictDoNothing()
console.log(`Users done: ${userValues.length}`)

console.log('Inserting core members and roles...')
const coreValues = coreRows.map(item => ({
  email: item.email.toLowerCase(), name: item.name || null, role: item.role || 'Member',
  permissions: json(item.permissions || []), level: Number(item.level || 99)
}))
if (coreValues.length) await db.insert(schema.coreMembers).values(coreValues).onConflictDoNothing()

const allUsers = await db.select().from(schema.users)
const uidToId = new Map(allUsers.map(u => [u.firebaseUid, u.id]))

const roleValues = []
for (const item of adminRows) {
  const id = uidToId.get(item.uid || item.id)
  if (id) roleValues.push({ userId: id, role: 'admin', permissions: ['all'], level: 0 })
}
for (const item of userRows.filter(i => i.role === 'coreMember')) {
  const id = uidToId.get(item.uid || item.id)
  if (id) roleValues.push({ userId: id, role: 'coreMember', permissions: json(item.roleDetails?.permissions || []), level: Number(item.roleDetails?.level || 99) })
}
if (roleValues.length) await db.insert(schema.roles).values(roleValues).onConflictDoNothing()
console.log(`Core members: ${coreValues.length}, roles: ${roleValues.length}`)

console.log('Inserting events (batched)...')
const eventValues = eventRows.map(item => ({
  id: item.id, title: item.title || 'Untitled event', description: item.description || null, date: date(item.date),
  year: Number(item.year || (item.date ? new Date(item.date).getFullYear() : 0)) || null,
  type: item.type || null, category: item.category || null, location: item.location || item.venue || null,
  image: item.image || null, published: item.published !== false, featured: Boolean(item.featured),
  registrationsAvailable: Boolean(item.registrationsAvailable), capacity: Number(item.capacity || 0) || null,
  participantCount: Number(item.participantCount || 0), contactPersons: json(item.contactPersons || []),
  metadata: json(item), createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}))
for (const chunk of batch(eventValues, 50)) await db.insert(schema.events).values(chunk).onConflictDoNothing()
console.log(`Events done: ${eventValues.length}`)

console.log('Inserting registrations (batched)...')
const regValues = registrationRows.map(item => ({
  eventId: item.eventId, userId: uidToId.get(item.userId) || null,
  email: item.userEmail || item.email || null, registrationCode: item.teamCode || item.registrationCode || `MIG-${item.id}`,
  teamName: item.teamName || null, teamLeader: item.teamLeader || null,
  teamMembers: json(item.members || []), status: item.status || 'registered', metadata: json(item),
  createdAt: date(item.registeredAt || item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}))
if (regValues.length) for (const chunk of batch(regValues, 50)) await db.insert(schema.eventRegistrations).values(chunk).onConflictDoNothing()
console.log(`Registrations done: ${regValues.length}`)

console.log('Inserting recruits (batched)...')
const recruitValues = recruitRows.map(item => ({
  userId: uidToId.get(item.userId) || null, planId: item.planId || null,
  name: item.name || item.userName || 'Unknown', email: item.email || item.userEmail || 'unknown@example.com',
  phone: item.phone || null, branch: item.branch || null, year: item.year ? String(item.year) : null,
  usn: item.usn || null, whyJoin: item.whyJoin || null, status: item.status || 'pending', metadata: json(item),
  createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}))
if (recruitValues.length) for (const chunk of batch(recruitValues, 50)) await db.insert(schema.recruits).values(chunk).onConflictDoNothing()
console.log(`Recruits done: ${recruitValues.length}`)

console.log('Inserting payments (batched)...')
const paymentValues = paymentRows.map(item => ({
  id: item.paymentId || item.id, userId: uidToId.get(item.userId) || null,
  orderId: item.orderId || `MIG-${item.id}`, amount: String(item.amount || 0), currency: item.currency || 'INR',
  planId: item.planId || null, status: item.status || 'captured', webhookPayload: json(item),
  createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}))
if (paymentValues.length) for (const chunk of batch(paymentValues, 50)) await db.insert(schema.payments).values(chunk).onConflictDoNothing()
console.log(`Payments done: ${paymentValues.length}`)

const duplicateEmails = userRows.map(item => item.email?.toLowerCase()).filter((email, i, v) => email && v.indexOf(email) !== i)
const orphanedRegistrations = registrationRows.filter(item => !eventRows.some(e => e.id === item.eventId)).length
console.log(JSON.stringify({
  counts: { users: userValues.length, coreMembers: coreValues.length, roles: roleValues.length, events: eventValues.length, registrations: regValues.length, recruits: recruitValues.length, payments: paymentValues.length },
  validation: { duplicateEmails: [...new Set(duplicateEmails)], orphanedRegistrations }
}, null, 2))
await client.end()
console.log('Done!')
