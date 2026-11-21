// The command: read a JobSync backup, work out suggestions, print them (the default) or
// file them with --file. See docs/JOBSYNC_IMPORTER.md.

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  buildSuggestions,
  ConfigError,
  filterAgainstQueue,
  assertSafeSuggestion,
  MAX_SUGGESTIONS_LIMIT,
  parseAllowlist,
  parseDictionary,
  parseTitleRules,
  readProfile,
  selectJobs,
  UnsafeSuggestionError,
} from './analyse.mjs'
import { ApiError, createClient, normaliseBaseUrl } from './api.mjs'
import { BackupError, loadBackup, readJobs, resolveBackupPath } from './backup.mjs'

export const EXIT_OK = 0
/** The run could not finish: the API was down, sign-in was refused, a suggestion failed. */
export const EXIT_FAILED = 1
/** The run could not start: bad options, a data file, or the backup. */
export const EXIT_USAGE = 2

const TOOL_DIR = fileURLToPath(new URL('..', import.meta.url))
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

/**
 * Where the authoritative company list is expected once the job-market research work
 * adds it to the backend (relative to the repository root). Unconfirmed until that work
 * lands; --allowlist or JOBSYNC_ALLOWLIST names any other file.
 */
export const BACKEND_ALLOWLIST = 'backend/src/main/resources/target-companies.json'

const HELP = `jobsync-importer: propose profile tech-stack suggestions from the jobs tracked in JobSync.

Dry run by default: prints what it would file and changes nothing.

Usage: node bin/jobsync-importer.mjs [options]

  --backup <path>        A JobSync backup zip, a data.json from one, or a folder holding
                         jobsync-backup-*.zip (the newest is used). Default: ~/Downloads.
                         Also: JOBSYNC_BACKUP.
  --api-url <url>        The site's API, e.g. https://api.example.com. Also: SITE_API_URL.
  --profile-file <path>  Dry run only: read the profile from a saved copy of
                         GET /api/profile instead of calling the API.
  --file                 File the suggestions for real. Signs in once with
                         SITE_ADMIN_USERNAME and SITE_ADMIN_PASSWORD, or asks for them.
  --allowlist <path>     Company allow-list. Default: the backend's list if present, else
                         data/companies-allowlist.json. Also: JOBSYNC_ALLOWLIST.
  --titles <path>        Target job titles. Default: data/target-titles.json.
  --skills <path>        Skills dictionary. Default: data/skills-dictionary.json.
  --min-jobs <n>         Propose a skill only when at least n matching jobs ask for it. Default 2.
  --max <n>              At most n suggestions per run (1 to ${MAX_SUGGESTIONS_LIMIT}). Default 3.
  --exclude-status <s>   Leave out jobs with this JobSync status (repeatable), e.g. archived.
  --max-age-days <n>     Warn when the backup is older than n days. Default 8.
  --help                 Show this text.

Nothing is stored: no password, token or state file. Exit codes: 0 done (including
"nothing to do"), 1 the run failed part-way (API, sign-in), 2 it could not start
(options, data files, backup).`

class UsageError extends Error {}

function wholeNumber(text, name, min, max) {
  if (!/^\d+$/.test(text)) throw new UsageError(`--${name} takes a whole number.`)
  const value = Number(text)
  if (value < min || value > max) throw new UsageError(`--${name} must be between ${min} and ${max}.`)
  return value
}

