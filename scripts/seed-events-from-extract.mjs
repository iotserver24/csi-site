/**
 * Upsert CSI events from scripts/events-from-extract.json into Postgres.
 * Usage: bun ./scripts/seed-events-from-extract.mjs
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import * as schema from '../src/db/schema.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jsonPath = resolve(__dirname, 'events-from-extract.json')

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

const raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
if (!Array.isArray(raw) || raw.length === 0) throw new Error('No events in extract JSON')

const client = postgres(process.env.DATABASE_URL, { max: 5, prepare: false })
const db = drizzle(client, { schema })

function cleanStr(v) {
  if (v == null) return null
  const s = String(v).trim()
  if (!s || s === 'None' || s === 'undefined' || s === 'undefined...') return null
  return s
}

function parseBool(v, fallback = false) {
  if (typeof v === 'boolean') return v
  if (v === 'True' || v === 'true') return true
  if (v === 'False' || v === 'false') return false
  return fallback
}

/** Best-effort date for display/sort from free-text extract dates. */
function parseEventDate(dateRaw, year) {
  const y = Number(year) || null
  const s = cleanStr(dateRaw)
  if (!s) return y ? new Date(Date.UTC(y, 0, 1)) : null
  // pure year
  if (/^\d{4}$/.test(s)) return new Date(Date.UTC(Number(s), 0, 1))
  // "20 February 2019"
  const d1 = Date.parse(s)
  if (!Number.isNaN(d1)) return new Date(d1)
  // "10, 11 January 2019" → first day
  const m = s.match(/(\d{1,2})\s*,?\s*(?:\d{1,2}\s*)?([A-Za-z]+)\s+(\d{4})/)
  if (m) {
    const d = Date.parse(`${m[1]} ${m[2]} ${m[3]}`)
    if (!Number.isNaN(d)) return new Date(d)
  }
  return y ? new Date(Date.UTC(y, 0, 1)) : null
}

function encodeImageUrl(url) {
  const s = cleanStr(url)
  if (!s) return null
  try {
    // Encode path segments that have spaces without double-encoding
    const u = new URL(s)
    u.pathname = u.pathname
      .split('/')
      .map(seg => {
        try {
          return encodeURIComponent(decodeURIComponent(seg))
        } catch {
          return encodeURIComponent(seg)
        }
      })
      .join('/')
    return u.toString()
  } catch {
    return s.replace(/ /g, '%20')
  }
}

const rows = raw.map(item => {
  const year = Number(item.year) || null
  const image = encodeImageUrl(item.image || item.cloudinaryUrl)
  const description = cleanStr(item.description)
  const location = cleanStr(item.venue) || cleanStr(item.location)
  const date = parseEventDate(item.date, year)
  const metadata = {
    ...item,
    time: cleanStr(item.time),
    venue: cleanStr(item.venue),
    organizers: cleanStr(item.organizers),
    entryFee: item.entryFee != null ? Number(item.entryFee) || 0 : 0,
    brief: cleanStr(item.brief),
    cloudinaryUrl: encodeImageUrl(item.cloudinaryUrl || item.image),
    originalImagePath: cleanStr(item.originalImagePath),
    status: cleanStr(item.status) || 'active',
    teamSizeOptions: item.teamSizeOptions === 'None' || item.teamSizeOptions == null ? null : item.teamSizeOptions,
    dateRaw: cleanStr(item.date),
  }

  return {
    id: String(item.id),
    title: cleanStr(item.title) || 'Untitled event',
    description,
    date,
    year,
    type: cleanStr(item.type) || 'TEAM',
    category: cleanStr(item.category) || 'PREVIOUS',
    location,
    image,
    published: parseBool(item.published, true),
    featured: parseBool(item.featured, false),
    registrationsAvailable: parseBool(item.registrationsAvailable, false),
    capacity: null,
    participantCount: 0,
    contactPersons: [],
    metadata,
    updatedAt: new Date(),
  }
})

console.log(`Upserting ${rows.length} events…`)

let upserted = 0
for (const row of rows) {
  await db
    .insert(schema.events)
    .values({ ...row, createdAt: new Date() })
    .onConflictDoUpdate({
      target: schema.events.id,
      set: {
        title: row.title,
        description: row.description,
        date: row.date,
        year: row.year,
        type: row.type,
        category: row.category,
        location: row.location,
        image: row.image,
        published: row.published,
        featured: row.featured,
        registrationsAvailable: row.registrationsAvailable,
        metadata: row.metadata,
        updatedAt: row.updatedAt,
      },
    })
  upserted++
}

const counts = await db.execute(sql`select year, count(*)::int as c from events group by year order by year desc`)
console.log(JSON.stringify({ upserted, byYear: counts }, null, 2))
await client.end()
console.log('Done.')
