import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertSafeSuggestion,
  buildSuggestions,
  ConfigError,
  extractSkills,
  filterAgainstQueue,
  matchesTitle,
  matchCompany,
  normaliseCompany,
  normaliseEmployer,
  parseAllowlist,
  parseDictionary,
  parseTitleRules,
  readProfile,
  REASON_MAX,
  selectJobs,
  UnsafeSuggestionError,
} from '../src/analyse.mjs'
import { readJobs } from '../src/backup.mjs'
import { ALLOWLIST, JOBS, makeData, PROFILE } from './helpers.mjs'

const shipped = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'))
const titles = parseTitleRules(shipped('target-titles.json'))
const dictionary = parseDictionary(shipped('skills-dictionary.json'))
const allowlist = parseAllowlist(ALLOWLIST)
const profile = readProfile(PROFILE)
const jobsFrom = (list) => readJobs(makeData(list)).jobs
const job = (description, tags = []) => ({ description, tags })

function proposals(overrides = {}) {
  const { matching } = selectJobs(jobsFrom(JOBS), { titles, allowlist })
  return buildSuggestions({ matching, dictionary, profile, minJobs: 2, max: 3, ...overrides })
}

// ── titles ──────────────────────────────────────────────────────────────────

test('titles: the two target roles and their common variants match', () => {
  for (const title of [
    'Software Developer',
    'Senior Software Engineer II',
    'Software Engineer - Payments',
    'Sr. Backend Developer (Java)',
    'Back-End Engineer',
    'Applications Developer',
    'Forward Deployed Engineer',
    'Forward-Deployed Software Engineer, Financial Services',
    'SOFTWARE DEVELOPMENT ENGINEER',
  ]) {
    assert.ok(matchesTitle(title, titles), title)
  }
})

test('titles: other roles, and excluded words, do not match', () => {
  for (const title of [
    'Product Manager',
    'Data Scientist',
    'Software Engineering Manager',
    'Software Engineer Intern',
    'Director, Software Engineer Programs',
    'Hardware Engineer',
    'Softwareengineer',
    '',
  ]) {
    assert.ok(!matchesTitle(title, titles), title)
  }
})

test('titles: an unusable titles file is refused', () => {
  assert.throws(() => parseTitleRules([]), ConfigError)
  assert.throws(() => parseTitleRules({ include: [] }), ConfigError)
  assert.throws(() => parseTitleRules({ include: ['x'], exclude: [3] }), ConfigError)
  assert.deepEqual(parseTitleRules({ include: ['Site-Reliability Engineer'] }), { include: ['site reliability engineer'], exclude: [] })
})

// ── companies ───────────────────────────────────────────────────────────────

test('companies: legal forms, punctuation and case are ignored, nothing more', () => {
  assert.equal(normaliseCompany('JPMorgan Chase & Co.'), 'jpmorgan chase')
  assert.equal(normaliseCompany('The Example Bank, N.A.'), 'example bank')
  assert.equal(normaliseCompany('Example Securities LLC'), 'example securities')
  assert.equal(normaliseCompany('EXAMPLE  Corp'), 'example')
  // Words that carry meaning are kept, so different firms stay different.
  assert.notEqual(normaliseCompany('Example Financial'), normaliseCompany('Example Financial Group'))
  assert.notEqual(normaliseCompany('Example Bank'), normaliseCompany('Example'))
})

test('allow-list: an entry counts only with both flags literally true', () => {
  const list = parseAllowlist({
    companies: [
      { name: 'Both True Inc', fortune500: true, finraRegulated: true, aliases: ['BT Securities', 7] },
      { name: 'Only Fortune', fortune500: true, finraRegulated: false },
      { name: 'Only Finra', finraRegulated: true },
      { name: 'Truthy Strings', fortune500: 'true', finraRegulated: 'yes' },
      { name: '', fortune500: true, finraRegulated: true },
      'A Bare Name',
      null,
    ],
  })
  assert.equal(list.accepted, 1)
  assert.equal(list.ignored, 6)
  assert.deepEqual([...list.names.keys()].sort(), ['both true', 'bt securities'])
  assert.equal(parseAllowlist([{ name: 'X', fortune500: true, finraRegulated: true }]).accepted, 1)
  assert.throws(() => parseAllowlist({ firms: [] }), ConfigError)
  assert.throws(() => parseAllowlist('x'), ConfigError)
})

// ── the backend's reviewed list (backend/src/main/resources/market/allow-list.json) ──

