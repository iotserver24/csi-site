#!/usr/bin/env bun
/**
 * Copy all app data from one Postgres to another.
 *
 * Usage:
 *   bun scripts/copy-postgres.mjs \
 *     --source "postgres://user:pass@host/db?sslmode=require" \
 *     --target "postgres://user:pass@host2/db?sslmode=require"
 *
 * Or env:
 *   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... bun scripts/copy-postgres.mjs
 *   # SOURCE defaults to DATABASE_URL if SOURCE_DATABASE_URL is unset
 *
 * Flags:
 *   --dry-run          Count rows only; no writes
 *   --apply-schema     Run drizzle/0000_*.sql on target when tables are missing
 *   --truncate         TRUNCATE target tables (CASCADE) before insert — destructive
 *   --tables a,b,c     Only copy these tables (still FK-ordered)
 *   --batch 200        Insert batch size (default 200)
 *
 * Safety: refuses to run if source and target URLs resolve to the same database.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

/** FK-safe insert order (parents before children). */
const TABLE_ORDER = [
  'users',
  'membership_plans',
  'events',
  'core_members',
  'admin_otps',
  'roles',
  'event_registrations',
  'recruits',
  'payments',
  'media',
]

function parseArgs(argv) {
  const out = {
    source: process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL || '',
    target: process.env.TARGET_DATABASE_URL || '',
    dryRun: false,
    applySchema: false,
    truncate: false,
    tables: null,
    batch: 200,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--source') out.source = argv[++i] || ''
    else if (a === '--target') out.target = argv[++i] || ''
    else if (a === '--dry-run') out.dryRun = true
    else if (a === '--apply-schema') out.applySchema = true
    else if (a === '--truncate') out.truncate = true
    else if (a === '--tables') {
      out.tables = (argv[++i] || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    } else if (a === '--batch') out.batch = Math.max(1, Number(argv[++i]) || 200)
    else if (a === '--help' || a === '-h') out.help = true
  }
  return out
}

function redactUrl(url) {
  try {
    const u = new URL(url)
    if (u.password) u.password = '***'
    return u.toString()
  } catch {
    return '(invalid url)'
  }
}

function sameDatabase(a, b) {
  try {
    const ua = new URL(a)
    const ub = new URL(b)
    return (
      ua.hostname === ub.hostname &&
      ua.port === ub.port &&
      ua.pathname === ub.pathname
    )
  } catch {
    return a === b
  }
}

function connect(url) {
  return postgres(url, {
    max: 5,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl: url.includes('sslmode=require') || url.includes('neon.tech') ? 'require' : undefined,
  })
}

async function listPublicTables(sql) {
  const rows = await sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `
  return rows.map(r => r.tablename)
}

async function tableExists(sql, name) {
  const rows = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${name}
    LIMIT 1
  `
  return rows.length > 0
}

async function countRows(sql, table) {
  const rows = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM "${table}"`)
  return rows[0]?.n ?? 0
}

function findDrizzleSql() {
  const dir = join(root, 'drizzle')
  try {
    const files = readdirSync(dir)
      .filter(f => f.endsWith('.sql') && !f.includes('meta'))
      .sort()
    if (!files.length) return null
    return join(dir, files[0])
  } catch {
    return null
  }
}

async function applySchema(targetSql) {
  const path = findDrizzleSql()
  if (!path) {
    console.error('No drizzle/*.sql migration found; create schema on target first.')
    process.exit(1)
  }
  console.log(`Applying schema from ${path.replace(root + '/', '')}`)
  const raw = readFileSync(path, 'utf8')
  // drizzle uses --> statement-breakpoint between statements
  const statements = raw
    .split(/-->\s*statement-breakpoint/)
    .map(s => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    try {
      await targetSql.unsafe(stmt)
    } catch (err) {
      // Ignore "already exists" so re-runs are safer
      const msg = String(err?.message || err)
      if (/already exists/i.test(msg)) {
        console.log(`  skip (exists): ${stmt.slice(0, 60).replace(/\s+/g, ' ')}…`)
        continue
      }
      throw err
    }
  }
  console.log(`  applied ${statements.length} statements`)
}

function orderedTables(available, only) {
  const set = new Set(available)
  const ordered = []
  for (const t of TABLE_ORDER) {
    if (!set.has(t)) continue
    if (only && !only.includes(t)) continue
    ordered.push(t)
  }
  // Any extra public tables not in TABLE_ORDER (after known ones)
  for (const t of available) {
    if (TABLE_ORDER.includes(t)) continue
    if (only && !only.includes(t)) continue
    // skip drizzle/internal
    if (t.startsWith('__') || t === 'drizzle' || t.startsWith('drizzle_')) continue
    ordered.push(t)
    console.warn(`  note: table "${t}" not in known order — copying last`)
  }
  return ordered
}

async function copyTable(sourceSql, targetSql, table, batch, dryRun) {
  const total = await countRows(sourceSql, table)
  if (total === 0) {
    console.log(`  ${table}: 0 rows`)
    return { table, source: 0, inserted: 0 }
  }
  if (dryRun) {
    console.log(`  ${table}: ${total} rows (dry-run)`)
    return { table, source: total, inserted: 0 }
  }

  // Stream in batches by ctid for stable pagination without PK assumptions
  let offset = 0
  let inserted = 0
  while (offset < total) {
    const rows = await sourceSql.unsafe(
      `SELECT * FROM "${table}" ORDER BY ctid LIMIT ${batch} OFFSET ${offset}`
    )
    if (!rows.length) break

    // Build multi-row insert with explicit columns from first batch shape
    const cols = Object.keys(rows[0])
    const colList = cols.map(c => `"${c}"`).join(', ')

    // Insert row-by-row in a transaction chunk for reliable jsonb / conflict handling
    await targetSql.begin(async tx => {
      for (const row of rows) {
        const values = cols.map(c => row[c])
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
        await tx.unsafe(
          `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        )
        inserted++
      }
    })

    offset += rows.length
    process.stdout.write(`\r  ${table}: ${Math.min(offset, total)}/${total}`)
  }
  process.stdout.write('\n')
  const targetCount = await countRows(targetSql, table)
  console.log(`  ${table}: source=${total} target_now=${targetCount}`)
  return { table, source: total, inserted, targetCount }
}

