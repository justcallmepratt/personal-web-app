// Redirects served by this app, used by next.config.ts. Kept here so the tests
// can check them without loading the Next.js config.

export interface SiteRedirect {
  source: string
  destination: string
  permanent: boolean
}

/**
 * `/kafka` is the address reserved for the `apps/kafka` micro-frontend, which
 * is not deployed. Until it is, the Kafka demo's one home is `/projects/kafka`
 * and everything under `/kafka` is sent there. Order matters: the first match
 * wins, so the two relay endpoints come before the catch-all. Query strings
 * are passed through by Next.js, and 308 keeps the request method.
 */
export const kafkaRedirects: readonly SiteRedirect[] = [
  { source: '/kafka/api/produce', destination: '/api/kafka/produce', permanent: true },
  { source: '/kafka/api/messages', destination: '/api/kafka/messages', permanent: true },
  { source: '/kafka/:path*', destination: '/projects/kafka', permanent: true },
]

export const siteRedirects: readonly SiteRedirect[] = [...kafkaRedirects]
