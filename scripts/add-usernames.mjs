#!/usr/bin/env bun
/**
 * Add users.username column (if missing) and backfill handles for existing users.
 *
 *   bun scripts/add-usernames.mjs
 *   DATABASE_URL=... bun scripts/add-usernames.mjs
 */

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 2,
  prepare: false,
  connect_timeout: 30,
  ssl: process.env.DATABASE_URL.includes('sslmode=require') ? 'require' : undefined,
})

function normalize(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 24)
}

/** Default username = USN; fall back to email/name only if no USN. */
function suggest(row) {
  const usn = normalize(row.usn)
  if (usn.length >= 3) return usn
  const email = normalize((row.email || '').split('@')[0])
  if (email.length >= 3) return email
  const name = normalize((row.name || '').replace(/\s+/g, ''))
  if (name.length >= 3) return name
  return `user${Math.random().toString(36).slice(2, 8)}`
}

function looksAuto(username, row) {
  if (!username) return true
  const u = normalize(username)
  const usn = normalize(row.usn)
  if (usn && u === usn) return true
  const email = normalize((row.email || '').split('@')[0])
  if (email && (u === email || u.startsWith(email))) return true
  const name = normalize((row.name || '').replace(/\s+/g, ''))
  if (name && (u === name || u.startsWith(name))) return true
  if (u.startsWith('user')) return true
  return false
}

try {
  console.log('Ensuring users.username column…')
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username text`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username)`

  // Prefer USN for anyone missing a handle OR still on an auto email/name handle
  const rows = await sql`SELECT id, email, name, usn, username FROM users`
  const targets = rows.filter(r => {
    const usn = normalize(r.usn)
    if (usn.length >= 3 && normalize(r.username) !== usn && looksAuto(r.username, r)) return true
    if (!r.username) return true
    return false
  })
  console.log(`Users to set/upgrade username (USN-first): ${targets.length}`)

  for (const row of targets) {
    const base = suggest(row)
    let candidate = base
    for (let i = 0; i < 40; i++) {
      const c = i === 0 ? base : `${base.slice(0, Math.max(3, 24 - String(i).length))}${i}`
      const taken = await sql`SELECT 1 FROM users WHERE username = ${c} AND id <> ${row.id} LIMIT 1`
      if (!taken.length) {
        candidate = c
        break
      }
    }
    await sql`UPDATE users SET username = ${candidate}, updated_at = now() WHERE id = ${row.id}`
    console.log(`  ${row.email} → @${candidate}${row.usn ? ` (from USN ${row.usn})` : ''}`)
  }

  console.log('Done.')
} catch (err) {
  console.error('Failed:', err?.message || err)
  process.exit(1)
} finally {
  await sql.end({ timeout: 5 })
}