const RANKED = { rank: 24, year: 2026, source: 'x' }
const MEMBER = [{ firm: 'EXAMPLE GLOBAL MARKETS INC.', crd: 7059, source: 'x' }]
const backendEntry = (name, extra = {}) => ({ name, included: true, fortune500: RANKED, finra: MEMBER, aliases: [name.toLowerCase()], ...extra })

test('backend list: an entry counts only when included with a rank, a FINRA firm with a CRD, and an alias', () => {
  const list = parseAllowlist({
    compiledOn: '2026-11-21',
    companies: [
      backendEntry('Complete'),
      backendEntry('Left Out', { included: false, excludedReason: 'not a financial-services employer' }),
      backendEntry('Truthy Included', { included: 'true' }),
      backendEntry('No Included Flag', { included: undefined }),
      backendEntry('No Fortune', { fortune500: undefined }),
      backendEntry('No Rank', { fortune500: { year: 2026 } }),
      backendEntry('Rank Zero', { fortune500: { rank: 0 } }),
      backendEntry('Rank 501', { fortune500: { rank: 501 } }),
      backendEntry('Rank As Text', { fortune500: { rank: '24' } }),
      backendEntry('No Finra', { finra: [] }),
      backendEntry('No Crd', { finra: [{ firm: 'EXAMPLE SECURITIES LLC' }] }),
      backendEntry('No Firm Name', { finra: [{ firm: ' ', crd: 7059 }] }),
      backendEntry('No Aliases', { aliases: [] }),
      backendEntry('Blank Aliases', { aliases: [' ', '&'] }),
      backendEntry('Aliases Missing', { aliases: undefined }),
      backendEntry('', { aliases: ['nameless'] }),
      backendEntry('Edge Of The List', { fortune500: { rank: 500 }, finra: [null, { firm: 'X' }, ...MEMBER] }),
    ],
  })
  assert.equal(list.accepted, 2)
  assert.equal(list.excluded, 1)
  assert.equal(list.ignored, 14)
  assert.deepEqual(list.phrases.map((p) => p.name), ['Complete', 'Edge Of The List'])
  assert.equal(list.names.size, 0)
})

test('backend list: aliases match as whole words, and the company name is not an alias', () => {
  const list = parseAllowlist({
    companies: [
      backendEntry('Citigroup', { aliases: ['citi', 'Citigroup'] }),
      backendEntry('Block', { aliases: ['cash app', 'block, inc.'] }),
      backendEntry('JPMorgan Chase', { aliases: ['j.p. morgan'] }),
    ],
  })
  for (const employer of ['Citi', 'CITI', 'Citigroup Inc.', 'The Citi Group', 'Citi (New York)']) {
    assert.equal(matchCompany(list, employer), 'Citigroup', employer)
  }
  for (const employer of ['Citizens Bank', 'Citibank', 'Citigroupe', 'Felicity', '', '&']) {
    assert.equal(matchCompany(list, employer), null, employer)
  }
  // "Block" alone is too generic to be matched on, so only the listed aliases count.
  assert.equal(matchCompany(list, 'Block'), null)
  assert.equal(matchCompany(list, 'H&R Block'), null)
  assert.equal(matchCompany(list, 'Block, Inc.'), 'Block')
  assert.equal(matchCompany(list, 'Cash App'), 'Block')
  // The other entries of the list keep their own names out, too.
  assert.equal(matchCompany(list, 'JPMorgan Chase'), null)
  assert.equal(matchCompany(list, 'J.P. Morgan Securities LLC'), 'JPMorgan Chase')
  assert.equal(normaliseEmployer('  J.P. Morgan & Co. '), 'j p morgan co')
})

test('backend list: selection uses whole-word aliases', () => {
  const list = parseAllowlist({ companies: [backendEntry('Northwind Financial Group', { aliases: ['northwind'] })] })
  const { matching, companiesNotListed } = selectJobs(jobsFrom(JOBS), { titles, allowlist: list })
  assert.ok(matching.length > 0)
  assert.ok(matching.every((job) => /northwind/i.test(job.company)))
  assert.ok(![...companiesNotListed.keys()].some((name) => /northwind/i.test(name)))
})

