import type { ReactNode } from 'react'
import { pageMetadata } from '@/lib/site'

// The description, canonical link and social text for /projects live here so
// they sit beside the page without changing page.tsx; the page's own `title`
// export still wins for the document title, and it matches this one.
export const metadata = pageMetadata({
  title: 'Projects',
  description: 'Projects by Pratham Sachan, with the stack behind each one and links to demos and source code where they exist.',
  path: '/projects',
})

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return children
}
