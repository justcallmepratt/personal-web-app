// The importer's logic, as pure functions: which tracked jobs count, which skills they
// ask for, what to propose, and the guard that keeps every proposal a question.
//
// The one thing this tool may propose is adding a single skill to the profile's
// techStack list. It never proposes text, never touches experience or projects, and words
// every reason as evidence plus a question. assertSafeSuggestion() enforces that on every
// suggestion before it is printed or sent.

import { createHash } from 'node:crypto'

/** A data file that is not usable. The message says which file and why. */
export class ConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigError'
  }
}

/** A suggestion that breaks the "never assert a claim" rule. A bug if it is ever thrown. */
export class UnsafeSuggestionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UnsafeSuggestionError'
  }
}

export const SOURCE = 'jobsync'
export const REASON_MAX = 500 // SuggestionService.REASON_MAX
export const LIST_MAX_ITEMS = 50 // SuggestionFields.LIST_MAX_ITEMS
export const LIST_ITEM_MAX = 255 // SuggestionFields.SHORT_TEXT_MAX
/** "At most a few per run": the --max option cannot go above this. */
export const MAX_SUGGESTIONS_LIMIT = 5

const isText = (value) => typeof value === 'string' && value.trim() !== ''
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const squash = (text) => text.trim().replace(/\s+/g, ' ')

function textList(value, what) {
  if (!Array.isArray(value) || !value.every(isText)) {
    throw new ConfigError(`${what} must be a list of non-empty text.`)
  }
  return value
}

// ── titles ──────────────────────────────────────────────────────────────────

