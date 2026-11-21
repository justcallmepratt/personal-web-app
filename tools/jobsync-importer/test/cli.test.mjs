import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { BACKEND_ALLOWLIST, EXIT_FAILED, EXIT_OK, EXIT_USAGE, promptOnTerminal, run } from '../src/cli.mjs'
import { ALLOWLIST, JOBS, makeManifest, mockApi, PROFILE, tempDir, writeBackup } from './helpers.mjs'

// Made-up credentials for the mock server only.
const USER = 'test-admin'
const PASS = 'not-a-real-password'
const TOKEN = 'mock-token-123'
const PROFILE_GET = 'GET /api/profile'
const LOGIN = 'POST /api/admin/auth/login'
const LIST = 'GET /api/admin/suggestions'
const CREATE = 'POST /api/admin/suggestions'
const STACK = PROFILE.techStack

const servers = []
after(() => Promise.all(servers.map((s) => s.close())))

async function api(routes = {}) {
  let nextId = 100
  const server = await mockApi({
    [PROFILE_GET]: { status: 200, body: PROFILE },
    [LOGIN]: { status: 200, body: { token: TOKEN } },
    [LIST]: { status: 200, body: [] },
    [CREATE]: () => ({ status: 201, body: { id: nextId++, status: 'pending' } }),
    ...routes,
  })
  servers.push(server)
  return server
}

/** A folder with a backup of JOBS and an allow-list file, as the owner would have. */
function workspace(jobs = JOBS, backupOptions) {
  const dir = tempDir()
  writeBackup(dir, jobs, backupOptions)
  const allowlist = join(dir, 'allowlist.json')
  writeFileSync(allowlist, JSON.stringify(ALLOWLIST))
  return { dir, allowlist }
}

/** Runs the command with captured output, no real environment and no terminal. */
async function cli(args, { env = {}, prompt, repoRoot = tempDir(), home = tempDir(), now } = {}) {
  const lines = []
  const errors = []
  const code = await run(args, {
    env,
    out: (line) => lines.push(line),
    err: (line) => errors.push(line),
    sleep: async () => {},
    prompt: prompt ?? (async () => Promise.reject(new Error('not a terminal'))),
    now: now ?? (() => Date.parse('2026-11-21T12:00:00Z')),
    repoRoot,
    home,
  })
  return { code, out: lines.join('\n'), err: errors.join('\n') }
}

const CREDS = { SITE_ADMIN_USERNAME: USER, SITE_ADMIN_PASSWORD: PASS }

test('dry run is the default: prints what it would file and sends nothing but the profile read', async () => {
  const server = await api()
  const { dir, allowlist } = workspace()
  // Credentials in the environment must not make a dry run sign in.
  const { code, out, err } = await cli(['--backup', dir, '--allowlist', allowlist, '--api-url', server.url], { env: CREDS })
  assert.equal(code, EXIT_OK)
  assert.equal(err, '')
  assert.match(out, /Mode: dry run/)
  assert.match(out, /Jobs: 6 in the backup, 4 match your targets/)
  assert.match(out, /Unlisted Startup Inc \(1\)/)
  assert.match(out, /Would file 3 suggestions/)
  assert.match(out, /\+ "Kubernetes" → profile tech stack/)
  assert.match(out, /asked for in 3 of your 4 tracked jobs/)
  assert.match(out, /nothing was filed/)
  assert.deepEqual(
    server.requests.map((r) => r.key),
    [PROFILE_GET],
  )
})

test('a dry run from a saved profile makes no request at all', async () => {
  const server = await api()
  const { dir, allowlist } = workspace()
  const saved = join(dir, 'profile.json')
  writeFileSync(saved, JSON.stringify(PROFILE))
  const { code, out } = await cli(['--backup', dir, '--allowlist', allowlist, '--profile-file', saved])
  assert.equal(code, EXIT_OK)
  assert.match(out, /Would file 3 suggestions/)
  assert.equal(server.requests.length, 0)
})

