import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require', connect_timeout: 20 })

const totals = await sql`
  SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE lower(trim(email)) LIKE '%@nmamit.in')::int AS nmamit,
    count(*) FILTER (WHERE email IS NULL OR lower(trim(email)) NOT LIKE '%@nmamit.in')::int AS non_nmamit
  FROM users
`

const non = await sql`
  SELECT u.id, u.email, u.name, u.usn, u.username, u.membership_status, u.membership_type,
         u.firebase_uid, u.created_at,
         (SELECT string_agg(r.role, ', ') FROM roles r WHERE r.user_id = u.id) AS roles
  FROM users u
  WHERE u.email IS NULL OR lower(trim(u.email)) NOT LIKE '%@nmamit.in'
  ORDER BY
    CASE WHEN lower(coalesce(u.email, '')) LIKE '%@placeholder.local' THEN 1 ELSE 0 END,
    lower(coalesce(u.email, ''))
`

const real = non.filter(r => !String(r.email || '').toLowerCase().endsWith('@placeholder.local'))
const placeholders = non.filter(r => String(r.email || '').toLowerCase().endsWith('@placeholder.local'))
const ids = non.map(r => r.id)

const related = ids.length
  ? await sql`
      SELECT
        (SELECT count(*)::int FROM payments p WHERE p.user_id = ANY(${ids})) AS payments,
        (SELECT count(*)::int FROM event_registrations er WHERE er.user_id = ANY(${ids})) AS event_regs,
        (SELECT count(*)::int FROM roles r WHERE r.user_id = ANY(${ids})) AS roles,
        (SELECT count(*)::int FROM media m WHERE m.owner_id = ANY(${ids})) AS media,
        (SELECT count(*)::int FROM users u WHERE u.id = ANY(${ids}) AND u.membership_status = 'active') AS active_membership
    `
  : [{ payments: 0, event_regs: 0, roles: 0, media: 0, active_membership: 0 }]

const realIds = real.map(r => r.id)
const realPayments = realIds.length
  ? await sql`
      SELECT p.id, p.amount, p.status, p.plan_id, u.email, u.name
      FROM payments p JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ANY(${realIds})
    `
  : []

const activeNon = non.filter(r => r.membership_status === 'active')
const elevated = non.filter(r => {
  const roles = r.roles || ''
  return roles.includes('admin') || roles.includes('coreMember')
})

console.log('=== USER TOTALS ===')
console.log(totals[0])
console.log('\n=== NON-@nmamit.in BREAKDOWN ===')
console.log({ total: non.length, realEmails: real.length, placeholderLocal: placeholders.length })
console.log('\n=== RELATED ROWS (would be orphaned / need cascade if deleted) ===')
console.log(related[0])
console.log('\n=== ACTIVE MEMBERSHIP AMONG NON-nmamit ===')
console.log(activeNon.length ? activeNon.map(r => ({ email: r.email, name: r.name, usn: r.usn })) : '(none)')
console.log('\n=== ADMIN / CORE AMONG NON-nmamit ===')
console.log(elevated.length ? elevated.map(r => ({ email: r.email, name: r.name, roles: r.roles })) : '(none)')
console.log('\n=== REAL EMAIL ACCOUNTS (not placeholder.local) ===')
for (const r of real) {
  console.log(`- ${r.email} | ${r.name || '—'} | USN:${r.usn || '—'} | @${r.username || '—'} | mem:${r.membership_status} | ${r.roles || 'member'} | ${r.id}`)
}
console.log('\n=== PAYMENTS ON REAL NON-nmamit ACCOUNTS ===')
console.log(realPayments.length ? realPayments : '(none)')
console.log('\n=== PLACEHOLDER.LOCAL SAMPLE (first 15 of ' + placeholders.length + ') ===')
for (const r of placeholders.slice(0, 15)) {
  console.log(`- ${r.email} | ${r.name || '—'} | USN:${r.usn || '—'} | @${r.username || '—'}`)
}
if (placeholders.length > 15) console.log(`  ... and ${placeholders.length - 15} more`)

await sql.end({ timeout: 5 })
