import assert from 'node:assert/strict'
import { chmodSync, closeSync, fstatSync, mkdirSync, openSync, readFileSync, utimesSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { BackupError, DESCRIPTION_MAX_CHARS, htmlToText, loadBackup, readJobs, resolveBackupPath } from '../src/backup.mjs'
import { readEntry, ZipError } from '../src/zip.mjs'
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
  // Contents and modification time from one handle, so both describe the same file.
  const snapshot = () => {
    const fd = openSync(path, 'r')
    try {
      return { bytes: readFileSync(fd), mtime: fstatSync(fd).mtimeMs }
    } finally {
      closeSync(fd)
    }
  }
  const before = snapshot()
  readJobs(loadBackup(resolveBackupPath(path)).data)
  const after = snapshot()
  assert.ok(after.bytes.equals(before.bytes))
  assert.equal(after.mtime, before.mtime)
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

// ── hostile input ───────────────────────────────────────────────────────────

/** Runs fn and fails if it takes longer than the budget (the old code took a minute on these). */
function within(ms, fn) {
  const started = performance.now()
  const result = fn()
  const took = performance.now() - started
  assert.ok(took < ms, `took ${Math.round(took)} ms, budget ${ms} ms`)
  return result
}

test('htmlToText stays fast on input built to make tag matching backtrack', () => {
  const size = 400_000
  for (const [what, input] of [
    ['stray "<"', '<'.repeat(size)],
    ['unclosed tags', '<a '.repeat(size / 3)],
    ['unclosed <script>', '<script>'.repeat(size / 8)],
    ['unclosed <style> with attributes', '<style x="'.repeat(size / 10)],
    ['closed tags, many', '<b>x</b>'.repeat(size / 8)],
    ['"<" then a late ">"', `${'<'.repeat(size)}>`],
    ['ampersands', '&'.repeat(size)],
    ['long entity names', `&${'a'.repeat(size)};`],
    ['digits', `&#${'9'.repeat(size)};`],
    ['white space', ' \n\t'.repeat(size / 3)],
  ]) {
    const text = within(1000, () => htmlToText(input))
    assert.ok(text.length <= DESCRIPTION_MAX_CHARS, what)
  }
})

test('htmlToText reads only the first part of an enormous description', () => {
  const text = htmlToText(`Java ${'x'.repeat(DESCRIPTION_MAX_CHARS)} Kubernetes`)
  assert.ok(text.startsWith('Java x'))
  assert.ok(!text.includes('Kubernetes'))
  assert.equal(text.length, DESCRIPTION_MAX_CHARS)
})

test('htmlToText: a "<" with no ">" after it is text; script and style content is dropped only when closed', () => {
  assert.equal(htmlToText('salary < 200k'), 'salary < 200k')
  assert.equal(htmlToText('<p>Java</p> and 3 < 4'), 'Java and 3 < 4')
  assert.equal(htmlToText('a <b>bold</b> c'), 'a bold c')
  assert.equal(htmlToText('x<br/>y'), 'x y')
  assert.equal(htmlToText('a<SCRIPT type="x">var Kafka = 1</ScRiPt >b'), 'a b')
  assert.equal(htmlToText('a<style>.k8s{}</style>b<style>.x{}</style>c'), 'a b c')
  // Unclosed: only the tag goes, as for any other tag.
  assert.equal(htmlToText('a<script>Kafka'), 'a Kafka')
  // Not a script tag at all.
  assert.equal(htmlToText('<scripted>Kafka</scripted>'), 'Kafka')
  assert.equal(htmlToText('<script>x</script'), '')
})

test('htmlToText: an entity name is looked up, never resolved through the object prototype', () => {
  assert.equal(htmlToText('&constructor; &toString; &__proto__; &hasOwnProperty;'), '&constructor; &toString; &__proto__; &hasOwnProperty;')
  assert.equal(htmlToText('R&amp;D &LT;tag&GT; &unknown; &#65;&#0;'.replace('&#0;', '')), 'R&D <tag> &unknown; A')
})

/** Rewrites the uncompressed-size field of one entry in the zip's directory. */
function withDeclaredSize(zip, name, size) {
  const copy = Buffer.from(zip)
  const at = copy.indexOf(Buffer.concat([Buffer.from([0x50, 0x4b, 0x01, 0x02])]))
  let offset = at
  while (offset >= 0) {
    const nameLength = copy.readUInt16LE(offset + 28)
    if (copy.toString('utf8', offset + 46, offset + 46 + nameLength) === name) {
      copy.writeUInt32LE(size, offset + 24)
      return copy
    }
    offset = copy.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), offset + 4)
  }
  throw new Error(`no entry ${name}`)
}

test('a zip entry whose size is not what the archive declares is refused', () => {
  const content = JSON.stringify({ hello: 'world' })
  for (const method of [0, 8]) {
    const zip = makeZip({ 'data.json': content }, { method })
    assert.equal(readEntry(zip, 'data.json', 1000).toString(), content)
    for (const declared of [content.length - 1, content.length + 1, 0]) {
      assert.throws(() => readEntry(withDeclaredSize(zip, 'data.json', declared), 'data.json', 1000), ZipError, `method ${method}, declared ${declared}`)
    }
  }
  // And through the backup reader: reported as "not a backup", not a crash.
  const dir = tempDir()
  const path = join(dir, 'lying.zip')
  const good = makeZip({ 'manifest.json': JSON.stringify(makeManifest()), 'data.json': JSON.stringify(makeData(JOBS)) }, { method: 0 })
  writeFileSync(path, withDeclaredSize(good, 'data.json', 5))
  assert.equal(kindOf(() => loadBackup(path)), 'not_a_backup')
})

test('a manifest that is not an object fails the version check instead of skipping it', () => {
  const dir = tempDir()
  for (const [name, manifest] of [
    ['null.zip', 'null'],
    ['number.zip', '1'],
    ['text.zip', '"1"'],
    ['list.zip', '[]'],
  ]) {
    const path = join(dir, name)
    writeFileSync(path, makeZip({ 'manifest.json': manifest, 'data.json': JSON.stringify(makeData(JOBS)) }))
    assert.equal(kindOf(() => loadBackup(path)), 'schema', name)
  }
})
