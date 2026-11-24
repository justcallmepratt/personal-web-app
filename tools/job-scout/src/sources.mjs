// Reads the companies' own careers-site search APIs (public, no sign-in). Only searches
// and reads postings; never applies, submits or contacts anyone.

import { htmlToText, titleFits } from './score.mjs'

const UA = 'Mozilla/5.0 (job-scout; personal job tracker)'
const NON_US = /india|bengaluru|bangalore|hyderabad|pune|chennai|mumbai|london|dublin|ireland|poland|warsaw|krakow|glasgow|singapore|hong kong|canada|toronto|mexico|philippines|manila|budapest|hungary|costa rica|china|shanghai|japan|tokyo|united kingdom|belfast|edinburgh|luxembourg|germany|brazil|argentina|sydney|australia|kuala|malaysia|taiwan|sri lanka|israel|paris|france|zurich|switzerland|madrid|spain|portugal|lisbon|chile|colombia|south africa|dubai|saudi|qatar/i
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PACE = 1000 // ms between requests to one site
// Oracle's finder syntax needs its = ; , separators left as they are.
const finderParam = (text) => encodeURIComponent(text).replace(/%3D/g, '=').replace(/%3B/g, ';').replace(/%2C/g, ',')

// A 429 (rate limited) waits for Retry-After, or 15 s doubling, and tries again; the
// weekly run has time to spare, so being slow beats losing a source.
export async function http(url, { body, fetchImpl = fetch, wait = sleep, retries = 4 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(url, {
      method: body ? 'POST' : 'GET',
      headers: { Accept: 'application/json', 'User-Agent': UA, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    })
    if (res.status === 429 && attempt < retries) {
      const after = Number(res.headers.get('retry-after'))
      await wait(Math.min(Number.isFinite(after) && after > 0 ? after * 1000 : 15_000 * 2 ** attempt, 300_000))
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`)
    return res
  }
}
const json = async (url, opts) => (await http(url, opts)).json()

async function workday(src, terms, opts) {
  const base = `https://${src.host}/wday/cxs/${src.tenant}/${src.site}`
  const found = new Map()
  for (const searchText of terms) {
    for (const offset of [0, 20]) {
      const d = await json(`${base}/jobs`, { ...opts, body: { appliedFacets: {}, limit: 20, offset, searchText } })
      for (const p of d.jobPostings ?? []) if (!found.has(p.externalPath)) found.set(p.externalPath, p)
      if ((d.jobPostings ?? []).length < 20) break
      await sleep(PACE)
    }
  }
  const out = []
  for (const p of found.values()) {
    if (!titleFits(p.title) || NON_US.test(p.locationsText ?? '')) continue
    const info = (await json(`${base}${p.externalPath}`, opts)).jobPostingInfo ?? {}
    await sleep(PACE)
    if (info.country?.descriptor && !/united states/i.test(info.country.descriptor)) continue
    const location = [info.location, ...(info.additionalLocations ?? [])].filter(Boolean).join(' / ')
    out.push({ company: src.company, title: info.title ?? p.title, location: [location, info.remoteType].filter(Boolean).join(' / '),
      posted: info.startDate ?? null, url: info.externalUrl, description: htmlToText(info.jobDescription) })
  }
  return out
}

async function jpmc(src, _terms, opts) {
  const api = 'https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/latest'
  const US = 300000000289738 // the "United States" location facet on JPMorgan's site
  const found = new Map()
  for (const kw of ['java software engineer', 'kafka', 'spring boot', 'forward deployed']) {
    for (let offset = 0; offset < 100; offset += 25) {
      const finder = `findReqs;siteNumber=CX_1001,keyword="${kw}",locationId=${US},limit=25,offset=${offset},sortBy=POSTING_DATES_DESC`
      const d = await json(`${api}/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList&finder=${finderParam(finder)}`, opts)
      const list = d.items?.[0]?.requisitionList ?? []
      for (const r of list) if (!found.has(r.Id)) found.set(r.Id, r)
      if (list.length < 25) break
      await sleep(PACE)
    }
  }
  const out = []
  for (const r of found.values()) {
    if (!titleFits(r.Title) || !/united states/i.test(r.PrimaryLocation ?? '')) continue
    const finder = `ById;Id="${r.Id}",siteNumber=CX_1001`
    const d = (await json(`${api}/recruitingCEJobRequisitionDetails?expand=all&onlyData=true&finder=${finderParam(finder)}`, opts)).items?.[0] ?? {}
    await sleep(PACE)
    out.push({ company: src.company, title: r.Title, location: [r.PrimaryLocation, d.WorkplaceType].filter(Boolean).join(' / '), posted: r.PostedDate ?? null,
      url: `https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/${r.Id}`,
      description: htmlToText([d.ExternalDescriptionStr, d.ExternalQualificationsStr, d.ExternalResponsibilitiesStr].filter(Boolean).join(' ')) })
  }
  return out
}

async function bofa(src, _terms, opts) {
  const d = await json('https://careers.bankofamerica.com/services/jobssearchservlet?start=0&rows=2500&search=getAllJobs', opts)
  const out = []
  for (const j of d.jobsList ?? []) {
    if (j.country !== 'United States' || j.family !== 'Technology' || !titleFits(j.postingTitle) || j.minYearsOfExperience > 4) continue
    const url = `https://careers.bankofamerica.com${j.jcrURL}`
    const page = await (await http(url, opts)).text()
    await sleep(PACE)
    const body = page.match(/class="[^"]*job-description-body[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? page
    const [m, day, y] = String(j.postedDate ?? '').split('/')
    out.push({ company: src.company, title: j.postingTitle, location: `${j.city}, ${j.state}`, posted: y ? `${y}-${m}-${day}` : null,
      url, description: htmlToText(body).slice(0, 12000), years: j.minYearsOfExperience })
  }
  return out
}

const READERS = { workday, 'oracle-jpmc': jpmc, bofa }

/**
 * Reads every source. A source that fails is reported and skipped; the others still run.
 * @returns {Promise<{postings: object[], failures: {company: string, error: string}[]}>}
 */
export async function collect(sources, terms, { log = () => {}, fetchImpl } = {}) {
  const postings = []
  const failures = []
  for (const src of sources) {
    const read = READERS[src.type]
    if (!read) { failures.push({ company: src.company, error: `unknown source type ${src.type}` }); continue }
    try {
      const found = await read(src, terms, { fetchImpl })
      log(`  ${src.company}: ${found.length} candidate postings`)
      postings.push(...found)
    } catch (error) {
      const message = String(error?.message ?? error).slice(0, 200)
      failures.push({ company: src.company, error: message })
      log(`  ${src.company}: failed (${message})`)
    }
  }
  return { postings, failures }
}
