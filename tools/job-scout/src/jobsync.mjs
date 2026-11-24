// Talks to the local JobSync: its MCP server to add jobs, and its database (through
// `docker compose exec`, so no database port is published) to read what is already there.
// The MCP token is held in memory only and never printed.

import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const BATCH = 10 // JobSync's MCP_BATCH_MAX_ITEMS

/** Minimal MCP (streamable HTTP) client for JobSync's /api/mcp. */
export function mcpClient({ url = 'http://localhost:3737/api/mcp', token, fetchImpl = fetch }) {
  if (!token) throw new Error('No JobSync MCP token (set JOBSYNC_MCP_TOKEN).')
  let id = 0
  let session = null
  async function send(method, params, notify = false) {
    const body = { jsonrpc: '2.0', method, ...(params ? { params } : {}), ...(notify ? {} : { id: ++id }) }
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${token}`, ...(session ? { 'mcp-session-id': session } : {}) },
      body: JSON.stringify(body),
      redirect: 'manual',
      signal: AbortSignal.timeout(180_000),
    })
    session = res.headers.get('mcp-session-id') ?? session
    const text = await res.text()
    if (res.status === 401) throw new Error('JobSync refused the MCP token (401). Create a new one in Settings → MCP Access.')
    if (!res.ok && !notify) throw new Error(`JobSync MCP answered HTTP ${res.status}.`)
    if (notify) return null
    if (text.trim().startsWith('{')) return JSON.parse(text)
    const messages = text.split('\n').filter((l) => l.startsWith('data:')).map((l) => JSON.parse(l.slice(5)))
    return messages.at(-1) ?? {}
  }
  return {
    async init() {
      const r = await send('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'job-scout', version: '1' } })
      if (r.error) throw new Error(`MCP initialize failed: ${r.error.message}`)
      await send('notifications/initialized', null, true)
    },
    /** Adds up to BATCH jobs; returns JobSync's per-item text report. */
    async addJobs(jobs) {
      const r = await send('tools/call', { name: 'add_jobs_batch', arguments: { jobs } })
      if (r.error) throw new Error(r.error.message)
      const text = (r.result?.content ?? []).map((c) => c.text).join('\n')
      if (r.result?.isError) throw new Error(text.slice(0, 300))
      return text
    },
  }
}

/** Runs SQL in JobSync's database container and returns stdout. */
export function psql(sql, { dir = process.env.JOBSYNC_DIR ?? join(homedir(), 'Developer', 'jobsync'), exec = execFileSync } = {}) {
  return exec('docker', ['compose', 'exec', '-T', 'db', 'psql', '-U', 'jobsync', '-d', 'jobsync', '-tA', '-v', 'ON_ERROR_STOP=1'], {
    cwd: dir, input: sql, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
  })
}

/** Every job URL already in JobSync, so a re-run never adds a posting twice. */
export function existingUrls(opts) {
  const out = psql('select coalesce(json_agg("jobUrl"), \'[]\') from "Job" where "jobUrl" is not null;', opts)
  return new Set(JSON.parse(out.trim() || '[]'))
}

/**
 * The tracked jobs in the shape of a JobSync backup's data.json (the tables and fields
 * tools/jobsync-importer reads), so the importer can run without a manual download.
 * Prisma's implicit _JobToTag table keeps the job id in "A" and the tag id in "B".
 */
export const DUMP_SQL = `select json_build_object(
  'Job', (select coalesce(json_agg(json_build_object('id', j.id, 'jobTitleId', j."jobTitleId", 'companyId', j."companyId",
           'description', coalesce(j.description, ''), 'statusValue', s.value, 'discoveryStatus', j."discoveryStatus")), '[]')
         from "Job" j left join "JobStatus" s on s.id = j."statusId"),
  'JobTitle', (select coalesce(json_agg(json_build_object('id', id, 'label', label)), '[]') from "JobTitle"),
  'Company', (select coalesce(json_agg(json_build_object('id', id, 'label', label)), '[]') from "Company"),
  'Tag', (select coalesce(json_agg(json_build_object('id', id, 'label', label)), '[]') from "Tag"),
  '_JobToTag', (select coalesce(json_agg(json_build_object('jobId', "A", 'tagId', "B")), '[]') from "_JobToTag")
);`
export const dumpData = (opts) => JSON.parse(psql(DUMP_SQL, opts).trim())