test('the real backend list loads and yields the companies the backend uses', () => {
  const path = fileURLToPath(new URL('../../../backend/src/main/resources/market/allow-list.json', import.meta.url))
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  const list = parseAllowlist(raw)

  // AllowList.java's rule, written out again here so the two cannot drift unnoticed.
  const usable = raw.companies.filter(
    (e) =>
      e.included === true &&
      e.fortune500?.rank >= 1 &&
      e.fortune500?.rank <= 500 &&
      (e.finra ?? []).some((f) => f?.crd > 0 && f?.firm?.trim()) &&
      (e.aliases ?? []).some((a) => /[a-z0-9]/i.test(a)),
  )
  assert.ok(usable.length > 20)
  assert.deepEqual([...new Set(list.phrases.map((p) => p.name))], usable.map((e) => e.name))
  assert.equal(list.accepted, usable.length)
  assert.equal(list.excluded, raw.companies.filter((e) => e.included === false).length)
  assert.equal(list.accepted + list.excluded + list.ignored, raw.companies.length)
  // Every entry of the reviewed list is complete: nothing in it is dropped for missing evidence.
  assert.equal(list.ignored, 0)

  // The same employer names the backend's own test checks against the real file.
  assert.equal(matchCompany(list, 'Citi'), 'Citigroup')
  assert.equal(matchCompany(list, 'JPMorganChase'), 'JPMorgan Chase')
  assert.equal(matchCompany(list, 'Wells Fargo Bank'), 'Wells Fargo')
  assert.equal(matchCompany(list, 'First Citizens Bank'), 'First Citizens BancShares')
  for (const other of [
    'Chase Brass', 'Citizens Bank of Edmond', 'H&R Block', 'Fidelity Investments', 'Huntington Ingalls Industries',
    'Lincoln Electric', 'Hartford HealthCare', "Nationwide Children's Hospital", 'Guardian Pharmacy', 'Pershing Square',
    'Apollo Education', 'Prudential plc', 'Acme Software',
  ]) {
    assert.equal(matchCompany(list, other), null, other)
  }
  // An entry the list marks "included": false is not matched, whatever its aliases.
  const leftOut = raw.companies.find((e) => e.included === false && e.aliases?.length > 0)
  assert.equal(matchCompany(list, leftOut.aliases[0]), null)
})

test('the shipped data files load, and the shipped allow-list names no company', () => {
  assert.ok(titles.include.includes('forward deployed engineer'))
  assert.ok(dictionary.skills.length > 20)
  const local = parseAllowlist(shipped('companies-allowlist.json'))
  assert.equal(local.accepted, 0)
  assert.equal(local.names.size, 0)
})

// ── job selection ───────────────────────────────────────────────────────────

test('selection: only target titles at allow-listed companies count', () => {
  const { matching, skipped, companiesNotListed } = selectJobs(jobsFrom(JOBS), { titles, allowlist })
  assert.deepEqual(
    matching.map((j) => j.id),
    ['job-1', 'job-2', 'job-3', 'job-4'],
  )
  assert.deepEqual(skipped, { notTracked: 0, status: 0, title: 1, company: 1, duplicate: 0 })
  assert.deepEqual([...companiesNotListed], [['Unlisted Startup Inc', 1]])
})

test('selection: a company with only one flag, or a near-miss name, never matches', () => {
  const list = jobsFrom([
    { title: 'Software Engineer', company: 'Halfway Holdings' },
    { title: 'Software Engineer', company: 'Northwind Financial' },
    { title: 'Software Engineer', company: 'Northwind Financial Group Asia' },
    { title: 'Software Engineer', company: 'Northwind' },
  ])
  assert.equal(selectJobs(list, { titles, allowlist }).matching.length, 0)
})

test('selection: an empty allow-list matches nothing', () => {
  const { matching, skipped } = selectJobs(jobsFrom(JOBS), { titles, allowlist: parseAllowlist({ companies: [] }) })
  assert.equal(matching.length, 0)
  assert.equal(skipped.company, 5)
})

test('selection: automation finds not yet accepted, and excluded statuses, are left out', () => {
  const base = { title: 'Software Engineer', company: 'Northwind Financial Group' }
  const list = jobsFrom([
    { ...base, discoveryStatus: 'new' },
    { ...base, discoveryStatus: 'dismissed' },
    { ...base, discoveryStatus: 'accepted', description: 'Payments team' },
    { ...base, status: 'archived' },
    { ...base, status: 'rejected', description: 'Markets team' },
  ])
  const { matching, skipped } = selectJobs(list, { titles, allowlist, excludeStatuses: ['Archived'] })
  assert.deepEqual(
    matching.map((j) => j.id),
    ['job-3', 'job-5'],
  )
  assert.equal(skipped.notTracked, 2)
  assert.equal(skipped.status, 1)
})

// ── extraction ──────────────────────────────────────────────────────────────

