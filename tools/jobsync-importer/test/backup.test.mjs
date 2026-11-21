import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { BackupError, htmlToText, loadBackup, readJobs, resolveBackupPath } from '../src/backup.mjs'
import { JOBS, makeData, makeManifest, makeZip, tempDir, writeBackup } from './helpers.mjs'

const kindOf = (fn) => {
  try {
    fn()
  } catch (error) {
    assert.ok(error instanceof BackupError, `expected a BackupError, got ${error}`)
    return error.kind
  }
  assert.fail('expected a BackupError')
}

test('reads a backup zip: jobs joined to title, company and tags, HTML removed', () => {
  const path = writeBackup(tempDir(), JOBS)
  const backup = loadBackup(path)
  assert.equal(backup.manifest.appVersion, '1.2.1')
  const { jobs, malformed } = readJobs(backup.data)
  assert.equal(malformed, 0)
  assert.equal(jobs.length, 6)
  assert.deepEqual(jobs[0], {
    id: 'job-1',
    title: 'Senior Software Engineer',
    company: 'Northwind Financial Group',
    description: 'Java, Kubernetes and Kafka. Python a plus.',
    tags: [],
    status: 'applied',
    discoveryStatus: null,
  })
  assert.deepEqual(jobs[2].tags, ['AWS'])
})

test('reads a zip whose entries are stored uncompressed, and a bare data.json', () => {
  const dir = tempDir()
  const stored = writeBackup(dir, JOBS, { method: 0 })
  assert.equal(readJobs(loadBackup(stored).data).jobs.length, 6)

  const json = join(dir, 'data.json')
  writeFileSync(json, JSON.stringify(makeData(JOBS)))
  const backup = loadBackup(json)
  assert.equal(backup.manifest, null)
  assert.equal(readJobs(backup.data).jobs.length, 6)
})

test('reading leaves the backup untouched', () => {
  const path = writeBackup(tempDir(), JOBS)
  const before = { bytes: readFileSync(path), mtime: statSync(path).mtimeMs }
  readJobs(loadBackup(resolveBackupPath(path)).data)
  assert.ok(readFileSync(path).equals(before.bytes))
  assert.equal(statSync(path).mtimeMs, before.mtime)
})

test('a folder means the newest jobsync-backup-*.zip in it', () => {
  const dir = tempDir()
  const older = writeBackup(dir, JOBS, { name: 'jobsync-backup-2026-11-06.zip' })
  const newer = writeBackup(dir, JOBS, { name: 'jobsync-backup-2026-11-13.zip' })
  utimesSync(older, new Date('2026-11-06'), new Date('2026-11-06'))
  utimesSync(newer, new Date('2026-11-13'), new Date('2026-11-13'))
  // Not candidates: a half-finished download, another zip, and a folder with a matching name.
  writeFileSync(join(dir, 'jobsync-backup-2026-11-20.zip.crdownload'), 'partial')
  writeFileSync(join(dir, 'holiday-photos.zip'), 'x')
  mkdirSync(join(dir, 'jobsync-backup-folder.zip'))
  assert.equal(resolveBackupPath(dir), newer)
  assert.equal(resolveBackupPath(older), older)
})

test('a missing file, a missing folder and a folder with no backup are reported as missing', () => {
  const dir = tempDir()
  assert.equal(kindOf(() => resolveBackupPath(join(dir, 'nope.zip'))), 'missing')
  assert.equal(kindOf(() => resolveBackupPath(join(dir, 'no-folder', 'x'))), 'missing')
  assert.equal(kindOf(() => resolveBackupPath(dir)), 'missing')
  assert.equal(kindOf(() => loadBackup(join(dir, 'nope.zip'))), 'missing')
})

test('a file that cannot be opened is reported as unreadable', { skip: process.getuid?.() === 0 }, () => {
  const path = writeBackup(tempDir(), JOBS)
  chmodSync(path, 0o000)
  try {
    assert.equal(kindOf(() => loadBackup(path)), 'unreadable')
  } finally {
    chmodSync(path, 0o600)
  }
})

test('files that are not a JobSync backup are refused with a reason', () => {
  const dir = tempDir()
  const write = (name, content) => {
    const path = join(dir, name)
    writeFileSync(path, content)
    return path
  }
  const good = readFileSync(writeBackup(dir, JOBS))

  assert.equal(kindOf(() => loadBackup(write('empty.zip', ''))), 'not_a_backup')
  // A download cut short: the zip's end record is gone.
  assert.equal(kindOf(() => loadBackup(write('cut.zip', good.subarray(0, good.length - 40)))), 'not_a_backup')
  assert.equal(kindOf(() => loadBackup(write('other.zip', makeZip({ 'readme.txt': 'hello' })))), 'not_a_backup')
  assert.equal(kindOf(() => loadBackup(write('jobs.csv', 'index,createdAt,Company\n1,2026-11-01,Acme'))), 'not_a_backup')
  assert.equal(
    kindOf(() => loadBackup(write('badjson.zip', makeZip({ 'manifest.json': '{', 'data.json': '{}' })))),
    'not_a_backup',
  )
})

test('a backup in a layout this tool does not know is refused, not half-read', () => {
  const dir = tempDir()
  const zip = (name, manifest, data) => {
    const path = join(dir, name)
    writeFileSync(path, makeZip({ 'manifest.json': JSON.stringify(manifest), 'data.json': JSON.stringify(data) }))
    return path
  }
  assert.equal(kindOf(() => loadBackup(zip('v2.zip', makeManifest({ formatVersion: 2 }), makeData(JOBS)))), 'schema')
  assert.equal(kindOf(() => loadBackup(zip('nover.zip', {}, makeData(JOBS)))), 'schema')

  const { Job: _dropped, ...withoutJobs } = makeData(JOBS)
  assert.equal(kindOf(() => loadBackup(zip('nojobs.zip', makeManifest(), withoutJobs))), 'schema')
  assert.equal(kindOf(() => loadBackup(zip('list.zip', makeManifest(), []))), 'schema')
  assert.equal(kindOf(() => loadBackup(zip('tags.zip', makeManifest(), { ...makeData(JOBS), Tag: 'x' }))), 'schema')

  // Every job row lacks the columns the tool needs: the layout has changed.
  const renamed = makeData(JOBS)
  renamed.Job = renamed.Job.map(({ jobTitleId, ...rest }) => ({ ...rest, titleId: jobTitleId }))
  assert.equal(kindOf(() => readJobs(renamed)), 'schema')
})

test('single unusable rows are skipped and counted; no jobs at all is not an error', () => {
  const data = makeData(JOBS)
  data.Job[0].companyId = 'no-such-company'
  data.Job[1].description = null
  data.Job.push(null)
  const { jobs, malformed } = readJobs(data)
  assert.equal(malformed, 3)
  assert.equal(jobs.length, 4)

  assert.deepEqual(readJobs(makeData([])), { jobs: [], malformed: 0 })
})

test('htmlToText keeps the words and decodes common entities', () => {
  assert.equal(htmlToText('<ul><li>C#&nbsp;&amp; .NET</li><li>R&#38;D</li></ul><script>alert(1)</script>'), 'C# & .NET R&D')
  assert.equal(htmlToText('plain text'), 'plain text')
})
