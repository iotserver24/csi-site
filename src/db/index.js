import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema.js'

const globalForDb = globalThis

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not configured; database routes will return configuration errors.')
}

const client = globalForDb.__csiPostgres ?? postgres(process.env.DATABASE_URL || 'postgres://invalid:invalid@localhost/invalid', {
  max: 5,
  prepare: false,
})

if (process.env.NODE_ENV !== 'production') globalForDb.__csiPostgres = client

export const db = drizzle(client, { schema })