test('extraction: finds names and aliases as whole words, in text and tags', () => {
  const found = extractSkills(job('We use k8s, Postgres and  Amazon   Web Services; C#/.NET and Node.js too.', ['Kafka']), dictionary)
  assert.deepEqual([...found].sort(), ['.NET', 'AWS', 'C#', 'Kafka', 'Kubernetes', 'Node.js', 'PostgreSQL'])
})

test('extraction: a skill inside a longer word is not found', () => {
  assert.deepEqual([...extractSkills(job('JavaScript, MySQL, Dockerfile-free, Reactive streams, Angularity'), dictionary)].sort(), ['JavaScript', 'MySQL'])
  assert.ok(!extractSkills(job('JavaScript'), dictionary).has('Java'))
  assert.ok(extractSkills(job('Java/JavaScript'), dictionary).has('Java'))
})

test('extraction: words that are also plain English need their capitals', () => {
  assert.deepEqual([...extractSkills(job('Join us this spring; the rest of the team will spark ideas and git going.'), dictionary)], [])
  assert.deepEqual([...extractSkills(job('Spring, REST and Git.'), dictionary)].sort(), ['Git', 'REST', 'Spring'])
})

test('extraction: a longer skill name wins over a shorter one inside it', () => {
  assert.deepEqual([...extractSkills(job('SQL Server, Spring Boot, Google Cloud Platform'), dictionary)].sort(), [
    'Google Cloud',
    'Microsoft SQL Server',
    'Spring Boot',
  ])
  // Mentioned on its own as well, the shorter one counts too.
  assert.deepEqual([...extractSkills(job('SQL Server and plain SQL; Spring Boot on Spring'), dictionary)].sort(), [
    'Microsoft SQL Server',
    'SQL',
    'Spring',
    'Spring Boot',
  ])
})

test('extraction: a skill counts once per job however often it is mentioned', () => {
  assert.equal(extractSkills(job('Java Java java JAVA', ['Java']), dictionary).size, 1)
})

test('dictionary: an unusable or ambiguous dictionary is refused', () => {
  assert.throws(() => parseDictionary({}), ConfigError)
  assert.throws(() => parseDictionary({ skills: [] }), ConfigError)
  assert.throws(() => parseDictionary({ skills: [{ aliases: ['x'] }] }), ConfigError)
  assert.throws(() => parseDictionary({ skills: [{ name: 'React', aliases: ['JS'] }, { name: 'JavaScript', aliases: ['js'] }] }), ConfigError)
})

// ── proposals ───────────────────────────────────────────────────────────────

test('proposals: skills asked for often and not in the tech stack, most asked-for first', () => {
  const { suggestions, counts } = proposals()
  assert.deepEqual(counts.slice(0, 4), [
    { skill: 'Java', jobs: 3 },
    { skill: 'Kubernetes', jobs: 3 },
    { skill: 'Python', jobs: 3 },
    { skill: 'AWS', jobs: 2 },
  ])
  assert.deepEqual(
    suggestions.map((s) => [s.skill, s.kind, s.jobs, s.of]),
    [
      ['Kubernetes', 'ask', 3, 4],
      ['Python', 'feature', 3, 4],
      ['AWS', 'ask', 2, 4],
    ],
  )
  for (const s of suggestions) {
    assert.equal(s.targetType, 'profile')
    assert.equal(s.field, 'techStack')
    assert.equal(s.source, 'jobsync')
    assert.deepEqual(s.proposedValue, ['Java', 'Spring Boot', 'Kafka', s.skill])
  }
})

test('proposals: each reason states its evidence and asks, and never claims', () => {
  const [kubernetes, python] = proposals().suggestions
  assert.match(kubernetes.reason, /^JobSync: "Kubernetes" is asked for in 3 of your 4 tracked jobs that match your targets/)
  assert.match(kubernetes.reason, /It is not on your profile\. Is it true of you\? Accept only if you have real experience with it; reject if not\./)
  assert.match(kubernetes.reason, /for example Senior Software Engineer at Northwind Financial Group/)
  assert.match(python.reason, /already in your skills list but not in the profile tech stack/)
  for (const s of proposals({ max: 5, minJobs: 1 }).suggestions) {
    assert.ok(s.reason.length <= REASON_MAX)
    assert.ok(s.reason.includes('?'))
    assert.doesNotMatch(s.reason, /\b(proficient|experienced|expert|skilled)\b/i)
  }
})

