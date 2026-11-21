// Test helpers: a synthetic JobSync backup, a tiny zip writer, and a mock of the site's API.
// Every company, job and credential here is made up.

import { createServer } from 'node:http'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { crc32, deflateRawSync } from 'node:zlib'

export const tempDir = () => mkdtempSync(join(tmpdir(), 'jobsync-importer-test-'))

/**
 * Builds a zip in memory.
 * @param {Record<string, string|Buffer>} files
 * @param {{method?: 0|8}} [options] 8 = deflate (what JobSync writes), 0 = stored
 */
export function makeZip(files, { method = 8 } = {}) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content)
    const nameBytes = Buffer.from(name, 'utf8')
    const stored = method === 8 ? deflateRawSync(data) : data
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(crc32(data), 14)
    local.writeUInt32LE(stored.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    locals.push(local, nameBytes, stored)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt32LE(crc32(data), 16)
    central.writeUInt32LE(stored.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBytes)
    offset += local.length + nameBytes.length + stored.length
  }
  const directory = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}

/**
 * A data.json in JobSync's backup layout (format version 1) from a short job list.
 * @param {{title: string, company: string, description?: string, tags?: string[], status?: string, discoveryStatus?: string|null}[]} jobs
 */
export function makeData(jobs) {
  const ids = (prefix) => {
    const map = new Map()
    return {
      map,
      id(label) {
        if (!map.has(label)) map.set(label, `${prefix}-${map.size + 1}`)
        return map.get(label)
      },
      rows: () => [...map].map(([label, id]) => ({ id, label, value: label.toLowerCase() })),
    }
  }
  const titles = ids('title')
  const companies = ids('company')
  const tags = ids('tag')
  const jobToTag = []
  const rows = jobs.map((job, index) => {
    const id = `job-${index + 1}`
    for (const tag of job.tags ?? []) jobToTag.push({ jobId: id, tagId: tags.id(tag) })
    return {
      id,
      jobUrl: null,
      description: job.description ?? '',
      jobType: 'FT',
      workplaceType: null,
      createdAt: '2026-11-10T15:00:00.000Z',
      applied: true,
      appliedDate: '2026-11-11T15:00:00.000Z',
      dueDate: null,
      statusValue: job.status ?? 'applied',
      jobTitleId: titles.id(job.title),
      companyId: companies.id(job.company),
      jobSourceId: null,
      salaryRange: null,
      locationId: null,
      resumeId: null,
      coverLetterId: null,
      automationId: null,
      matchScore: null,
      matchData: null,
      discoveryStatus: job.discoveryStatus ?? null,
      discoveredAt: null,
      createdVia: null,
      descriptionCompleteness: null,
    }
  })
  return {
    Company: companies.rows().map((c) => ({ ...c, logoUrl: null, industry: null })),
    JobTitle: titles.rows(),
    Tag: tags.rows(),
    Job: rows,
    _JobToTag: jobToTag,
    jobStatuses: [{ label: 'Applied', value: 'applied' }],
    user: { defaultResumeId: null },
  }
}

export const makeManifest = (overrides = {}) => ({
  formatVersion: 1,
  appVersion: '1.2.1',
  exportedAt: '2026-11-20T15:00:00.000Z',
  sourceEmail: 'someone@example.com',
  counts: {},
  ...overrides,
})

/** Writes a backup zip into `dir` and returns its path. */
export function writeBackup(dir, jobs, { name = 'jobsync-backup-2026-11-20.zip', manifest = makeManifest(), method = 8 } = {}) {
  const path = join(dir, name)
  writeFileSync(path, makeZip({ 'manifest.json': JSON.stringify(manifest), 'data.json': JSON.stringify(makeData(jobs)) }, { method }))
  return path
}

/** Two made-up firms, both flags true, and one that must never match. */
export const ALLOWLIST = {
  companies: [
    { name: 'Northwind Financial Group', aliases: ['Northwind Securities LLC'], fortune500: true, finraRegulated: true },
    { name: 'Meridian Capital & Co.', fortune500: true, finraRegulated: true },
    { name: 'Halfway Holdings', fortune500: true, finraRegulated: false },
  ],
}

/** Six tracked jobs: four match the targets, two do not. */
export const JOBS = [
  { title: 'Senior Software Engineer', company: 'Northwind Financial Group', description: '<p>Java, <b>Kubernetes</b> and Kafka. Python a plus.</p>' },
  { title: 'Software Developer II', company: 'Northwind Securities LLC', description: 'Java and Kubernetes (K8s) on AWS; Python scripting.' },
  { title: 'Forward-Deployed Engineer', company: 'Meridian Capital and Co', description: 'Python, SQL, Kubernetes.', tags: ['AWS'] },
  { title: 'Backend Engineer', company: 'MERIDIAN CAPITAL & CO.', description: 'Java services, Terraform.' },
  { title: 'Software Engineer', company: 'Unlisted Startup Inc', description: 'Rust, Kubernetes, Terraform.' },
  { title: 'Product Manager', company: 'Northwind Financial Group', description: 'Kubernetes roadmap.' },
]

export const PROFILE = {
  id: 1,
  name: 'Test Owner',
  techStack: ['Java', 'Spring Boot', 'Kafka'],
  skills: [
    { name: 'Java', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'Kafka', category: 'Backend' },
  ],
}

/**
 * A mock of the site's API on 127.0.0.1. `routes` maps "METHOD /path" to a handler
 * `(request) => ({status, body?, headers?})`; a handler may also be a list of answers,
 * used one per call (the last one repeats). Every request is recorded in `requests`.
 */
export async function mockApi(routes) {
  const requests = []
  const calls = new Map()
  const table = new Map(Object.entries(routes))
  const server = createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      const key = `${req.method} ${req.url}`
      const request = { method: req.method, url: req.url, key, headers: req.headers, text, body: text ? JSON.parse(text) : undefined }
      requests.push(request)
      // A Map lookup: the key comes from the request, and must only ever find a route
      // the test defined, never something inherited from Object.prototype.
      let route = table.get(key)
      if (Array.isArray(route)) {
        const n = calls.get(key) ?? 0
        calls.set(key, n + 1)
        route = route[Math.min(n, route.length - 1)]
      }
      const answer = typeof route === 'function' ? route(request) : (route ?? { status: 404, body: { error: 'no such route' } })
      if (answer.hang) return // never answers: for timeout tests
      const payload = answer.raw ?? (answer.body === undefined ? '' : JSON.stringify(answer.body))
      res.writeHead(answer.status, { 'Content-Type': 'application/json', ...(answer.headers ?? {}) })
      res.end(payload)
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    requests,
    count: (key) => requests.filter((r) => r.key === key).length,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections()
        server.close(resolve)
      }),
  }
}