/** Lower case, with everything that is not a letter or digit turned into one space. */
export function normaliseWords(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** @param {unknown} raw contents of target-titles.json */
export function parseTitleRules(raw) {
  if (!isObject(raw)) throw new ConfigError('The titles file must be an object with "include" and "exclude" lists.')
  const include = textList(raw.include, 'The titles file\'s "include"').map(normaliseWords).filter(Boolean)
  const exclude = textList(raw.exclude ?? [], 'The titles file\'s "exclude"').map(normaliseWords).filter(Boolean)
  if (include.length === 0) throw new ConfigError('The titles file\'s "include" list is empty, so no job could match.')
  return { include, exclude }
}

/** True when the title holds an include phrase as whole words and no exclude phrase. */
export function matchesTitle(title, rules) {
  const padded = ` ${normaliseWords(title)} `
  const has = (phrase) => padded.includes(` ${phrase} `)
  return rules.include.some(has) && !rules.exclude.some(has)
}

// ── companies ───────────────────────────────────────────────────────────────

const LEGAL_SUFFIXES = new Set([
  'inc', 'incorporated', 'corp', 'corporation', 'co', 'company', 'llc', 'lp', 'llp', 'ltd', 'limited', 'plc', 'na',
])

/**
 * A company name reduced to what identifies it: lower case, no punctuation, no leading
 * "the", no trailing legal form. "JPMorgan Chase & Co." and "JPMorgan Chase" agree;
 * nothing looser than that is attempted.
 */
export function normaliseCompany(name) {
  const words = normaliseWords(String(name).replace(/&/g, ' and ').replace(/\b([A-Za-z])\.(?=[A-Za-z]\b)/g, '$1')).split(' ')
  if (words[0] === 'the') words.shift()
  while (words.length > 1 && (LEGAL_SUFFIXES.has(words.at(-1)) || words.at(-1) === 'and')) words.pop()
  return words.join(' ')
}

/**
 * An employer name as the backend's AllowList.java normalises it: lower case, with
 * everything that is not an ASCII letter or digit turned into one space.
 */
export function normaliseEmployer(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0

/** True for an entry written in the backend's format (market/allow-list.json). */
function isBackendEntry(entry) {
  return 'included' in entry || isObject(entry.fortune500) || Array.isArray(entry.finra)
}

/** The backend's evidence rule: a Fortune 500 rank from 1 to 500 and a FINRA firm with a name and a CRD number. */
function hasBackendEvidence(entry) {
  const rank = isObject(entry.fortune500) ? entry.fortune500.rank : undefined
  const ranked = isPositiveInteger(rank) && rank <= 500
  const member = Array.isArray(entry.finra) && entry.finra.some((f) => isObject(f) && isPositiveInteger(f.crd) && isText(f.firm))
  return ranked && member
}

/**
 * Reads an allow-list: `{companies: [...]}` or a bare list. Two entry formats are read,
 * and a company's status is never guessed in either.
 *
 * - The backend's reviewed list (`backend/src/main/resources/market/allow-list.json`),
 *   by the same rule as the backend's AllowList.java: an entry counts only when
 *   `included` is literally true and it has a `fortune500.rank` from 1 to 500, a `finra`
 *   firm with a name and a CRD number, and at least one alias. Its aliases match as whole
 *   words inside an employer name; the company's own `name` is not an alias (a name like
 *   "Block" is too generic). `"included": false` is the list's own decision and is
 *   counted as excluded, not ignored.
 * - This tool's own format: `fortune500` and `finraRegulated` both literally true. The
 *   name and aliases match a whole employer name, ignoring a trailing legal form.
 *
 * Anything else is ignored and counted.
 * @returns {{names: Map<string, string>, phrases: {alias: string, name: string}[], accepted: number, ignored: number, excluded: number}}
 *   `names` maps each normalised whole name or alias (own format) to the entry's display
 *   name; `phrases` are the backend entries' whole-word aliases, in file order
 */
export function parseAllowlist(raw) {
  const entries = Array.isArray(raw) ? raw : isObject(raw) ? raw.companies : undefined
  if (!Array.isArray(entries)) {
    throw new ConfigError('The company allow-list must be a list, or an object with a "companies" list.')
  }
  const names = new Map()
  const phrases = []
  let accepted = 0
  let ignored = 0
  let excluded = 0
  for (const entry of entries) {
    if (!isObject(entry)) {
      ignored++
      continue
    }
    const aliases = Array.isArray(entry.aliases) ? entry.aliases.filter(isText) : []
    if (isBackendEntry(entry)) {
      if (entry.included === false) {
        excluded++
        continue
      }
      const words = [...new Set(aliases.map(normaliseEmployer).filter(Boolean))]
      if (entry.included !== true || !isText(entry.name) || !hasBackendEvidence(entry) || words.length === 0) {
        ignored++
        continue
      }
      for (const alias of words) phrases.push({ alias, name: entry.name.trim() })
      accepted++
      continue
    }
    if (!isText(entry.name) || entry.fortune500 !== true || entry.finraRegulated !== true) {
      ignored++
      continue
    }
    for (const spelling of [entry.name, ...aliases]) {
      const key = normaliseCompany(spelling)
      if (key) names.set(key, entry.name.trim())
    }
    accepted++
  }
  return { names, phrases, accepted, ignored, excluded }
}

/**
 * The allow-listed company an employer name belongs to, or null. A backend entry matches
 * when one of its aliases appears as whole words in the name ("Citi" and "Citi Group"
 * for the alias "citi"; never "Citizens Bank"); an entry in this tool's format matches
 * the whole name only.
 * @param {ReturnType<typeof parseAllowlist>} allowlist
 * @param {string} employer
 * @returns {string | null} the entry's display name
 */
export function matchCompany(allowlist, employer) {
  const whole = allowlist.names.get(normaliseCompany(employer))
  if (whole) return whole
  const padded = ` ${normaliseEmployer(employer)} `
  return allowlist.phrases.find(({ alias }) => padded.includes(` ${alias} `))?.name ?? null
}

// ── which tracked jobs count ────────────────────────────────────────────────

/**
 * Keeps the jobs that match the owner's targets. A job an automation found but the owner
 * has not accepted into the tracker (discoveryStatus "new" or "dismissed") is not a
 * tracked job. Financial services is not tested separately: every company on the
 * allow-list is FINRA-regulated, which is the stricter condition.
 * @param {import('./backup.mjs').TrackedJob[]} jobs
 * @param {{titles: ReturnType<typeof parseTitleRules>, allowlist: ReturnType<typeof parseAllowlist>, excludeStatuses?: string[]}} rules
 */
export function selectJobs(jobs, { titles, allowlist, excludeStatuses = [] }) {
  const excluded = new Set(excludeStatuses.map((s) => s.trim().toLowerCase()))
  const matching = []
  const skipped = { notTracked: 0, status: 0, title: 0, company: 0, duplicate: 0 }
  /** posting key → the matching job already kept for it */
  const kept = new Map()
  /** Companies with a matching title that are not on the allow-list, with how many jobs. */
  const companiesNotListed = new Map()

  for (const job of jobs) {
    const company = matchCompany(allowlist, job.company)
    if (job.discoveryStatus !== null && job.discoveryStatus !== 'accepted') {
      skipped.notTracked++
    } else if (excluded.has(job.status)) {
      skipped.status++
    } else if (!matchesTitle(job.title, titles)) {
      skipped.title++
    } else if (company === null) {
      skipped.company++
      companiesNotListed.set(job.company, (companiesNotListed.get(job.company) ?? 0) + 1)
    } else {
      // The same posting entered twice (same title, company and description) is one
      // job: counting it twice would overstate how often a skill is asked for.
      const key = postingKey(job, company)
      const first = kept.get(key)
      if (first === undefined) {
        const copy = { ...job, tags: [...job.tags] }
        kept.set(key, copy)
        matching.push(copy)
      } else {
        skipped.duplicate++
        for (const tag of job.tags) if (!first.tags.includes(tag)) first.tags.push(tag)
      }
    }
  }
  return { matching, skipped, companiesNotListed }
}

/**
 * Identifies a posting by its normalised title, the allow-listed company it belongs to
 * and a hash of its description.
 */
function postingKey(job, company) {
  const description = createHash('sha256').update(normaliseWords(job.description)).digest('hex')
  return JSON.stringify([normaliseWords(job.title), company, description])
}

// ── skills ──────────────────────────────────────────────────────────────────

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** How a skill is compared: case and spacing do not matter. */
export const skillKey = (text) => squash(String(text)).toLowerCase()

/**
 * @param {unknown} raw contents of skills-dictionary.json
 * @returns {{skills: {name: string, pattern: RegExp}[], canonical: Map<string, string>}}
 *   `canonical` maps the key of every name and alias to the entry's name
 */
export function parseDictionary(raw) {
  if (!isObject(raw) || !Array.isArray(raw.skills)) {
    throw new ConfigError('The skills dictionary must be an object with a "skills" list.')
  }
  const skills = []
  const canonical = new Map()
  for (const entry of raw.skills) {
    if (!isObject(entry) || !isText(entry.name)) {
      throw new ConfigError('Every skill in the dictionary needs a "name".')
    }
    const name = squash(entry.name)
    if (name.length > LIST_ITEM_MAX) throw new ConfigError(`The skill name "${name.slice(0, 40)}…" is longer than ${LIST_ITEM_MAX} characters.`)
    const spellings = [name, ...textList(entry.aliases ?? [], `The aliases of "${name}"`).map(squash)]
    for (const spelling of spellings) {
      const key = skillKey(spelling)
      const owner = canonical.get(key)
      if (owner !== undefined && owner !== name) {
        throw new ConfigError(`"${spelling}" is listed for both "${owner}" and "${name}" in the skills dictionary.`)
      }
      canonical.set(key, name)
    }
    // A match must not sit inside a longer word: "Java" is not found in "JavaScript",
    // "SQL" not in "MySQL". After a match, a "#", or a "+" that does not join the next
    // word, would make it a different name ("C" in "C#" or "C++", "C#" in "C##"), so
    // those are refused too; "React+Redux" and "#python" are found.
    // A spelling that ends in a symbol ("C++", "C#") may be followed by a version number
    // ("C++17"), but not by a letter or by more of the symbol.
    const alternatives = spellings
      .sort((a, b) => b.length - a.length)
      .map((s) => {
        const after = /[\p{L}\p{N}]$/u.test(s) ? '(?![\\p{L}\\p{N}_#]|\\+(?![\\p{L}\\p{N}]))' : '(?![\\p{L}_#+])'
        return `${escapeRegExp(s).replace(/ /g, '\\s+')}${after}`
      })
      .join('|')
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alternatives})`, entry.caseSensitive === true ? 'gu' : 'giu')
    skills.push({ name, pattern })
  }
  if (skills.length === 0) throw new ConfigError('The skills dictionary is empty, so nothing could be found.')
  return { skills, canonical }
}

const FIELD_SEPARATOR = '\u0000'

/**
 * The dictionary skills a job asks for, by name: from its description and its tags.
 * A mention that sits inside a longer mention of another skill does not count: "SQL
 * Server" is Microsoft SQL Server, not also SQL, and "Spring Boot" is not also Spring.
 */
export function extractSkills(job, dictionary) {
  // The description and each tag are separate texts. They are joined by a character that
  // is neither white space nor part of a word, so no mention can span two of them
  // ("Spring" in one tag and "Boot" in the next is not Spring Boot).
  const text = [job.description, ...job.tags].join(FIELD_SEPARATOR)
  const mentions = []
  for (const skill of dictionary.skills) {
    for (const match of text.matchAll(skill.pattern)) {
      mentions.push({ name: skill.name, start: match.index, end: match.index + match[0].length })
    }
  }
  // One sweep, left to right, longest first at the same start: anything that contains a
  // mention has then already been seen. It is enough to remember the two mentions that
  // reach furthest right and belong to different skills, since a container must be of
  // another skill than the mention it contains.
  mentions.sort((a, b) => a.start - b.start || b.end - a.end)
  const contains = (outer, m) =>
    outer !== null && outer.name !== m.name && outer.end >= m.end && outer.end - outer.start > m.end - m.start
  const found = new Set()
  let furthest = null
  let runnerUp = null
  for (const m of mentions) {
    if (!contains(furthest, m) && !contains(runnerUp, m)) found.add(m.name)
    if (furthest === null || m.end > furthest.end) {
      if (furthest !== null && furthest.name !== m.name) runnerUp = furthest
      furthest = m
    } else if (m.name !== furthest.name && (runnerUp === null || m.end > runnerUp.end)) {
      runnerUp = m
    }
  }
  return found
}

// ── the profile ─────────────────────────────────────────────────────────────

/**
 * What the public profile already says. `techStack` is the list a suggestion would
 * extend; `skills` are the names in the skills list. Anything unexpected is an error:
 * comparing against a profile that was misread would produce wrong proposals.
 * @param {unknown} profile body of GET /api/profile
 */
export function readProfile(profile) {
  if (!isObject(profile)) throw new ConfigError('The profile is not a JSON object.')
  const rawStack = profile.techStack ?? []
  if (!Array.isArray(rawStack) || !rawStack.every((item) => typeof item === 'string')) {
    throw new ConfigError('The profile\'s "techStack" is not a list of text.')
  }
  // A suggestion sends the whole list back with one item added, and the API refuses a
  // list with an empty item, so nothing could be proposed against this profile.
  if (!rawStack.every(isText)) {
    throw new ConfigError('The profile\'s "techStack" holds an empty item. Remove it from the profile first; no suggestion can be made against that list.')
  }
  const rawSkills = profile.skills ?? []
  if (!Array.isArray(rawSkills) || !rawSkills.every((s) => isObject(s) && typeof s.name === 'string')) {
    throw new ConfigError('The profile\'s "skills" is not a list of objects with a name.')
  }
  return { techStack: rawStack, skills: rawSkills.map((s) => s.name).filter(isText) }
}

// ── proposals ───────────────────────────────────────────────────────────────

/**
 * @typedef {object} Suggestion
 * @property {'profile'} targetType
 * @property {'techStack'} field
 * @property {string[]} proposedValue the current tech stack plus one item
 * @property {string} reason evidence and a question, never a claim
 * @property {'jobsync'} source
 * @property {string} skill the one item added
 * @property {'ask'|'feature'} kind "ask": not on the profile at all; "feature": already in the skills list
 * @property {number} jobs how many matching jobs ask for it
 * @property {number} of how many matching jobs there are
 */

function reasonFor({ skill, kind, jobs, of, examples }) {
  const evidence = `JobSync: "${skill}" is asked for in ${jobs} of your ${of} tracked ${of === 1 ? 'job' : 'jobs'} that match your targets`
  const question =
    kind === 'feature'
      ? 'It is already in your skills list but not in the profile tech stack. Is it still true of you and worth featuring? Accept only if it is; reject if not.'
      : 'It is not on your profile. Is it true of you? Accept only if you have real experience with it; reject if not.'
  const effect = 'Accepting adds this one item to the profile tech stack and changes nothing else.'
  const shown = examples.length > 0 ? ` (for example ${examples.join('; ')})` : ''
  return `${evidence}${shown}. ${question} ${effect}`
}

/**
 * Control characters turned into spaces: line breaks, escape codes, and the invisible
 * direction and zero-width marks that can reorder or hide text on a screen.
 */
export const withoutControlCharacters = (text) => String(text).replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u2028-\u202e\u2060-\u2069\ufeff]+/g, ' ')

const clip = (text, max) => {
  const clean = withoutControlCharacters(text).replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/**
 * Works out what to propose: skills asked for by at least `minJobs` matching jobs that
 * are not in the profile's tech stack, most asked-for first, at most `max`.
 * @param {{matching: import('./backup.mjs').TrackedJob[], dictionary: ReturnType<typeof parseDictionary>, profile: ReturnType<typeof readProfile>, minJobs: number, max: number}} input
 * @returns {{suggestions: Suggestion[], counts: {skill: string, jobs: number}[], stackFull: boolean, leftOut: {skill: string, why: string}[]}}
 *   `leftOut` lists skills that qualified but cannot be put into a valid suggestion
 */
export function buildSuggestions({ matching, dictionary, profile, minJobs, max }) {
  const canonicalKey = (text) => skillKey(dictionary.canonical.get(skillKey(text)) ?? text)
  const inStack = new Set(profile.techStack.map(canonicalKey))
  /** canonical key → the owner's own spelling in the skills list */
  const inSkills = new Map(profile.skills.map((name) => [canonicalKey(name), squash(name)]))

  const jobsBySkill = new Map()
  for (const job of matching) {
    for (const name of extractSkills(job, dictionary)) {
      if (!jobsBySkill.has(name)) jobsBySkill.set(name, [])
      jobsBySkill.get(name).push(job)
    }
  }
  const counts = [...jobsBySkill]
    .map(([skill, jobs]) => ({ skill, jobs: jobs.length }))
    .sort((a, b) => b.jobs - a.jobs || a.skill.localeCompare(b.skill))

  const stackFull = profile.techStack.length >= LIST_MAX_ITEMS
  const suggestions = []
  const leftOut = []
  if (!stackFull) {
    for (const { skill, jobs } of counts) {
      if (suggestions.length >= Math.min(max, MAX_SUGGESTIONS_LIMIT)) break
      if (jobs < minJobs) break
      const key = canonicalKey(skill)
      if (inStack.has(key)) continue
      const kind = inSkills.has(key) ? 'feature' : 'ask'
      // A skill the owner already lists is proposed in the owner's own spelling.
      const item = kind === 'feature' ? inSkills.get(key) : skill
      if (profile.techStack.includes(item)) continue
      // The spelling can come from the live profile or an edited dictionary, so a name
      // that cannot be proposed is left out and reported; it must not end the run.
      if (item.length > LIST_ITEM_MAX) {
        leftOut.push({ skill: item, why: `its name is longer than the ${LIST_ITEM_MAX} characters a tech-stack item may have` })
        continue
      }
      if (reasonFor({ skill: item, kind, jobs, of: matching.length, examples: [] }).length > REASON_MAX) {
        leftOut.push({ skill: item, why: `its name is too long for a suggestion's reason (${REASON_MAX} characters)` })
        continue
      }
      const examples = jobsBySkill
        .get(skill)
        .slice(0, 2)
        .map((job) => `${clip(job.title, 60)} at ${clip(job.company, 40)}`)
      // Example job titles are a courtesy and come from postings, so they are untrusted
      // text: if they make the reason too long or trip the wording guard, they are
      // dropped. If the reason fails even with no examples (a name that itself reads
      // as a claim, say), the item is left out and reported: nothing unsafe is produced.
      for (let shown = examples.length; shown >= 0; shown--) {
        const suggestion = {
          targetType: 'profile',
          field: 'techStack',
          proposedValue: [...profile.techStack, item],
          reason: reasonFor({ skill: item, kind, jobs, of: matching.length, examples: examples.slice(0, shown) }),
          source: SOURCE,
          skill: item,
          kind,
          jobs,
          of: matching.length,
        }
        try {
          assertSafeSuggestion(suggestion, { profile, dictionary })
        } catch (error) {
          if (!(error instanceof UnsafeSuggestionError)) throw error
          if (shown > 0) continue
          leftOut.push({ skill: item, why: 'no safely worded suggestion can be made for it' })
          break
        }
        suggestions.push(suggestion)
        break
      }
    }
  }
  return { suggestions, counts, stackFull, leftOut }
}

