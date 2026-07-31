/**
 * Simple sliding-window rate limit.
 * Uses Upstash Redis when configured; falls back to per-process memory.
 */

import { redis } from './redis'

type Window = { timestamps: number[] }

const memory = new Map<string, Window>()

function memoryAllow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memory.get(key) || { timestamps: [] }
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)
  if (entry.timestamps.length >= limit) {
    memory.set(key, entry)
    return false
  }
  entry.timestamps.push(now)
  memory.set(key, entry)
  return true
}

/** Returns true if the request is allowed. */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redisKey = `rl:${key}`
      const count = await redis.incr(redisKey)
      if (count === 1) await redis.expire(redisKey, windowSec)
      return count <= limit
    }
  } catch {
    /* fall through */
  }
  return memoryAllow(key, limit, windowMs)
}

export function clientIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}