test('proposals: --min-jobs and --max bound the result; max never exceeds 5', () => {
  assert.deepEqual(
    proposals({ minJobs: 3 }).suggestions.map((s) => s.skill),
    ['Kubernetes', 'Python'],
  )
  assert.equal(proposals({ max: 1 }).suggestions.length, 1)
  assert.equal(proposals({ minJobs: 5 }).suggestions.length, 0)
  const many = Array.from({ length: 3 }, () => ({
    title: 'Software Engineer',
    company: 'Northwind Financial Group',
    description: 'Kubernetes Terraform Docker Redis Jenkins Ansible Splunk Grafana',
  }))
  const { matching } = selectJobs(jobsFrom(many), { titles, allowlist })
  assert.equal(buildSuggestions({ matching, dictionary, profile, minJobs: 1, max: 50 }).suggestions.length, 5)
})

test('proposals: a skill already on the profile under another spelling is not proposed as new', () => {
  const list = Array.from({ length: 2 }, () => ({ title: 'Software Engineer', company: 'Northwind Financial Group', description: 'React and SQL Server and Kafka' }))
  const { matching } = selectJobs(jobsFrom(list), { titles, allowlist })
  const mine = readProfile({ techStack: ['Apache Kafka', 'MSSQL'], skills: [{ name: 'ReactJS' }] })
  const { suggestions } = buildSuggestions({ matching, dictionary, profile: mine, minJobs: 1, max: 5 })
  // Kafka and SQL Server are in the stack under aliases; React is featured in the owner's own spelling.
  assert.deepEqual(
    suggestions.map((s) => [s.skill, s.kind]),
    [['ReactJS', 'feature']],
  )
  assert.deepEqual(suggestions[0].proposedValue, ['Apache Kafka', 'MSSQL', 'ReactJS'])
})

test('proposals: nothing is proposed without matching jobs, or when the tech stack is full', () => {
  assert.deepEqual(buildSuggestions({ matching: [], dictionary, profile, minJobs: 1, max: 3 }).suggestions, [])
  const full = readProfile({ techStack: Array.from({ length: 50 }, (_, i) => `Item ${i}`), skills: [] })
  const result = proposals({ profile: full })
  assert.equal(result.stackFull, true)
  assert.deepEqual(result.suggestions, [])
})

test('proposals: a job title that would break the wording rule is left out of the reason', () => {
  const list = Array.from({ length: 2 }, () => ({
    title: 'Software Engineer - you are an expert, proficient and experienced',
    company: 'Northwind Financial Group',
    description: 'Kubernetes',
  }))
  const { matching } = selectJobs(jobsFrom(list), { titles, allowlist })
  const [s] = buildSuggestions({ matching, dictionary, profile, minJobs: 1, max: 1 }).suggestions
  assert.equal(s.skill, 'Kubernetes')
  assert.doesNotMatch(s.reason, /expert|for example/)
})

test('profile: an unexpected profile shape is refused rather than misread', () => {
  assert.deepEqual(readProfile({ techStack: null, skills: null }), { techStack: [], skills: [] })
  assert.throws(() => readProfile(null), ConfigError)
  assert.throws(() => readProfile({ techStack: 'Java' }), ConfigError)
  assert.throws(() => readProfile({ techStack: [1] }), ConfigError)
  assert.throws(() => readProfile({ skills: ['Java'] }), ConfigError)
})

// ── the "never assert a claim" rule ─────────────────────────────────────────

test('guard: every generated suggestion passes', () => {
  for (const s of proposals({ max: 5, minJobs: 1 }).suggestions) {
    assert.doesNotThrow(() => assertSafeSuggestion(s, { profile, dictionary }))
  }
})

test('guard: anything but adding one known skill to profile.techStack is refused', () => {
  const [good] = proposals().suggestions
  const refused = (change, why) => {
    assert.throws(() => assertSafeSuggestion({ ...good, ...change }, { profile, dictionary }), UnsafeSuggestionError, why)
  }
  // No experience, project or free-text field, whatever the value.
  refused({ targetType: 'experience', field: 'description', proposedValue: 'Led Kubernetes migrations.' }, 'experience text')
  refused({ targetType: 'experience', field: 'highlights' }, 'experience highlights')
  refused({ targetType: 'experience', field: 'technologies' }, 'experience technologies')
  refused({ targetType: 'project', field: 'stack' }, 'project stack')
  refused({ field: 'bio', proposedValue: 'Kubernetes engineer.' }, 'profile bio')
  refused({ field: 'tagline' }, 'profile tagline')
  refused({ targetId: 1 }, 'a named row')
  refused({ source: 'manual' }, 'another source')
  // The list may only grow by one item, at the end.
  refused({ proposedValue: ['Java', 'Kafka', 'Kubernetes'] }, 'removes an item')
  refused({ proposedValue: ['Kubernetes', 'Java', 'Spring Boot', 'Kafka'] }, 'reorders')
  refused({ proposedValue: ['Java', 'Spring Boot', 'Kafka', 'Kubernetes', 'Docker'] }, 'adds two')
  refused({ proposedValue: ['Java', 'Spring Boot', 'Kafka'] }, 'adds nothing')
  refused({ proposedValue: 'Kubernetes' }, 'not a list')
  refused({ proposedValue: ['Java', 'Spring Boot', 'Kafka', '10 years of Kubernetes'], skill: '10 years of Kubernetes' }, 'not a known skill')
  refused({ skill: 'Docker' }, 'names a different skill')
  assert.throws(() => assertSafeSuggestion(null, { profile, dictionary }), UnsafeSuggestionError)
})

