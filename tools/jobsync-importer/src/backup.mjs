// Reads a JobSync "Data Backup" (Settings → Data → Download backup) and returns the
// tracked jobs in a plain shape. Read-only: the file is opened for reading and nothing is
// written anywhere.
//
// Format (JobSync 1.2.1, backup format version 1, src/lib/backup/ in its repository):
// a zip holding manifest.json and data.json. data.json has one array per table; a Job row
// points at its title and company by id, and its tags travel as id pairs in _JobToTag.

import { closeSync, fstatSync, openSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { readEntry, ZipError } from './zip.mjs'

export const SUPPORTED_FORMAT_VERSION = 1
/** The whole file is read into memory; a backup also carries uploaded resume files. */
const MAX_FILE_BYTES = 512 * 1024 * 1024
const MAX_DATA_JSON_BYTES = 256 * 1024 * 1024
const MAX_MANIFEST_BYTES = 1024 * 1024
const BACKUP_NAME = /^jobsync-backup-.*\.zip$/i

/** A problem with the backup the owner can act on. `kind` is stable; `message` is for people. */
export class BackupError extends Error {
  /** @param {'missing'|'unreadable'|'not_a_backup'|'schema'} kind */
  constructor(kind, message) {
    super(message)
    this.name = 'BackupError'
    this.kind = kind
  }
}

function fileProblem(path, error) {
  switch (error?.code) {
    case 'ENOENT':
    case 'ENOTDIR':
      return new BackupError('missing', `There is no JobSync backup at ${path}.`)
    case 'EACCES':
    case 'EPERM':
      return new BackupError(
        'unreadable',
        `${path} cannot be read (permission denied). On a Mac, a scheduled job needs access to the folder, ` +
          'or keep the backup outside Downloads, Desktop and Documents.',
      )
    case 'EBUSY':
    case 'EAGAIN':
    case 'ETXTBSY':
      return new BackupError('unreadable', `${path} is in use by another program. Try again when the download or copy has finished.`)
    default:
      return new BackupError('unreadable', `${path} could not be read (${error?.code ?? error?.message ?? 'unknown error'}).`)
  }
}

/**
 * Turns the configured location into one file. A directory means "the newest
 * jobsync-backup-*.zip in it" (the name JobSync gives a download), so a weekly run picks
 * up the latest download without the path changing.
 * @param {string} location a .zip, a data.json, or a directory
 */
export function resolveBackupPath(location) {
  let stats
  try {
    stats = statSync(location)
  } catch (error) {
    throw fileProblem(location, error)
  }
  if (!stats.isDirectory()) return location

  let names
  try {
    names = readdirSync(location)
  } catch (error) {
    throw fileProblem(location, error)
  }
  let newest = null
  for (const name of names) {
    if (!BACKUP_NAME.test(name)) continue
    const path = join(location, name)
    let modified
    try {
      const s = statSync(path)
      if (!s.isFile()) continue
      modified = s.mtimeMs
    } catch {
      continue // Vanished or unreadable between listing and stat: not a candidate.
    }
    if (!newest || modified > newest.modified) newest = { path, modified }
  }
  if (!newest) {
    throw new BackupError(
      'missing',
      `No jobsync-backup-*.zip in ${location}. In JobSync, open Settings → Data and click "Download backup".`,
    )
  }
  return newest.path
}

function parseJson(text, what) {
  try {
    return JSON.parse(text)
  } catch {
    throw new BackupError('not_a_backup', `${what} is not valid JSON.`)
  }
}

/**
 * Loads a backup zip, or a data.json taken out of one.
 * @param {string} path
 * @returns {{path: string, manifest: {formatVersion: number, appVersion?: string, exportedAt?: string} | null, data: Record<string, unknown>}}
 */
export function loadBackup(path) {
  let bytes
  let fd = null
  try {
    // One read-only handle for both the size check and the read, so the file that is
    // measured is the file that is loaded even if the path is replaced in between.
    fd = openSync(path, 'r')
    if (fstatSync(fd).size > MAX_FILE_BYTES) {
      throw new BackupError('unreadable', `${path} is larger than ${MAX_FILE_BYTES} bytes; refusing to load it.`)
    }
    bytes = readFileSync(fd)
  } catch (error) {
    if (error instanceof BackupError) throw error
    throw fileProblem(path, error)
  } finally {
    if (fd !== null) closeSync(fd)
  }
  if (bytes.length === 0) throw new BackupError('not_a_backup', `${path} is empty.`)

  // "PK" opens every zip; anything else is treated as a data.json.
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b
  let manifest = null
  let data
  if (isZip) {
    let manifestBytes
    let dataBytes
    try {
      manifestBytes = readEntry(bytes, 'manifest.json', MAX_MANIFEST_BYTES)
      dataBytes = readEntry(bytes, 'data.json', MAX_DATA_JSON_BYTES)
    } catch (error) {
      if (error instanceof ZipError) throw new BackupError('not_a_backup', `${path}: ${error.message}`)
      throw error
    }
    if (!manifestBytes || !dataBytes) {
      throw new BackupError(
        'not_a_backup',
        `${path} is a zip but not a JobSync backup (it has no manifest.json and data.json). ` +
          'Use Settings → Data → Download backup; the jobs CSV export will not do, it has no job descriptions.',
      )
    }
    manifest = parseJson(manifestBytes.toString('utf8'), 'manifest.json')
    data = parseJson(dataBytes.toString('utf8'), 'data.json')
  } else {
    data = parseJson(bytes.toString('utf8'), path)
  }

  if (manifest !== null) {
    const version = manifest?.formatVersion
    if (version !== SUPPORTED_FORMAT_VERSION) {
      throw new BackupError(
        'schema',
        `This backup uses format version ${JSON.stringify(version)}; this tool understands version ${SUPPORTED_FORMAT_VERSION}. ` +
          'JobSync has changed its backup format: the tool needs updating before it can read this file.',
      )
    }
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new BackupError('schema', 'data.json is not the object a JobSync backup holds.')
  }
  for (const group of ['Job', 'JobTitle', 'Company']) {
    if (!Array.isArray(data[group])) {
      throw new BackupError(
        'schema',
        `The backup has no "${group}" list, so it is not the layout this tool expects (JobSync backup format ${SUPPORTED_FORMAT_VERSION}).`,
      )
    }
  }
  for (const group of ['Tag', '_JobToTag']) {
    if (data[group] !== undefined && !Array.isArray(data[group])) {
      throw new BackupError('schema', `The backup's "${group}" is not a list.`)
    }
  }
  return { path, manifest, data }
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** Job descriptions are rich text (HTML). This leaves the words, separated by spaces. */
export function htmlToText(html) {
  return String(html)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Math.min(Number(code), 0x10ffff)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, ' ')
    .trim()
}

const isText = (value) => typeof value === 'string' && value.trim() !== ''

/**
 * @typedef {object} TrackedJob
 * @property {string} id
 * @property {string} title
 * @property {string} company
 * @property {string} description plain text
 * @property {string[]} tags tag labels
 * @property {string} status JobSync's status value, e.g. "applied"
 * @property {string|null} discoveryStatus "new" | "accepted" | "dismissed" for jobs an automation found, else null
 */

/**
 * Joins the Job rows to their titles, companies and tags. A row that cannot be joined
 * or lacks a field is skipped and counted, never guessed at.
 * @param {Record<string, unknown>} data
 * @returns {{jobs: TrackedJob[], malformed: number}}
 */
export function readJobs(data) {
  const labels = (group) => {
    const map = new Map()
    for (const row of data[group] ?? []) {
      if (row && isText(row.id) && isText(row.label)) map.set(row.id, row.label.trim())
    }
    return map
  }
  const titles = labels('JobTitle')
  const companies = labels('Company')
  const tags = labels('Tag')

  const tagsByJob = new Map()
  for (const link of data._JobToTag ?? []) {
    const label = link && tags.get(link.tagId)
    if (!label || !isText(link.jobId)) continue
    if (!tagsByJob.has(link.jobId)) tagsByJob.set(link.jobId, [])
    tagsByJob.get(link.jobId).push(label)
  }

  const jobs = []
  let malformed = 0
  for (const row of data.Job) {
    const title = row && titles.get(row.jobTitleId)
    const company = row && companies.get(row.companyId)
    if (!row || !isText(row.id) || !title || !company || typeof row.description !== 'string') {
      malformed++
      continue
    }
    jobs.push({
      id: row.id,
      title,
      company,
      description: htmlToText(row.description),
      tags: tagsByJob.get(row.id) ?? [],
      status: isText(row.statusValue) ? row.statusValue.trim().toLowerCase() : '',
      discoveryStatus: isText(row.discoveryStatus) ? row.discoveryStatus.trim().toLowerCase() : null,
    })
  }
  if (data.Job.length > 0 && jobs.length === 0) {
    throw new BackupError(
      'schema',
      `None of the ${data.Job.length} job rows has the fields this tool expects (id, jobTitleId, companyId, description). ` +
        'JobSync may have changed its backup layout.',
    )
  }
  return { jobs, malformed }
}
