import 'dotenv/config'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema.js'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required')
const adminApp = getApps()[0] || initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) })
const firestore = getFirestore(adminApp)
const client = postgres(process.env.DATABASE_URL, { prepare: false })
const db = drizzle(client, { schema })
const date = value => value?.toDate ? value.toDate() : value ? new Date(value) : null
const json = value => JSON.parse(JSON.stringify(value, (_, item) => item?.toDate ? item.toDate().toISOString() : item))
const read = async name => (await firestore.collection(name).get()).docs.map(doc => ({ id: doc.id, ...doc.data() }))
const findUser = async firebaseUid => (await db.select().from(schema.users).where(eq(schema.users.firebaseUid, firebaseUid)).limit(1))[0]

await db.insert(schema.membershipPlans).values([
  { id: 'one-year', name: '1-Year Executive Membership', price: '358', durationYears: 1 },
  { id: 'two-year', name: '2-Year Executive Membership', price: '664', durationYears: 2 },
  { id: 'three-year', name: '3-Year Executive Membership', price: '919', durationYears: 3 },
]).onConflictDoNothing()

const userRows = await read('users')
for (const item of userRows) await db.insert(schema.users).values({
  firebaseUid: item.uid || item.id, email: item.email, name: item.name || null, photoUrl: item.photoURL || null,
  phone: item.phone || item.profile?.phone || null, college: item.profile?.college || 'NMAMIT', branch: item.branch || item.profile?.branch || null,
  year: item.profile?.year || item.year ? String(item.profile?.year || item.year) : null, bio: item.bio || item.profile?.bio || null,
  usn: item.usn || null, github: item.github || null, linkedin: item.linkedin || null,
  membershipStatus: item.membership?.status || 'inactive', membershipType: item.membership?.type || null,
  membershipStartsAt: date(item.membership?.startDate), membershipExpiresAt: date(item.membership?.expiresAt), certificates: json(item.certificates || []),
  createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}).onConflictDoNothing()

const coreRows = await read('coreMembers')
for (const item of coreRows) await db.insert(schema.coreMembers).values({ email: item.email.toLowerCase(), name: item.name || null, role: item.role || 'Member', permissions: json(item.permissions || []), level: Number(item.level || 99) }).onConflictDoNothing()
for (const item of await read('admins')) { const user = await findUser(item.uid || item.id); if (user) await db.insert(schema.roles).values({ userId: user.id, role: 'admin', permissions: ['all'], level: 0 }).onConflictDoNothing() }
for (const item of userRows.filter(item => item.role === 'coreMember')) { const user = await findUser(item.uid || item.id); if (user) await db.insert(schema.roles).values({ userId: user.id, role: 'coreMember', permissions: json(item.roleDetails?.permissions || []), level: Number(item.roleDetails?.level || 99) }).onConflictDoNothing() }

const eventRows = await read('events')
for (const item of eventRows) await db.insert(schema.events).values({
  id: item.id, title: item.title || 'Untitled event', description: item.description || null, date: date(item.date), year: Number(item.year || (item.date ? new Date(item.date).getFullYear() : 0)) || null,
  type: item.type || null, category: item.category || null, location: item.location || item.venue || null, image: item.image || null, published: item.published !== false,
  featured: Boolean(item.featured), registrationsAvailable: Boolean(item.registrationsAvailable), capacity: Number(item.capacity || 0) || null, participantCount: Number(item.participantCount || 0),
  contactPersons: json(item.contactPersons || []), metadata: json(item), createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}).onConflictDoNothing()
const registrationRows = await read('eventRegistrations')
for (const item of registrationRows) { const user = item.userId ? await findUser(item.userId) : null; await db.insert(schema.eventRegistrations).values({
  eventId: item.eventId, userId: user?.id || null, email: item.userEmail || item.email || null, registrationCode: item.teamCode || item.registrationCode || `MIG-${item.id}`,
  teamName: item.teamName || null, teamLeader: item.teamLeader || null, teamMembers: json(item.members || []), status: item.status || 'registered', metadata: json(item),
  createdAt: date(item.registeredAt || item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}).onConflictDoNothing() }
const recruitRows = await read('recruits')
for (const item of recruitRows) { const user = item.userId ? await findUser(item.userId) : null; await db.insert(schema.recruits).values({
  userId: user?.id || null, planId: item.planId || null, name: item.name || item.userName || 'Unknown', email: item.email || item.userEmail || 'unknown@example.com', phone: item.phone || null,
  branch: item.branch || null, year: item.year ? String(item.year) : null, usn: item.usn || null, whyJoin: item.whyJoin || null, status: item.status || 'pending', metadata: json(item),
  createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}).onConflictDoNothing() }
const paymentRows = await read('payments')
for (const item of paymentRows) { const user = item.userId ? await findUser(item.userId) : null; await db.insert(schema.payments).values({
  id: item.paymentId || item.id, userId: user?.id || null, orderId: item.orderId || `MIG-${item.id}`, amount: String(item.amount || 0), currency: item.currency || 'INR', planId: item.planId || null, status: item.status || 'captured', webhookPayload: json(item),
  createdAt: date(item.createdAt) || new Date(), updatedAt: date(item.updatedAt) || new Date(),
}).onConflictDoNothing() }
const duplicateEmails = userRows.map(item => item.email?.toLowerCase()).filter((email, index, values) => email && values.indexOf(email) !== index)
const orphanedRegistrations = registrationRows.filter(item => !eventRows.some(event => event.id === item.eventId)).length
console.log(JSON.stringify({ counts: { users: userRows.length, coreMembers: coreRows.length, events: eventRows.length, registrations: registrationRows.length, recruits: recruitRows.length, payments: paymentRows.length }, validation: { duplicateEmails: [...new Set(duplicateEmails)], orphanedRegistrations } }, null, 2))
await client.end()
