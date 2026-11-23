// A minimal, read-only zip reader: enough to pull two JSON files out of a JobSync
// backup without a dependency. It reads the central directory, then inflates only the
// entry asked for. Zip64, encryption and multi-disk archives are refused, not guessed at.

import { inflateRawSync } from 'node:zlib'

export class ZipError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ZipError'
  }
}

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50
const LOCAL_SIGNATURE = 0x04034b50
const EOCD_MIN_SIZE = 22
const MAX_COMMENT = 0xffff

/**
 * Lists the entries of a zip held in memory.
 * @param {Buffer} buffer
 * @returns {Map<string, {name: string, method: number, flags: number, compressedSize: number, size: number, localOffset: number}>}
 */
export function listEntries(buffer) {
  if (buffer.length < EOCD_MIN_SIZE) throw new ZipError('The file is too small to be a zip archive.')

  // The end-of-central-directory record sits at the end, before an optional comment.
  let eocd = -1
  const stop = Math.max(0, buffer.length - EOCD_MIN_SIZE - MAX_COMMENT)
  for (let i = buffer.length - EOCD_MIN_SIZE; i >= stop; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i
      break
    }
  }
  if (eocd < 0) {
    throw new ZipError('The file is not a complete zip archive (no end record). A download may have been cut short.')
  }

  const count = buffer.readUInt16LE(eocd + 10)
  const directorySize = buffer.readUInt32LE(eocd + 12)
  const directoryOffset = buffer.readUInt32LE(eocd + 16)
  if (count === 0xffff || directoryOffset === 0xffffffff || directorySize === 0xffffffff) {
    throw new ZipError('Zip64 archives are not supported.')
  }
  if (directoryOffset + directorySize > eocd) throw new ZipError('The zip directory is damaged.')

  const entries = new Map()
  let at = directoryOffset
  for (let i = 0; i < count; i++) {
    if (at + 46 > buffer.length || buffer.readUInt32LE(at) !== CENTRAL_SIGNATURE) {
      throw new ZipError('The zip directory is damaged.')
    }
    const flags = buffer.readUInt16LE(at + 8)
    const method = buffer.readUInt16LE(at + 10)
    const compressedSize = buffer.readUInt32LE(at + 20)
    const size = buffer.readUInt32LE(at + 24)
    const nameLength = buffer.readUInt16LE(at + 28)
    const extraLength = buffer.readUInt16LE(at + 30)
    const commentLength = buffer.readUInt16LE(at + 32)
    const localOffset = buffer.readUInt32LE(at + 42)
    const name = buffer.toString('utf8', at + 46, at + 46 + nameLength)
    entries.set(name, { name, method, flags, compressedSize, size, localOffset })
    at += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

/**
 * Returns one entry's bytes, or null when the archive has no such entry.
 * @param {Buffer} buffer
 * @param {string} name
 * @param {number} maxBytes refuse an entry that would inflate past this
 */
export function readEntry(buffer, name, maxBytes) {
  const entry = listEntries(buffer).get(name)
  if (!entry) return null
  if (entry.flags & 0x1) throw new ZipError(`"${name}" is encrypted, which is not supported.`)
  if (entry.size > maxBytes) {
    throw new ZipError(`"${name}" is ${entry.size} bytes uncompressed, over the ${maxBytes} byte limit.`)
  }

  const at = entry.localOffset
  if (at + 30 > buffer.length || buffer.readUInt32LE(at) !== LOCAL_SIGNATURE) {
    throw new ZipError(`The zip entry "${name}" is damaged.`)
  }
  // The local header repeats the name and has its own extra field, whose length may differ.
  const start = at + 30 + buffer.readUInt16LE(at + 26) + buffer.readUInt16LE(at + 28)
  const end = start + entry.compressedSize
  if (end > buffer.length) throw new ZipError(`The zip entry "${name}" is cut short.`)
  const raw = buffer.subarray(start, end)

  if (entry.method === 0) {
    // Stored means not compressed, so the two sizes are the same number or the directory lies.
    if (entry.compressedSize !== entry.size) throw new ZipError(`The zip entry "${name}" is damaged (its sizes disagree).`)
    return Buffer.from(raw)
  }
  if (entry.method !== 8) throw new ZipError(`"${name}" uses compression method ${entry.method}, which is not supported.`)
  let data
  try {
    // maxOutputLength guards against a size field that understates the real output.
    data = inflateRawSync(raw, { maxOutputLength: maxBytes })
  } catch {
    throw new ZipError(`The zip entry "${name}" could not be decompressed.`)
  }
  if (data.length !== entry.size) throw new ZipError(`The zip entry "${name}" is damaged (it is not the size the archive declares).`)
  return data
}