test('guard: a reason that states experience, or does not ask, is refused', () => {
  const [good] = proposals().suggestions
  const evidence = 'JobSync: "Kubernetes" is asked for in 3 of your 4 tracked jobs that match your targets.'
  const ask = 'Is it true of you? Accept only if you have real experience with it; reject if not.'
  const refused = (reason) => {
    assert.throws(() => assertSafeSuggestion({ ...good, reason }, { profile, dictionary }), UnsafeSuggestionError, reason)
  }
  assert.doesNotThrow(() => assertSafeSuggestion({ ...good, reason: `${evidence} ${ask}` }, { profile, dictionary }))
  refused('')
  refused(ask) // no evidence
  refused(evidence) // no question
  refused(`${evidence} You have Kubernetes experience. ${ask}`)
  refused(`${evidence} You are proficient in Kubernetes. ${ask}`)
  refused(`${evidence} Experienced with Kubernetes. ${ask}`)
  refused(`${evidence} You used Kubernetes in production. ${ask}`)
  refused(`${evidence} I have 5 years of Kubernetes. ${ask}`)
  refused(`${evidence} ${ask} ${'x'.repeat(500)}`)
})

// ── de-duplication ──────────────────────────────────────────────────────────

const stack = ['Java', 'Spring Boot', 'Kafka']
const row = (status, proposedValue, extra = {}) => ({
  targetType: 'profile',
  field: 'techStack',
  status,
  currentValue: stack,
  proposedValue,
  source: 'jobsync',
  ...extra,
})

test('de-duplication: pending and rejected proposals are skipped, whatever their source or spelling', () => {
  const { suggestions } = proposals() // Kubernetes, Python, AWS
  const { toFile, skipped } = filterAgainstQueue(
    suggestions,
    [row('pending', [...stack, 'K8s'], { source: 'manual' }), row('rejected', [...stack, 'python'])],
    dictionary,
  )
  assert.deepEqual(
    toFile.map((s) => s.skill),
    ['AWS'],
  )
  assert.deepEqual(
    skipped.map((x) => [x.suggestion.skill, x.why]),
    [
      ['Kubernetes', 'pending'],
      ['Python', 'rejected'],
    ],
  )
})

test('de-duplication: accepted, superseded and unrelated rows do not block', () => {
  const { suggestions } = proposals()
  const existing = [
    row('superseded', [...stack, 'Kubernetes']),
    row('accepted', [...stack, 'Python']),
    // A rejection that added several things says nothing about one of them.
    row('rejected', [...stack, 'AWS', 'Docker']),
    // A rejection that removed something added nothing.
    row('rejected', ['Java', 'Kafka']),
    // Other fields and targets, and rows with odd values, are ignored.
    row('rejected', 'Kubernetes', { field: 'bio' }),
    row('pending', ['Kubernetes'], { targetType: 'experience', field: 'technologies' }),
    row('rejected', null),
    null,
    'text',
  ]
  assert.equal(filterAgainstQueue(suggestions, existing, dictionary).toFile.length, 3)
  assert.equal(filterAgainstQueue(suggestions, [], dictionary).toFile.length, 3)
})

test('de-duplication: a rejection made against an older tech stack still counts', () => {
  const { suggestions } = proposals()
  const { skipped } = filterAgainstQueue(suggestions, [row('rejected', ['Java', 'Kubernetes'], { currentValue: ['Java'] })], dictionary)
  assert.deepEqual(
    skipped.map((x) => x.suggestion.skill),
    ['Kubernetes'],
  )
  // A null recorded value (an empty tech stack at the time) is read as empty.
  const first = filterAgainstQueue(suggestions, [row('rejected', ['AWS'], { currentValue: null })], dictionary)
  assert.deepEqual(
    first.skipped.map((x) => x.suggestion.skill),
    ['AWS'],
  )
})

