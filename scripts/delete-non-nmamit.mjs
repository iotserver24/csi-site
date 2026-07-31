/**
 * Delete all users whose email is not *@nmamit.in
 * Roles cascade; payments/regs/media set user_id null.
 *
 * Usage: bun scripts/delete-non-nmamit.mjs --apply
 * Default is dry-run.
 */
import 'dotenv/config'
import postgres from 'postgres'

const apply = process.argv.includes('--apply')
const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require', connect_timeout: 30 })

const before = await sql`
  SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE lower(trim(email)) LIKE '%@nmamit.in')::int AS nmamit,
    count(*) FILTER (WHERE email IS NULL OR lower(trim(email)) NOT LIKE '%@nmamit.in')::int AS non_nmamit
  FROM users
`
console.log('Before:', before[0])

const toDelete = await sql`
  SELECT id, email, name, usn, membership_status,
    (SELECT string_agg(r.role, ', ') FROM roles r WHERE r.user_id = users.id) AS roles
  FROM users
  WHERE email IS NULL OR lower(trim(email)) NOT LIKE '%@nmamit.in'
  ORDER BY email
`
console.log(`Will delete ${toDelete.length} users`)

const remainingAdmins = await sql`
  SELECT u.email, u.name, r.role
  FROM users u
  JOIN roles r ON r.user_id = u.id
  WHERE lower(trim(u.email)) LIKE '%@nmamit.in'
    AND r.role IN ('admin', 'coreMember')
`
console.log('Remaining elevated @nmamit.in after delete:', remainingAdmins)

if (!apply) {
  console.log('\nDry-run only. Re-run with --apply to delete.')
  await sql.end({ timeout: 5 })
  process.exit(0)
}

const deleted = await sql`
  DELETE FROM users
  WHERE email IS NULL OR lower(trim(email)) NOT LIKE '%@nmamit.in'
  RETURNING id, email
`
console.log(`Deleted ${deleted.length} users`)

const after = await sql`
  SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE lower(trim(email)) LIKE '%@nmamit.in')::int AS nmamit,
    count(*) FILTER (WHERE email IS NULL OR lower(trim(email)) NOT LIKE '%@nmamit.in')::int AS non_nmamit
  FROM users
`
console.log('After:', after[0])

const keep = await sql`
  SELECT email, name, usn, username, membership_status,
    (SELECT string_agg(r.role, ', ') FROM roles r WHERE r.user_id = users.id) AS roles
  FROM users
  ORDER BY email
`
console.log('\nRemaining users:')
for (const u of keep) {
  console.log(`- ${u.email} | ${u.name || '—'} | ${u.usn || '—'} | @${u.username || '—'} | ${u.membership_status} | ${u.roles || 'member'}`)
}

await sql.end({ timeout: 5 })
