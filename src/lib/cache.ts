// Two-tier cache: Redis (shared across instances) + in-memory (per-process fallback).
// ponytail: Redis for shared state, Map fallback if Redis is down or local dev.

import { redis } from './redis'

interface CacheEntry<T> { data: T; expires: number }

const memCache = new Map<string, CacheEntry<unknown>>()

export async function getCached<T>(key: string): Promise<T | null> {
  // Try Redis first
  try {
    const raw = await redis.get<string>(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* fall through to memory */ }

  // Fallback to in-memory
  const entry = memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { memCache.delete(key); return null }
  return entry.data as T
}

export async function setCache(key: string, data: unknown, ttlSec: number): Promise<void> {
  const json = JSON.stringify(data)
  // Write to both layers
  try { await redis.set(key, json, { ex: ttlSec }) } catch { /* memory fallback */ }
  memCache.set(key, { data, expires: Date.now() + ttlSec * 1000 })
}

export async function invalidateCache(prefix: string): Promise<void> {
  // Clear memory
  for (const key of memCache.keys()) { if (key.startsWith(prefix)) memCache.delete(key) }
  // Clear Redis keys matching prefix (SCAN needed — skip for now, TTL handles it)
}