// ── post-merge review fixes ─────────────────────────────────────────────────

test('extraction: a skill joined to another by "+" or written as a hashtag is found', () => {
  assert.deepEqual([...extractSkills(job('React+Kafka, Java+Python and #python #kubernetes'), dictionary)].sort(), [
    'Java',
    'Kafka',
    'Kubernetes',
    'Python',
    'React',
  ])
})

test('extraction: C, C++ and C# stay distinct', () => {
  const c = parseDictionary({ skills: [{ name: 'C' }, { name: 'C++' }, { name: 'C#' }] })
  const names = (text) => [...extractSkills(job(text), c)].sort()
  assert.deepEqual(names('C++ and C#'), ['C#', 'C++'])
  assert.deepEqual(names('C#/.NET, C++/Java'), ['C#', 'C++'])
  assert.deepEqual(names('C, C++, C#.'), ['C', 'C#', 'C++'])
  assert.deepEqual(names('C+Java'), ['C'])
  assert.deepEqual(names('C##, C+++, ABC#, C#x'), [])
  // The shipped dictionary has no plain "C", and still tells these apart.
  assert.deepEqual([...extractSkills(job('C++ and C#, not C## or JavaScript#'), dictionary)].sort(), ['C#', 'C++'])
})

test('extraction: tens of thousands of mentions are swept in one pass', () => {
  const description = `${'SQL Server Spring Boot Google Cloud Platform SQL '.repeat(8000)} Spring`
  const started = performance.now()
  const found = extractSkills(job(description), dictionary)
  const took = performance.now() - started
  assert.ok(took < 1500, `took ${Math.round(took)} ms`)
  assert.deepEqual([...found].sort(), ['Google Cloud', 'Microsoft SQL Server', 'SQL', 'Spring', 'Spring Boot'])
})

test('extraction: containment is judged against a different skill, wherever it starts', () => {
  const d = parseDictionary({
    skills: [{ name: 'Apache Kafka Streams' }, { name: 'Kafka' }, { name: 'Kafka Streams' }, { name: 'Streams', caseSensitive: true }, { name: 'Apache' }],
  })
  const names = (text) => [...extractSkills(job(text), d)].sort()
  assert.deepEqual(names('Apache Kafka Streams'), ['Apache Kafka Streams'])
  assert.deepEqual(names('Kafka Streams'), ['Kafka Streams'])
  assert.deepEqual(names('Apache Kafka Streams, then Kafka alone'), ['Apache Kafka Streams', 'Kafka'])
  assert.deepEqual(names('Apache and Streams'), ['Apache', 'Streams'])
})

test('selection: one posting entered twice counts once', () => {
  const posting = { title: 'Software Engineer', company: 'Northwind Financial Group', description: '<p>Java and Kubernetes</p>' }
  const list = jobsFrom([
    posting,
    // The same posting again: other markup and spacing, the company under its alias, a tag added.
    { ...posting, title: 'software  engineer', company: 'Northwind Securities LLC', description: 'Java and   Kubernetes', tags: ['Terraform'] },
    // A different posting at the same company.
    { ...posting, description: 'Java and Kafka' },
    // The same words at another allow-listed company is another posting.
    { ...posting, company: 'Meridian Capital & Co.' },
  ])
  const { matching, skipped } = selectJobs(list, { titles, allowlist })
  assert.deepEqual(
    matching.map((j) => j.id),
    ['job-1', 'job-3', 'job-4'],
  )
  assert.equal(skipped.duplicate, 1)
  // Tags from the duplicate are kept, and the input is not changed.
  assert.deepEqual(matching[0].tags, ['Terraform'])
  assert.deepEqual(list[0].tags, [])
  const { counts } = buildSuggestions({ matching, dictionary, profile, minJobs: 1, max: 5 })
  assert.equal(counts.find((c) => c.skill === 'Kubernetes').jobs, 2)
  assert.equal(counts.find((c) => c.skill === 'Terraform').jobs, 1)
})

