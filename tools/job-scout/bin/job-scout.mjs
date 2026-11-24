#!/usr/bin/env node
// Weekly job scout: searches the allow-listed companies' careers sites, scores the postings
// against the resume, and adds the best new ones to the local JobSync as "New" (never
// "Applied"). It never applies, submits forms or contacts anyone. See README.md.

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { collect } from '../src/sources.mjs'
import { reason, scorePosting } from '../src/score.mjs'
import { BATCH, dumpData, existingUrls, mcpClient } from '../src/jobsync.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const HELP = `Usage: job-scout [options]
  --max <n>          Add at most n new postings this run (default 20).
  --min-score <n>    Skip postings scoring below n out of 100 (default 55).
  --out-dir <path>   Where the run's CSV goes (default ./job-scout-out).
  --dump <path>      Also write JobSync's jobs as a backup-style data.json here, for
                     tools/jobsync-importer --backup <path>.
  --dry-run          Search and score, write the CSV, add nothing.
  --sources <path>   Sources file (default data/sources.json).
  --allowlist <path> Company allow-list (default: the backend's reviewed list). Also JOBSYNC_ALLOWLIST.
Env: JOBSYNC_MCP_TOKEN (required unless --dry-run), JOBSYNC_MCP_URL, JOBSYNC_DIR.`

const { values } = parseArgs({ options: {
  max: { type: 'string', default: '20' }, 'min-score': { type: 'string', default: '55' },
  'out-dir': { type: 'string', default: 'job-scout-out' }, dump: { type: 'string' }, 'dry-run': { type: 'boolean', default: false },
  sources: { type: 'string', default: join(here, '..', 'data', 'sources.json') },
  allowlist: { type: 'string', default: process.env.JOBSYNC_ALLOWLIST ?? join(here, '..', '..', '..', 'backend', 'src', 'main', 'resources', 'market', 'allow-list.json') },
  help: { type: 'boolean', default: false },
} })
if (values.help) { console.log(HELP); process.exit(0) }
const max = Number(values.max)
const minScore = Number(values['min-score'])
if (!Number.isInteger(max) || max < 1 || max > 100) { console.error('--max must be 1 to 100.'); process.exit(2) }

const log = (line) => console.log(line)
const csvCell = (v) => /[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? '')
const today = new Date().toISOString().slice(0, 10)

// Only companies the reviewed allow-list includes (Fortune 500 and FINRA-regulated).
if (!existsSync(values.allowlist)) { console.error(`Allow-list not found: ${values.allowlist}`); process.exit(2) }
const allow = JSON.parse(readFileSync(values.allowlist, 'utf8'))
const included = new Set((allow.companies ?? allow).filter((c) => c.included === true && c.fortune500?.rank >= 1 && c.fortune500?.rank <= 500 && (c.finra ?? []).length > 0).map((c) => c.name))
const config = JSON.parse(readFileSync(values.sources, 'utf8'))
const sources = config.sources.filter((s) => {
  if (included.has(s.allowListName)) return true
  log(`Skipping ${s.company}: "${s.allowListName}" is not included in the allow-list.`)
  return false
})

log(`job-scout ${today}: searching ${sources.length} careers sites.`)
const { postings, failures } = await collect(sources, config.searchTerms, { log })

const known = values['dry-run'] && !values.dump ? new Set() : existingUrls()
const seen = new Set()
const ranked = []
for (const p of postings) {
  if (!p.url || known.has(p.url) || seen.has(p.url)) continue
  seen.add(p.url)
  const s = scorePosting(p)
  if (s.years !== null && s.years >= 5) continue
  if (s.score < minScore) continue
  ranked.push({ ...p, ...s, reason: reason({ ...s, location: p.location }) })
}
ranked.sort((a, b) => b.score - a.score)
const picks = ranked.slice(0, max)
log(`Found ${postings.length} candidate postings; ${ranked.length} new ones score ${minScore}+; taking ${picks.length}.`)

mkdirSync(values['out-dir'], { recursive: true })
const csvPath = resolve(values['out-dir'], `shortlist-${today}.csv`)
writeFileSync(csvPath, [['rank', 'company', 'title', 'location', 'url', 'posted_date', 'score', 'reason'].join(','),
  ...picks.map((p, i) => [i + 1, p.company, p.title, p.location, p.url, String(p.posted ?? '').slice(0, 10), p.score, p.reason].map(csvCell).join(','))].join('\n') + '\n')
log(`Shortlist: ${csvPath}`)

const FAILED = /error|fail|invalid|rejected/i
let added = 0
const addFailures = []
if (!values['dry-run'] && picks.length > 0) {
  const client = mcpClient({ url: process.env.JOBSYNC_MCP_URL, token: process.env.JOBSYNC_MCP_TOKEN })
  await client.init()
  for (let i = 0; i < picks.length; i += BATCH) {
    const batch = picks.slice(i, i + BATCH).map((p) => ({
      company: p.company, jobTitle: p.title, jobDescription: (p.description || 'N/A').slice(0, 15000),
      location: String(p.location ?? '').slice(0, 200), source: new URL(p.url).hostname, jobType: 'Full-time',
      status: 'new', applied: false, jobUrl: p.url, tags: p.skills.slice(0, 10), upsert: true,
    }))
    try {
      const items = (await client.addJobs(batch)).split(/(?=\[\d+\/\d+\] )/).filter((s) => s.trim())
      for (const item of items) {
        if (FAILED.test(item)) addFailures.push(item.slice(0, 200))
        else added++
      }
    } catch (error) {
      addFailures.push(`batch ${i / BATCH + 1}: ${String(error.message).slice(0, 200)}`)
    }
  }
}
log(values['dry-run'] ? 'Dry run: nothing added to JobSync.' : `Added to JobSync: ${added} (status New).`)
for (const f of addFailures) log(`  Not added: ${f}`)
for (const f of failures) log(`  Source failed: ${f.company}: ${f.error}`)

if (values.dump) {
  const data = dumpData()
  writeFileSync(values.dump, JSON.stringify(data), { mode: 0o600 })
  chmodSync(values.dump, 0o600)
  log(`JobSync jobs for the importer: ${data.Job.length} written to ${values.dump}.`)
}
process.exit(addFailures.length > 0 ? 1 : 0)
