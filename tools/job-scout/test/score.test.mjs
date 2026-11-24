// Synthetic postings only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { htmlToText, minYears, reason, scorePosting, titleFits } from '../src/score.mjs'
import { DUMP_SQL } from '../src/jobsync.mjs'

test('titleFits keeps developer roles below senior', () => {
  assert.ok(titleFits('Software Engineer II - Java/Kafka'))
  assert.ok(titleFits('Senior Associate, Software Engineer'))
  assert.ok(titleFits('Forward Deployed Engineer'))
  for (const t of ['Senior Software Engineer', 'Lead Java Developer', 'Principal Engineer', 'Software Engineering Manager', 'QA Test Developer', 'Summer Intern - Software'])
    assert.equal(titleFits(t), false, t)
})

test('minYears reads the smallest stated requirement', () => {
  assert.equal(minYears('3+ years of Java and 5 years overall'), 3)
  assert.equal(minYears('no requirement stated'), null)
})

test('scorePosting favours Java/Kafka, 2-4 years and Tampa', () => {
  const strong = scorePosting({ title: 'Software Engineer II', location: 'Tampa, FL', description: 'Java, Spring Boot, Kafka, microservices, SQL, REST APIs. 2+ years.' })
  const weak = scorePosting({ title: 'Software Engineer', location: 'Buffalo, NY', description: 'Snowflake reporting. 8 years.' })
  assert.ok(strong.score >= 90, String(strong.score))
  assert.ok(weak.score < 40, String(weak.score))
  assert.deepEqual(strong.skills.slice(0, 3), ['Java', 'Spring Boot', 'Kafka'])
  assert.equal(strong.years, 2)
  assert.equal(scorePosting({ title: 'x', description: 'Java', years: 4 }).years, 4)
})

test('reason and htmlToText', () => {
  assert.equal(reason({ skills: ['Java'], years: null, location: 'Remote' }), 'Matches Java; years not stated; remote option')
  assert.equal(htmlToText('<p>Java &amp; Kafka</p><script>x</script>'), 'Java & Kafka')
})

test('the dump keeps the fields tools/jobsync-importer reads', () => {
  for (const field of ["'Job'", "'jobTitleId'", "'companyId'", "'description'", "'statusValue'", "'JobTitle'", "'Company'", "'Tag'", "'_JobToTag'", "'jobId'", "'tagId'"])
    assert.ok(DUMP_SQL.includes(field), field)
})

test('http waits and retries after a 429', async () => {
  const { http } = await import('../src/sources.mjs')
  const answers = [new Response('', { status: 429, headers: { 'retry-after': '2' } }), new Response('{"ok":1}', { status: 200 })]
  const waits = []
  const res = await http('https://example.test/x', { fetchImpl: async () => answers.shift(), wait: async (ms) => waits.push(ms) })
  assert.deepEqual(await res.json(), { ok: 1 })
  assert.deepEqual(waits, [2000])
})