/** Wording that would state the owner has a skill, rather than ask. */
const ASSERTIVE = [
  /\byou (have|are|know|use|used|built|worked|possess)\b(?! real experience with it; reject)/i,
  /\b(experienced|proficient|skilled|expert|expertise|fluent|years of)\b/i,
  /\b(I|we) (have|am|are|know|use|used|built|worked)\b/i,
]

/**
 * The "never assert a claim" rule, checked on every suggestion before it is shown or
 * sent. Throws unless the suggestion only adds one known skill to profile.techStack and
 * its reason is evidence from tracked jobs plus a question to the owner.
 * @param {unknown} suggestion
 * @param {{profile: ReturnType<typeof readProfile>, dictionary: ReturnType<typeof parseDictionary>}} context
 */
export function assertSafeSuggestion(suggestion, { profile, dictionary }) {
  const fail = (why) => {
    throw new UnsafeSuggestionError(`Refusing an unsafe suggestion: ${why}`)
  }
  if (!isObject(suggestion)) fail('it is not an object.')
  const s = suggestion
  // Only this one field. Experience, projects, bio, tagline and every other text are off limits.
  if (s.targetType !== 'profile' || s.field !== 'techStack') {
    fail(`it targets ${String(s.targetType)}.${String(s.field)}; only profile.techStack may be proposed.`)
  }
  if (s.targetId !== undefined) fail('it names a target row.')
  if (s.source !== SOURCE) fail(`its source is ${JSON.stringify(s.source)}, not "${SOURCE}".`)

  const value = s.proposedValue
  if (!Array.isArray(value) || !value.every(isText)) fail('its value is not a list of text.')
  if (value.length !== profile.techStack.length + 1 || !profile.techStack.every((item, i) => value[i] === item)) {
    fail('its value is not the current tech stack with exactly one item added at the end.')
  }
  if (value.length > LIST_MAX_ITEMS) fail(`its list would hold more than ${LIST_MAX_ITEMS} items.`)
  const added = value.at(-1)
  if (added !== s.skill) fail('the item it adds is not the skill it names.')
  if (added.length > LIST_ITEM_MAX) fail('the item it adds is too long.')
  const known =
    dictionary.canonical.has(skillKey(added)) || profile.skills.some((name) => skillKey(name) === skillKey(added))
  if (!known) fail(`"${added}" is neither in the skills dictionary nor in the profile's skills list.`)

  const reason = s.reason
  if (!isText(reason) || reason.length > REASON_MAX) fail(`its reason is empty or longer than ${REASON_MAX} characters.`)
  if (!/asked for in \d+ of your \d+ tracked jobs? that match your targets/.test(reason)) fail('its reason does not state the evidence.')
  if (!reason.includes('Accept only if') || !reason.includes('reject if not') || !reason.includes('?')) {
    fail('its reason does not ask the owner whether it applies.')
  }
  if (ASSERTIVE.some((pattern) => pattern.test(reason))) fail('its reason states experience instead of asking.')
}