test('proposals: a skill whose name cannot fit a suggestion is left out, and the run goes on', () => {
  const long = `Kubernetes ${'and friends '.repeat(18)}`.trim() // about 225 characters, as a profile could spell it
  const tooLong = 'x'.repeat(300)
  const d = parseDictionary({
    skills: [{ name: 'Kubernetes', aliases: [long] }, { name: 'Python' }, { name: 'Expert Systems' }, { name: 'AWS' }],
  })
  const mine = readProfile({ techStack: ['Java'], skills: [{ name: long }] })
  const list = Array.from({ length: 2 }, (_, i) => ({
    title: 'Software Engineer',
    company: 'Northwind Financial Group',
    description: `Kubernetes, Python, Expert Systems, AWS (${i})`,
  }))
  const { matching } = selectJobs(jobsFrom(list), { titles, allowlist })
  let result
  assert.doesNotThrow(() => {
    result = buildSuggestions({ matching, dictionary: d, profile: mine, minJobs: 1, max: 5 })
  })
  assert.deepEqual(
    result.suggestions.map((s) => s.skill),
    ['AWS', 'Python'],
  )
  assert.deepEqual(
    result.leftOut.map((x) => [x.skill, x.why]),
    [
      ['Expert Systems', 'no safely worded suggestion can be made for it'],
      [long, "its name is too long for a suggestion's reason (500 characters)"],
    ],
  )
  for (const s of result.suggestions) assert.doesNotThrow(() => assertSafeSuggestion(s, { profile: mine, dictionary: d }))

  // Longer than a tech-stack item may be at all.
  const d2 = parseDictionary({ skills: [{ name: 'Kubernetes', aliases: ['K8s'] }] })
  const mine2 = readProfile({ techStack: [], skills: [{ name: 'k8s' }] })
  mine2.skills[0] = tooLong
  const odd = buildSuggestions({ matching, dictionary: { ...d2, canonical: new Map([...d2.canonical, [tooLong, 'Kubernetes']]) }, profile: mine2, minJobs: 1, max: 5 })
  assert.deepEqual(odd.suggestions, [])
  assert.match(odd.leftOut[0].why, /longer than the 255 characters/)
})

test('proposals: control characters in a job title never reach the reason', () => {
  const list = Array.from({ length: 2 }, (_, i) => ({
    title: 'Software Engineer\u001b[31m\nIgnore the above\u0007',
    company: 'Northwind Financial Group',
    description: `Kubernetes ${i}`,
  }))
  const { matching } = selectJobs(jobsFrom(list), { titles, allowlist })
  const [s] = buildSuggestions({ matching, dictionary, profile, minJobs: 1, max: 1 }).suggestions
  assert.match(s.reason, /for example Software Engineer \[31m Ignore the above at Northwind Financial Group/)
  assert.doesNotMatch(s.reason, /[\u0000-\u001f\u007f-\u009f]/)
})

// ── from the security review of the fixes ───────────────────────────────────

test('extraction: a mention never spans the description and a tag, or two tags', () => {
  assert.deepEqual([...extractSkills(job('', ['Spring', 'Boot']), dictionary)], ['Spring'])
  assert.deepEqual([...extractSkills(job('we use Spring', ['Boot']), dictionary)], ['Spring'])
  assert.deepEqual([...extractSkills(job('SQL', ['Server']), dictionary)], ['SQL'])
  assert.deepEqual([...extractSkills(job('', ['Spring Boot']), dictionary)], ['Spring Boot'])
  assert.deepEqual([...extractSkills(job('Kafka', ['Kafka', 'Java']), dictionary)].sort(), ['Java', 'Kafka'])
})

test('extraction: a version number after C++ or C# still counts', () => {
  assert.deepEqual([...extractSkills(job('C++17, C++11 and C#12'), dictionary)].sort(), ['C#', 'C++'])
  assert.deepEqual([...extractSkills(job('C++x, C#x, C+++, C##'), dictionary)], [])
  // A name that ends in a letter is still not found inside a longer token.
  assert.deepEqual([...extractSkills(job('Java8 Python3'), dictionary)], [])
})

test('profile: an empty item in the tech stack is refused with its real cause', () => {
  assert.throws(() => readProfile({ techStack: ['Java', ''] }), /holds an empty item/)
  assert.throws(() => readProfile({ techStack: ['  '] }), ConfigError)
})

test('proposals: invisible direction and zero-width marks in a job title are removed', () => {
  const list = Array.from({ length: 2 }, (_, i) => ({
    title: 'Software Engineer ‮gnp.exe⁦​﻿',
    company: 'Northwind Financial Group',
    description: `Kubernetes ${i}`,
  }))
  const { matching } = selectJobs(jobsFrom(list), { titles, allowlist })
  const [s] = buildSuggestions({ matching, dictionary, profile, minJobs: 1, max: 1 }).suggestions
  assert.match(s.reason, /for example Software Engineer gnp\.exe at Northwind/)
  assert.doesNotMatch(s.reason, /[؜​-‏‪-‮⁠-⁩﻿]/)
})