function readJsonFile(path, what) {
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch (error) {
    throw new ConfigError(`${what} could not be read at ${path} (${error.code ?? error.message}).`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new ConfigError(`${what} at ${path} is not valid JSON.`)
  }
}

/** Asks on the terminal. With `secret`, what is typed is not echoed. */
export function promptOnTerminal(question, { secret = false, input = process.stdin, output = process.stderr } = {}) {
  return new Promise((resolvePrompt, reject) => {
    if (!input.isTTY) {
      reject(new Error('not a terminal'))
      return
    }
    output.write(question)
    let value = ''
    const finish = (error) => {
      input.removeListener('data', onData)
      if (secret) input.setRawMode(false)
      input.pause()
      if (secret) output.write('\n')
      if (error) reject(error)
      else resolvePrompt(value)
    }
    const onData = (chunk) => {
      for (const ch of String(chunk)) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') return finish()
        if (ch === '\u0003') return finish(new Error('cancelled'))
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1)
        else value += ch
      }
    }
    if (secret) input.setRawMode(true)
    input.setEncoding('utf8')
    input.resume()
    input.on('data', onData)
  })
}

/**
 * Runs the importer.
 * @param {string[]} argv arguments after the script name
 * @param {object} [io] replaceable for tests
 * @param {Record<string, string|undefined>} [io.env]
 * @param {(line: string) => void} [io.out]
 * @param {(line: string) => void} [io.err]
 * @param {typeof fetch} [io.fetch]
 * @param {(ms: number) => Promise<void>} [io.sleep]
 * @param {(question: string, options: {secret: boolean}) => Promise<string>} [io.prompt]
 * @param {() => number} [io.now]
 * @param {string} [io.repoRoot]
 * @param {string} [io.home]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, io = {}) {
  const {
    env = process.env,
    out = (line) => process.stdout.write(`${line}\n`),
    err = (line) => process.stderr.write(`${line}\n`),
    fetch: fetchImpl = globalThis.fetch,
    sleep,
    prompt = promptOnTerminal,
    now = Date.now,
    repoRoot = REPO_ROOT,
    home = homedir(),
  } = io

  try {
    return await main()
  } catch (error) {
    if (error instanceof UsageError) {
      err(`${error.message}\nRun with --help for the options.`)
      return EXIT_USAGE
    }
    if (error instanceof ConfigError || error instanceof BackupError) {
      err(error.message)
      return EXIT_USAGE
    }
    if (error instanceof ApiError) {
      err(error.message)
      return error.kind === 'bad_url' ? EXIT_USAGE : EXIT_FAILED
    }
    if (error instanceof UnsafeSuggestionError) {
      err(`${error.message}\nNothing was filed. This is a fault in the tool or in an edited data file, not in your data.`)
      return EXIT_FAILED
    }
    throw error
  }

  async function main() {
    let values
    try {
      ;({ values } = parseArgs({
        args: argv,
        allowPositionals: false,
        options: {
          backup: { type: 'string' },
          'api-url': { type: 'string' },
          'profile-file': { type: 'string' },
          file: { type: 'boolean', default: false },
          allowlist: { type: 'string' },
          titles: { type: 'string' },
          skills: { type: 'string' },
          'min-jobs': { type: 'string', default: '2' },
          max: { type: 'string', default: '3' },
          'exclude-status': { type: 'string', multiple: true, default: [] },
          'max-age-days': { type: 'string', default: '8' },
          help: { type: 'boolean', default: false },
        },
      }))
    } catch (error) {
      throw new UsageError(error.message)
    }
    if (values.help) {
      out(HELP)
      return EXIT_OK
    }

    const filing = values.file
    const minJobs = wholeNumber(values['min-jobs'], 'min-jobs', 1, 1000)
    const max = wholeNumber(values.max, 'max', 1, MAX_SUGGESTIONS_LIMIT)
    const maxAgeDays = wholeNumber(values['max-age-days'], 'max-age-days', 1, 3650)
    const apiUrlText = values['api-url'] ?? env.SITE_API_URL
    if (filing && values['profile-file']) {
      throw new UsageError('--profile-file is for dry runs. Filing compares against the live profile, so use --api-url with --file.')
    }
    if (!values['profile-file'] && !apiUrlText) {
      throw new UsageError('Give the API address with --api-url or SITE_API_URL (or, for a dry run, --profile-file).')
    }
    // Checked before any work, so a mistyped address fails at once.
    const apiUrl = apiUrlText ? normaliseBaseUrl(apiUrlText) : null

    // ── data files ──
    const titles = parseTitleRules(readJsonFile(values.titles ?? join(TOOL_DIR, 'data/target-titles.json'), 'The titles file'))
    const dictionary = parseDictionary(readJsonFile(values.skills ?? join(TOOL_DIR, 'data/skills-dictionary.json'), 'The skills dictionary'))

    const explicitAllowlist = values.allowlist ?? env.JOBSYNC_ALLOWLIST
    const backendAllowlist = join(repoRoot, BACKEND_ALLOWLIST)
    const allowlistPath = explicitAllowlist
      ? resolve(explicitAllowlist)
      : existsSync(backendAllowlist)
        ? backendAllowlist
        : join(TOOL_DIR, 'data/companies-allowlist.json')
    const allowlist = parseAllowlist(readJsonFile(allowlistPath, 'The company allow-list'))

    out(filing ? 'Mode: FILING suggestions (--file).' : 'Mode: dry run. Nothing will be filed.')
    out(`Company allow-list: ${allowlistPath} (${allowlist.accepted} ${allowlist.accepted === 1 ? 'company' : 'companies'}).`)
    if (allowlist.ignored > 0) {
      out(`  ${allowlist.ignored} ${allowlist.ignored === 1 ? 'entry was' : 'entries were'} ignored: an entry counts only with a name and both "fortune500": true and "finraRegulated": true.`)
    }

    // ── JobSync ──
    const backupPath = resolveBackupPath(values.backup ?? env.JOBSYNC_BACKUP ?? join(home, 'Downloads'))
    const backup = loadBackup(backupPath)
    const exportedAt = Date.parse(backup.manifest?.exportedAt ?? '')
    out(`JobSync backup: ${backupPath}${Number.isNaN(exportedAt) ? '' : ` (exported ${new Date(exportedAt).toISOString().slice(0, 10)})`}.`)
    if (!Number.isNaN(exportedAt)) {
      const ageDays = Math.floor((now() - exportedAt) / 86_400_000)
      if (ageDays > maxAgeDays) {
        out(`  Warning: this backup is ${ageDays} days old. Download a fresh one in JobSync (Settings → Data) to include recent jobs.`)
      }
    }

    const { jobs, malformed } = readJobs(backup.data)
    if (malformed > 0) out(`  ${malformed} job ${malformed === 1 ? 'row was' : 'rows were'} skipped: missing a title, company or description.`)
    if (jobs.length === 0) {
      out('JobSync has no jobs in this backup. Nothing to do.')
      return EXIT_OK
    }

    const { matching, skipped, companiesNotListed } = selectJobs(jobs, {
      titles,
      allowlist,
      excludeStatuses: values['exclude-status'],
    })
    out(`Jobs: ${jobs.length} in the backup, ${matching.length} match your targets.`)
    const reasons = [
      [skipped.notTracked, 'found by an automation but not accepted into the tracker'],
      [skipped.status, 'in an excluded status'],
      [skipped.title, 'title not in the target list'],
      [skipped.company, 'company not on the allow-list'],
    ]
    for (const [count, why] of reasons) if (count > 0) out(`  ${count} left out: ${why}.`)
    if (companiesNotListed.size > 0) {
      const listed = [...companiesNotListed].sort((a, b) => b[1] - a[1]).slice(0, 10)
      out(`  Companies with a matching title that are not on the allow-list: ${listed.map(([name, n]) => `${name} (${n})`).join(', ')}${companiesNotListed.size > 10 ? ', …' : ''}.`)
      out('  Their status is not guessed. Add one only after checking it is both Fortune 500 and FINRA-regulated.')
    }
    if (matching.length === 0) {
      out(
        allowlist.accepted === 0
          ? 'The allow-list is empty, so no job can match. Nothing to do.'
          : 'No tracked job matches your targets. Nothing to do.',
      )
      return EXIT_OK
    }

    // ── the profile ──
    let client = null
    let profile
    if (values['profile-file']) {
      profile = readProfile(readJsonFile(resolve(values['profile-file']), 'The profile file'))
      out(`Profile: ${resolve(values['profile-file'])} (a saved copy).`)
    } else {
      client = createClient({ baseUrl: apiUrl, fetch: fetchImpl, ...(sleep ? { sleep } : {}), log: out })
      profile = readProfile(await client.getProfile())
      out(`Profile: ${client.baseUrl}/api/profile.`)
    }

    // ── proposals ──
    const { suggestions, counts, stackFull } = buildSuggestions({ matching, dictionary, profile, minJobs, max })
    if (counts.length > 0) {
      out(`Most asked for in those ${matching.length}: ${counts.slice(0, 12).map((c) => `${c.skill} (${c.jobs})`).join(', ')}.`)
    }
    if (stackFull) {
      out('The profile tech stack already holds the most items the API allows. Nothing to propose.')
      return EXIT_OK
    }
    if (suggestions.length === 0) {
      out(`Nothing to propose: no skill outside your tech stack is asked for by at least ${minJobs} matching ${minJobs === 1 ? 'job' : 'jobs'}.`)
      return EXIT_OK
    }

    const describe = (s) => [`  + "${s.skill}" → profile tech stack`, `    ${s.reason}`]

    if (!filing) {
      out(`Would file ${suggestions.length} ${suggestions.length === 1 ? 'suggestion' : 'suggestions'} (source "jobsync"):`)
      for (const s of suggestions) for (const line of describe(s)) out(line)
      out('Dry run: nothing was filed, and the queue was not checked for pending or rejected copies.')
      out('To file them, run again with --file. Each one still needs your accept in the admin app.')
      return EXIT_OK
    }

    // ── filing ──
    let username = env.SITE_ADMIN_USERNAME ?? ''
    let password = env.SITE_ADMIN_PASSWORD ?? ''
    try {
      if (username === '') username = (await prompt('Admin username: ', { secret: false })).trim()
      if (password === '') password = await prompt('Admin password: ', { secret: true })
    } catch {
      throw new UsageError('Set SITE_ADMIN_USERNAME and SITE_ADMIN_PASSWORD, or run in a terminal to be asked for them.')
    }
    if (username === '' || password === '') throw new UsageError('A username and a password are both needed to file suggestions.')

    await client.signIn(username, password)
    password = ''
    out('Signed in.')

    const existing = await client.listSuggestions()
    if (existing.length >= 200) {
      out('  Note: the queue holds 200 or more suggestions and the API lists only the newest 200, so an older rejection may not be seen.')
    }
    const { toFile, skipped: alreadyThere } = filterAgainstQueue(suggestions, existing, dictionary)
    for (const { suggestion, why } of alreadyThere) {
      out(`  Skipped "${suggestion.skill}": ${why === 'pending' ? 'already waiting for your decision' : 'you rejected it before'}.`)
    }
    if (toFile.length === 0) {
      out('Nothing new to file.')
      return EXIT_OK
    }

    let filed = 0
    for (const suggestion of toFile) {
      // Checked again against the profile just read, immediately before sending.
      assertSafeSuggestion(suggestion, { profile, dictionary })
      const result = await client.createSuggestion(suggestion)
      if (result.created) {
        filed++
        out(`Filed${result.id === null ? '' : ` #${result.id}`}:`)
        for (const line of describe(suggestion)) out(line)
      } else {
        out(`  Skipped "${suggestion.skill}": the same change is already waiting for your decision.`)
      }
    }
    out(`Filed ${filed} ${filed === 1 ? 'suggestion' : 'suggestions'}. Nothing is public until you accept it in the admin app (/admin/suggestions).`)
    if (filed > 1) {
      out('They all change the same field, so accepting one marks the others superseded. Accept one, then run this again to refile the rest.')
    }
    return EXIT_OK
  }
}