// ── de-duplication against the queue ────────────────────────────────────────

/**
 * Drops proposals the owner is already looking at or has already turned down.
 * - pending: any pending suggestion for profile.techStack whose list contains the skill;
 * - rejected: a rejected suggestion that added exactly that one skill (a rejected
 *   suggestion that added several things says nothing about any one of them).
 * Accepted and superseded suggestions do not block: an accepted skill is on the profile
 * and so never proposed, and a superseded one was never decided.
 * @param {Suggestion[]} suggestions
 * @param {unknown[]} existing rows from GET /api/admin/suggestions
 * @param {ReturnType<typeof parseDictionary>} dictionary
 * @returns {{toFile: Suggestion[], skipped: {suggestion: Suggestion, why: 'pending'|'rejected'}[]}}
 */
export function filterAgainstQueue(suggestions, existing, dictionary) {
  const canonicalKey = (text) => skillKey(dictionary.canonical.get(skillKey(text)) ?? text)
  const pending = new Set()
  const rejected = new Set()
  for (const row of existing) {
    if (!isObject(row) || row.targetType !== 'profile' || row.field !== 'techStack') continue
    if (!Array.isArray(row.proposedValue)) continue
    const proposed = row.proposedValue.filter(isText).map(canonicalKey)
    if (row.status === 'pending') {
      for (const key of proposed) pending.add(key)
    } else if (row.status === 'rejected') {
      const before = new Set((Array.isArray(row.currentValue) ? row.currentValue : []).filter(isText).map(canonicalKey))
      const added = proposed.filter((key) => !before.has(key))
      if (added.length === 1) rejected.add(added[0])
    }
  }

  const toFile = []
  const skipped = []
  for (const suggestion of suggestions) {
    const key = canonicalKey(suggestion.skill)
    if (pending.has(key)) skipped.push({ suggestion, why: 'pending' })
    else if (rejected.has(key)) skipped.push({ suggestion, why: 'rejected' })
    else toFile.push(suggestion)
  }
  return { toFile, skipped }
}