test('--file signs in once and files each suggestion in the API\'s request shape', async () => {
  const server = await api()
  const { dir, allowlist } = workspace()
  const { code, out, err } = await cli(['--file', '--backup', dir, '--allowlist', allowlist, '--api-url', server.url], { env: CREDS })
  assert.equal(code, EXIT_OK, err)
  assert.deepEqual(
    server.requests.map((r) => r.key),
    [PROFILE_GET, LOGIN, LIST, CREATE, CREATE, CREATE],
  )
  const created = server.requests.filter((r) => r.key === CREATE)
  assert.deepEqual(
    created.map((r) => r.body.proposedValue),
    [
      [...STACK, 'Kubernetes'],
      [...STACK, 'Python'],
      [...STACK, 'AWS'],
    ],
  )
  for (const request of created) {
    assert.deepEqual(Object.keys(request.body).sort(), ['field', 'proposedValue', 'reason', 'source', 'targetType'])
    assert.equal(request.body.targetType, 'profile')
    assert.equal(request.body.field, 'techStack')
    assert.equal(request.body.source, 'jobsync')
    assert.match(request.body.reason, /Accept only if/)
    assert.equal(request.headers.authorization, `Bearer ${TOKEN}`)
  }
  assert.match(out, /Filed #100/)
  assert.match(out, /Filed 3 suggestions\. Nothing is public until you accept/)
  assert.match(out, /accepting one marks the others superseded/)
  assert.ok(!out.includes(PASS) && !out.includes(TOKEN), 'output must not contain the password or token')
})

test('--file skips what is already pending or was rejected, and a duplicate the API reports', async () => {
  const row = (status, skill) => ({ targetType: 'profile', field: 'techStack', status, currentValue: STACK, proposedValue: [...STACK, skill], source: 'jobsync' })
  const server = await api({
    [LIST]: { status: 200, body: [row('pending', 'Kubernetes'), row('rejected', 'Python')] },
    [CREATE]: { status: 409, body: { error: 'The same change is already waiting for a decision.', code: 'duplicate' } },
  })
  const { dir, allowlist } = workspace()
  const { code, out } = await cli(['--file', '--backup', dir, '--allowlist', allowlist, '--api-url', server.url], { env: CREDS })
  assert.equal(code, EXIT_OK)
  assert.match(out, /Skipped "Kubernetes": already waiting for your decision/)
  assert.match(out, /Skipped "Python": you rejected it before/)
  assert.match(out, /Skipped "AWS": the same change is already waiting/)
  assert.match(out, /Filed 0 suggestions/)
  assert.equal(server.count(CREATE), 1)

  const all = await api({ [LIST]: { status: 200, body: [row('pending', 'Kubernetes'), row('rejected', 'Python'), row('rejected', 'AWS')] } })
  const again = await cli(['--file', '--backup', dir, '--allowlist', allowlist, '--api-url', all.url], { env: CREDS })
  assert.equal(again.code, EXIT_OK)
  assert.match(again.out, /Nothing new to file/)
  assert.equal(all.count(CREATE), 0)
})

test('--file asks for missing credentials on a terminal and does not echo them back', async () => {
  const server = await api()
  const { dir, allowlist } = workspace()
  const asked = []
  const prompt = async (question, { secret }) => {
    asked.push([question, secret])
    return secret ? PASS : ` ${USER} `
  }
  const { code, out } = await cli(['--file', '--max', '1', '--backup', dir, '--allowlist', allowlist, '--api-url', server.url], { prompt })
  assert.equal(code, EXIT_OK)
  assert.deepEqual(asked, [
    ['Admin username: ', false],
    ['Admin password: ', true],
  ])
  assert.deepEqual(server.requests.find((r) => r.key === LOGIN).body, { username: USER, password: PASS })
  assert.ok(!out.includes(PASS))
})

test('--file without credentials and without a terminal stops before any sign-in', async () => {
  const server = await api()
  const { dir, allowlist } = workspace()
  const { code, err } = await cli(['--file', '--backup', dir, '--allowlist', allowlist, '--api-url', server.url])
  assert.equal(code, EXIT_USAGE)
  assert.match(err, /SITE_ADMIN_USERNAME and SITE_ADMIN_PASSWORD/)
  assert.equal(server.count(LOGIN), 0)
})

test('a refused sign-in ends the run: one attempt, nothing filed', async () => {
  for (const [answer, message] of [
    [{ status: 401, body: { error: 'Invalid credentials' } }, /Sign-in was refused/],
    [{ status: 429, headers: { 'Retry-After': '900' }, body: { error: 'Too many' } }, /Sign-in is locked/],
    [{ status: 503, body: { error: 'Admin not configured' } }, /not switched on/],
  ]) {
    const server = await api({ [LOGIN]: answer })
    const { dir, allowlist } = workspace()
    const { code, err } = await cli(['--file', '--backup', dir, '--allowlist', allowlist, '--api-url', server.url], { env: CREDS })
    assert.equal(code, EXIT_FAILED)
    assert.match(err, message)
    assert.equal(server.count(LOGIN), 1)
    assert.equal(server.count(CREATE), 0)
    assert.ok(!err.includes(PASS))
  }
})

test('a failure part-way through filing is reported and stops the run', async () => {
  const server = await api({ [CREATE]: [{ status: 201, body: { id: 7 } }, { status: 500, body: { error: 'boom' } }] })
  const { dir, allowlist } = workspace()
  const { code, out, err } = await cli(['--file', '--backup', dir, '--allowlist', allowlist, '--api-url', server.url], { env: CREDS })
  assert.equal(code, EXIT_FAILED)
  assert.match(out, /Filed #7/)
  assert.match(err, /The API failed while creating a suggestion \(500\)/)
  assert.equal(server.count(CREATE), 2)
})

test('JobSync with no jobs, or none that match, is "nothing to do", not an error', async () => {
  const server = await api()
  const empty = workspace([])
  const a = await cli(['--backup', empty.dir, '--allowlist', empty.allowlist, '--api-url', server.url])
  assert.equal(a.code, EXIT_OK)
  assert.match(a.out, /JobSync has no jobs in this backup\. Nothing to do\./)

  const other = workspace([{ title: 'Product Manager', company: 'Northwind Financial Group', description: 'Kubernetes' }])
  const b = await cli(['--backup', other.dir, '--allowlist', other.allowlist, '--api-url', server.url])
  assert.equal(b.code, EXIT_OK)
  assert.match(b.out, /No tracked job matches your targets/)

  const thin = workspace(JOBS.slice(0, 1))
  const c = await cli(['--backup', thin.dir, '--allowlist', thin.allowlist, '--api-url', server.url])
  assert.equal(c.code, EXIT_OK)
  assert.match(c.out, /Nothing to propose: no skill outside your tech stack is asked for by at least 2 matching jobs/)
  // The API is not called until there is something to compare.
  assert.deepEqual(
    server.requests.map((r) => r.key),
    [PROFILE_GET],
  )
})

test('with the shipped, empty allow-list no company matches and nothing is proposed', async () => {
  const server = await api()
  const { dir } = workspace()
  const { code, out } = await cli(['--backup', dir, '--api-url', server.url])
  assert.equal(code, EXIT_OK)
  assert.match(out, /data\/companies-allowlist\.json \(0 companies\)/)
  assert.match(out, /Northwind Financial Group \(1\)/)
  assert.match(out, /Their status is not guessed/)
  assert.match(out, /The allow-list is empty, so no job can match/)
  assert.equal(server.requests.length, 0)
})

test('the backend\'s reviewed company list is used when it exists, otherwise the local one', async () => {
  const server = await api()
  const { dir } = workspace()
  const repoRoot = tempDir()
  assert.equal(BACKEND_ALLOWLIST, 'backend/src/main/resources/market/allow-list.json')
  const backendFile = join(repoRoot, BACKEND_ALLOWLIST)
  mkdirSync(dirname(backendFile), { recursive: true })
  const evidence = { fortune500: { rank: 40, year: 2026 }, finra: [{ firm: 'NORTHWIND SECURITIES LLC', crd: 1234 }] }
  writeFileSync(
    backendFile,
    JSON.stringify({
      compiledOn: '2026-11-21',
      companies: [
        { name: 'Northwind', included: true, ...evidence, aliases: ['northwind'] },
        { name: 'Meridian Capital', included: true, ...evidence, aliases: ['meridian capital'] },
        { name: 'Halfway Holdings', included: false, ...evidence, aliases: ['halfway'], excludedReason: 'made up' },
        { name: 'No Evidence', included: true, aliases: ['no evidence'] },
      ],
    }),
  )
  const { code, out } = await cli(['--backup', dir, '--api-url', server.url], { repoRoot })
  assert.equal(code, EXIT_OK)
  assert.ok(out.includes(`Company allow-list: ${backendFile} (2 companies).`))
  assert.match(out, /1 entry is marked "included": false in the list and left out/)
  assert.match(out, /1 entry was ignored/)
  assert.match(out, /Would file 3 suggestions/)

  // The old, assumed location is no longer looked at.
  const stale = tempDir()
  const old = join(stale, 'backend/src/main/resources/target-companies.json')
  mkdirSync(dirname(old), { recursive: true })
  writeFileSync(old, JSON.stringify(ALLOWLIST))
  const local = await cli(['--backup', dir, '--api-url', server.url], { repoRoot: stale })
  assert.match(local.out, /data\/companies-allowlist\.json \(0 companies\)/)

  // A broken backend list stops the run; it does not fall back silently.
  writeFileSync(backendFile, '{ not json')
  const broken = await cli(['--backup', dir, '--api-url', server.url], { repoRoot })
  assert.equal(broken.code, EXIT_USAGE)
  assert.match(broken.err, /allow-list at .* is not valid JSON/)
})

test('backup problems stop the run with a reason', async () => {
  const server = await api()
  const { dir, allowlist } = workspace()
  const base = ['--allowlist', allowlist, '--api-url', server.url]

  const missing = await cli(['--backup', join(dir, 'nope.zip'), ...base])
  assert.equal(missing.code, EXIT_USAGE)
  assert.match(missing.err, /There is no JobSync backup at/)

  // No --backup: the default is the Downloads folder of the home directory.
  const home = tempDir()
  const noDownloads = await cli(base, { home })
  assert.equal(noDownloads.code, EXIT_USAGE)
  assert.match(noDownloads.err, /There is no JobSync backup at .*Downloads/)
  mkdirSync(join(home, 'Downloads'))
  const emptyDownloads = await cli(base, { home })
  assert.match(emptyDownloads.err, /No jobsync-backup-\*\.zip in .*Download backup/)
  writeBackup(join(home, 'Downloads'), JOBS)
  assert.equal((await cli(base, { home })).code, EXIT_OK)
  // JOBSYNC_BACKUP names another place.
  assert.equal((await cli(base, { home: tempDir(), env: { JOBSYNC_BACKUP: dir } })).code, EXIT_OK)

  const future = workspace(JOBS, { manifest: makeManifest({ formatVersion: 2 }) })
  const schema = await cli(['--backup', future.dir, ...base])
  assert.equal(schema.code, EXIT_USAGE)
  assert.match(schema.err, /format version 2; this tool understands version 1/)

  const garbage = join(dir, 'garbage.zip')
  writeFileSync(garbage, 'PK not really a zip, only something that starts like one')
  const bad = await cli(['--backup', garbage, ...base])
  assert.equal(bad.code, EXIT_USAGE)
  assert.match(bad.err, /not a complete zip archive/)
  assert.equal(server.count(LOGIN), 0)
})

test('an old backup is used, with a warning', async () => {
  const server = await api()
  const { dir, allowlist } = workspace(JOBS, { manifest: makeManifest({ exportedAt: '2026-10-01T00:00:00.000Z' }) })
  const { code, out } = await cli(['--backup', dir, '--allowlist', allowlist, '--api-url', server.url])
  assert.equal(code, EXIT_OK)
  assert.match(out, /Warning: this backup is 51 days old/)
  assert.match(out, /Would file 3 suggestions/)
})

test('an API that is down, or a profile it cannot make sense of, fails the run', async () => {
  const { dir, allowlist } = workspace()
  const dead = await mockApi({})
  await dead.close()
  const down = await cli(['--backup', dir, '--allowlist', allowlist, '--api-url', dead.url])
  assert.equal(down.code, EXIT_FAILED)
  assert.match(down.err, /could not be reached/)

  const odd = await api({ [PROFILE_GET]: { status: 200, body: { techStack: 'Java' } } })
  const shape = await cli(['--backup', dir, '--allowlist', allowlist, '--api-url', odd.url])
  assert.equal(shape.code, EXIT_USAGE)
  assert.match(shape.err, /"techStack" is not a list of text/)
})

test('bad options are refused before anything is read or sent', async () => {
  const server = await api()
  const { dir, allowlist } = workspace()
  const base = ['--backup', dir, '--allowlist', allowlist]
  for (const [args, message] of [
    [[...base], /Give the API address/],
    [[...base, '--api-url', 'http://api.example.com'], /must use https/],
    [[...base, '--api-url', server.url, '--max', '6'], /--max must be between 1 and 5/],
    [[...base, '--api-url', server.url, '--min-jobs', '0'], /--min-jobs must be between/],
    [[...base, '--api-url', server.url, '--max', 'many'], /--max takes a whole number/],
    [[...base, '--api-url', server.url, '--password', 'x'], /Unknown option/],
    [[...base, '--api-url', server.url, '--file', '--profile-file', 'p.json'], /--profile-file is for dry runs/],
    [[...base, '--api-url', server.url, '--titles', join(dir, 'missing.json')], /titles file could not be read/],
    [[...base, '--api-url', server.url, 'stray'], /positional/i],
  ]) {
    const { code, err } = await cli(args)
    assert.equal(code, EXIT_USAGE, args.join(' '))
    assert.match(err, message)
  }
  assert.equal(server.requests.length, 0)

  const help = await cli(['--help'])
  assert.equal(help.code, EXIT_OK)
  assert.match(help.out, /Dry run by default/)
})

test('the terminal prompt hides a secret, handles backspace and refuses when there is no terminal', async () => {
  const terminal = () => {
    const input = new EventEmitter()
    const state = { raw: [], written: '' }
    Object.assign(input, { isTTY: true, setRawMode: (on) => state.raw.push(on), setEncoding() {}, resume() {}, pause() {} })
    return { input, state, output: { write: (text) => void (state.written += text) } }
  }

  const secret = terminal()
  const typed = promptOnTerminal('Admin password: ', { secret: true, input: secret.input, output: secret.output })
  for (const chunk of ['hun', 'x', '\u007f', 'ter2', '\r', 'ignored']) secret.input.emit('data', chunk)
  assert.equal(await typed, 'hunter2')
  assert.deepEqual(secret.state.raw, [true, false])
  // Only the question and a line break are written: what was typed is never echoed.
  assert.equal(secret.state.written, 'Admin password: \n')
  assert.equal(secret.input.listenerCount('data'), 0)

  const plain = terminal()
  const name = promptOnTerminal('Admin username: ', { input: plain.input, output: plain.output })
  plain.input.emit('data', 'someone\n')
  assert.equal(await name, 'someone')
  assert.deepEqual(plain.state.raw, [])

  const cancelled = terminal()
  const stopped = promptOnTerminal('Admin password: ', { secret: true, input: cancelled.input, output: cancelled.output })
  cancelled.input.emit('data', 'ab\u0003')
  await assert.rejects(stopped, /cancelled/)
  assert.deepEqual(cancelled.state.raw, [true, false])

  await assert.rejects(promptOnTerminal('x', { input: { isTTY: false }, output: { write() {} } }), /not a terminal/)
})

test('--min-jobs, --max and --exclude-status shape the result', async () => {
  const server = await api()
  const jobs = [...JOBS, { title: 'Software Engineer', company: 'Northwind Financial Group', description: 'Kubernetes, Terraform', status: 'archived' }]
  const { dir, allowlist } = workspace(jobs)
  const base = ['--backup', dir, '--allowlist', allowlist, '--api-url', server.url]
  const all = await cli([...base, '--min-jobs', '4', '--max', '1'])
  assert.match(all.out, /5 match your targets/)
  assert.match(all.out, /Would file 1 suggestion \(/)
  assert.match(all.out, /"Kubernetes" is asked for in 4 of your 5 tracked jobs/)
  const fewer = await cli([...base, '--exclude-status', 'archived', '--min-jobs', '4'])
  assert.match(fewer.out, /1 left out: in an excluded status/)
  assert.match(fewer.out, /Nothing to propose/)
})

test('in this repository the default list is the backend\'s reviewed one', async () => {
  const server = await api()
  const { dir } = workspace()
  const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
  const { code, out } = await cli(['--backup', dir, '--api-url', server.url], { repoRoot })
  assert.equal(code, EXIT_OK)
  const line = out.split('\n').find((l) => l.startsWith('Company allow-list: '))
  assert.match(line, /backend\/src\/main\/resources\/market\/allow-list\.json \((\d+) companies\)\.$/)
  assert.ok(Number(/\((\d+) companies/.exec(line)[1]) > 20)
  assert.doesNotMatch(out, /ignored/)
  // The made-up firms in the test backup are not real companies, so nothing matches.
  assert.match(out, /No tracked job matches your targets/)
  assert.equal(server.requests.length, 0)
})
