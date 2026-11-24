// Pure filtering and scoring: which postings fit the resume, and how well. No network.
// The weights mirror the resume: Java, Spring Boot and Kafka first, then SQL and
// microservices, then the tools around them. Early career, so 2-4 years asked fits best.

const INCLUDE = /software|developer|backend|back-end|back end|java|application engineer|applications engineer|forward deployed|full ?stack|programmer|engineer i\b|engineer ii\b|engineer 2|engineer 1|kafka|platform engineer|api engineer|integration engineer/i
const EXCLUDE = /\bsenior\b|\bsr\.?\b|staff|principal|\blead\b|director|manager|\bhead\b|architect|intern|co-op|summer|analyst program|data scien|quant|\bqa\b|quality|test|sales|network|infrastructure|mainframe|android|\bios\b|mobile|salesforce|servicenow|\bsap\b|\.net|c#|cobol|security|cyber|site reliability|\bsre\b|devops|tableau|power ?bi|executive|\bvp\b|vice president(?!;)|specialist|consultant|recruit|apprentice|marketing|designer|hardware|embedded|\bui\b|front ?end|frontend|flutter|data engineer|etl|database admin|\bdba\b|support engineer|administrator|engineer iv|engineer v\b|engineer 4|engineer 5|level 4|level 5|distinguished|expert|tech fellow|campus|graduate|new grad|analyst$/i

export const SKILLS = [
  ['Java', /\bjava\b/i, 3], ['Spring Boot', /spring/i, 3], ['Kafka', /kafka/i, 3], ['Confluent', /confluent/i, 1],
  ['Microservices', /micro-?services/i, 2], ['SQL', /\bsql\b|sql server|oracle|t-sql|pl\/sql/i, 2],
  ['REST APIs', /\brest\b|restful|\bapis?\b/i, 1], ['Distributed systems', /distributed|event-driven|streaming/i, 1],
  ['AWS', /\baws\b|cloud/i, 1], ['Splunk', /splunk/i, 1], ['Dynatrace', /dynatrace/i, 1], ['Angular', /angular/i, 1],
  ['Python', /python/i, 1], ['CI/CD', /ci\/cd|jenkins|\bgit\b/i, 1], ['Docker/K8s', /docker|kubernetes|openshift/i, 1],
]

/** A target title: a developer or engineer role below senior. Capital One's "Senior Associate" is mid level, so it counts. */
export function titleFits(title) {
  const t = String(title ?? '').replace(/senior associate/gi, 'associate')
  return INCLUDE.test(t) && !EXCLUDE.test(t)
}

/** The smallest "N years" the posting asks for, or null when it states none. */
export function minYears(text) {
  const years = [...String(text ?? '').matchAll(/(\d{1,2})\s*\+?\s*(?:or more |plus )?years?/gi)]
    .map((m) => Number(m[1])).filter((n) => n > 0 && n < 20)
  return years.length ? Math.min(...years) : null
}

/**
 * Scores a posting 0-100: skills overlap (55), seniority fit (30), location (15).
 * @returns {{score: number, skills: string[], years: number|null}}
 */
export function scorePosting({ title, location, description, years: statedYears }) {
  const text = String(description ?? '')
  const skills = SKILLS.filter(([, re]) => re.test(text)).map(([name]) => name)
  const weight = SKILLS.filter(([name]) => skills.includes(name)).reduce((sum, [, , w]) => sum + w, 0)
  const skillPart = Math.min(weight / 16, 1) * 55
  const years = statedYears ?? minYears(text)
  const levelled = /\b(i|ii|1|2|associate)\b/i.test(String(title ?? ''))
  let seniority
  if (years === null) seniority = 18 + (levelled ? 4 : 0)
  else if (years <= 2) seniority = 30
  else if (years <= 4) seniority = 27
  else if (years === 5) seniority = 12
  else seniority = 0
  const where = String(location ?? '').toLowerCase()
  let place = 6
  if (/tampa|st\.? petersburg|saint petersburg/.test(where)) place = 15
  else if (/remote|anywhere/.test(where)) place = 13
  else if (/florida|, fl\b|jacksonville|orlando|miami/.test(where)) place = 10
  return { score: Math.round(skillPart + seniority + place), skills, years }
}

/** One line for the tracker: what matched, the years asked, and where. */
export function reason({ skills, years, location }) {
  const where = /tampa/i.test(location ?? '') ? 'Tampa' : /remote|anywhere/i.test(location ?? '') ? 'remote option' : 'not Tampa'
  const asked = years === null ? 'years not stated' : `${years}+ yrs asked`
  return `Matches ${skills.slice(0, 4).join(', ') || 'few listed skills'}; ${asked}; ${where}`
}

/** Plain text from posting HTML. */
export function htmlToText(html) {
  return String(html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim()
}