async function truncateTables(sql, tables) {
  if (!tables.length) return
  // Reverse order so children go first (CASCADE also covers FKs)
  const list = [...tables].reverse().map(t => `"${t}"`).join(', ')
  console.log(`Truncating: ${tables.slice().reverse().join(', ')}`)
  await sql.unsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/Usage:[\s\S]*?Safety:[^\n]+/)?.[0] || 'see script header')
    process.exit(0)
  }

  if (!opts.source || !opts.target) {
    console.error('Need --source and --target (or SOURCE_DATABASE_URL / TARGET_DATABASE_URL).')
    console.error('SOURCE may also fall back to DATABASE_URL.')
    process.exit(1)
  }
  if (sameDatabase(opts.source, opts.target)) {
    console.error('Source and target look like the same database — aborting.')
    process.exit(1)
  }

  console.log('Postgres data copy')
  console.log(`  source: ${redactUrl(opts.source)}`)
  console.log(`  target: ${redactUrl(opts.target)}`)
  console.log(`  mode:   ${opts.dryRun ? 'DRY-RUN' : opts.truncate ? 'TRUNCATE+COPY' : 'UPSERT (ON CONFLICT DO NOTHING)'}`)

  const source = connect(opts.source)
  const target = connect(opts.target)

  try {
    // connectivity check
    await source`SELECT 1`
    await target`SELECT 1`
    console.log('  both databases reachable')

    let targetTables = await listPublicTables(target)
    if (opts.applySchema || targetTables.length === 0) {
      if (opts.dryRun) {
        console.log('  would apply schema (skipped in dry-run if empty target)')
      } else {
        await applySchema(target)
        targetTables = await listPublicTables(target)
      }
    }

    const sourceTables = await listPublicTables(source)
    const tables = orderedTables(sourceTables, opts.tables)

    if (!tables.length) {
      console.error('No tables to copy.')
      process.exit(1)
    }

    console.log(`  tables: ${tables.join(', ')}`)

    // Ensure target has each table
    for (const t of tables) {
      if (!(await tableExists(target, t))) {
        console.error(`Target missing table "${t}". Re-run with --apply-schema or migrate schema first.`)
        process.exit(1)
      }
    }

    if (opts.truncate && !opts.dryRun) {
      await truncateTables(target, tables)
    } else if (opts.truncate && opts.dryRun) {
      console.log('  would truncate target tables')
    }

    const summary = []
    for (const table of tables) {
      summary.push(await copyTable(source, target, table, opts.batch, opts.dryRun))
    }

    console.log('\nDone.')
    const srcTotal = summary.reduce((s, r) => s + r.source, 0)
    console.log(`  source rows (selected tables): ${srcTotal}`)
    if (!opts.dryRun) {
      for (const r of summary) {
        const n = r.targetCount ?? (await countRows(target, r.table))
        console.log(`  ${r.table}: ${n}`)
      }
    }
  } finally {
    await source.end({ timeout: 5 })
    await target.end({ timeout: 5 })
  }
}

main().catch(err => {
  console.error('\nCopy failed:', err?.message || err)
  process.exit(1)
})
