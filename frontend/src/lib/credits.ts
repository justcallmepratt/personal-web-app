// What this site is built with, as it is in the repository today. Keep this
// list truthful: add an entry when something ships, remove it when it goes.
// Licences were read from each project's own package metadata or licence file;
// the font licences come from the google/fonts repository (see FONT_SOURCE).

export interface CreditEntry {
  name: string
  /** What it is used for here. */
  role: string
  /** SPDX-style licence name, when verified. */
  licence?: string
  /** Official site (or, for fonts, the Google Fonts page). */
  url: string
  /** Link to the licence text, when one is worth pointing at. */
  licenceUrl?: string
}

export interface CreditSection {
  id: string
  title: string
  intro?: string
  items: CreditEntry[]
}

export const GUIDELINE_URL = 'https://cdprojektred.com/fan-content/'
export const GUIDELINE_NAME = 'CD PROJEKT RED Fan Content Guideline'
/** The date printed on the guideline page, and the day it was last re-read. */
export const GUIDELINE_UPDATED = 'December 10, 2020'
export const GUIDELINE_CHECKED = '2026-11-20'

/** The wording the guideline asks for, in full and in the footer's short form. */
export const DISCLAIMER_FULL =
  'This is an unofficial fan work and is not approved or endorsed by CD PROJEKT RED.'
export const DISCLAIMER_SHORT = 'Unofficial fan work, not endorsed by CD PROJEKT RED.'

const OFL_URL = 'https://openfontlicense.org/open-font-license-official-text/'

export const creditSections: CreditSection[] = [
  {
    id: 'web',
    title: 'Website',
    intro: 'The public site in frontend/.',
    items: [
      { name: 'Next.js', role: 'React framework; static pages', licence: 'MIT', url: 'https://nextjs.org' },
      { name: 'React', role: 'UI library', licence: 'MIT', url: 'https://react.dev' },
      { name: 'Tailwind CSS', role: 'Styling', licence: 'MIT', url: 'https://tailwindcss.com' },
      { name: 'Motion (Framer Motion)', role: 'Animation', licence: 'MIT', url: 'https://motion.dev' },
      { name: 'Nodemailer', role: 'Sends contact-form email', licence: 'MIT-0', url: 'https://nodemailer.com' },
      { name: 'TypeScript', role: 'Language', licence: 'Apache-2.0', url: 'https://www.typescriptlang.org' },
    ],
  },
  {
    id: 'api',
    title: 'API (not live yet)',
    intro: 'The Spring Boot service in backend/. The live site currently serves the content in this repository.',
    items: [
      { name: 'Spring Boot', role: 'Java application framework', licence: 'Apache-2.0', url: 'https://spring.io/projects/spring-boot' },
      { name: 'PostgreSQL JDBC Driver', role: 'Database driver', licence: 'BSD-2-Clause', url: 'https://jdbc.postgresql.org' },
      { name: 'jjwt', role: 'JSON Web Tokens for admin sign-in', licence: 'Apache-2.0', url: 'https://github.com/jwtk/jjwt' },
      { name: 'springdoc-openapi', role: 'API documentation', licence: 'Apache-2.0', url: 'https://springdoc.org' },
    ],
  },
  {
    id: 'tooling',
    title: 'Testing and tooling',
    items: [
      { name: 'Vitest', role: 'Test runner', licence: 'MIT', url: 'https://vitest.dev' },
      { name: 'Testing Library', role: 'Component tests', licence: 'MIT', url: 'https://testing-library.com' },
      { name: 'ESLint', role: 'Linting', licence: 'MIT', url: 'https://eslint.org' },
      { name: 'jsdom', role: 'Browser environment for tests', licence: 'MIT', url: 'https://github.com/jsdom/jsdom' },
    ],
  },
  {
    id: 'hosting',
    title: 'Hosting and data',
    items: [
      { name: 'Vercel', role: 'Hosts this site (static pages)', url: 'https://vercel.com' },
      { name: 'Supabase', role: 'Postgres database', url: 'https://supabase.com' },
      { name: 'Railway', role: 'Planned host for the API. Not live yet.', url: 'https://railway.com' },
      { name: 'GitHub', role: 'Source code and CI', url: 'https://github.com' },
    ],
  },
  {
    id: 'fonts',
    title: 'Fonts',
    intro:
      'Loaded through next/font/google, which downloads the font files at build time and serves them from this site. All three are licensed under the SIL Open Font License 1.1.',
    items: [
      {
        name: 'Orbitron',
        role: 'Headings. Matt McInerney, The Orbitron Project Authors',
        licence: 'OFL-1.1',
        url: 'https://fonts.google.com/specimen/Orbitron',
        licenceUrl: 'https://github.com/google/fonts/blob/main/ofl/orbitron/OFL.txt',
      },
      {
        name: 'Rajdhani',
        role: 'Body text. Indian Type Foundry',
        licence: 'OFL-1.1',
        url: 'https://fonts.google.com/specimen/Rajdhani',
        licenceUrl: 'https://github.com/google/fonts/blob/main/ofl/rajdhani/OFL.txt',
      },
      {
        name: 'Share Tech Mono',
        role: 'Labels and code. Ralph du Carrois, Carrois Type Design',
        licence: 'OFL-1.1',
        url: 'https://fonts.google.com/specimen/Share+Tech+Mono',
        licenceUrl: 'https://github.com/google/fonts/blob/main/ofl/sharetechmono/OFL.txt',
      },
    ],
  },
]

export const OFL_TEXT_URL = OFL_URL

/** Stated explicitly so the page does not imply assets it does not have. */
export const THIRD_PARTY_ASSETS_NOTE =
  'Apart from the fonts listed below, the site loads no third-party images, music, logos or embedded players. It does not include artwork, logos or music from CD PROJEKT RED games.'
