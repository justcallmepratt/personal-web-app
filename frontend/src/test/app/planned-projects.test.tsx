import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import ProjectsPage from '@/app/projects/page'
import PlannedProjects from '@/components/sections/PlannedProjects'
import { api } from '@/lib/api'
import { plannedProjects, projects } from '@/content'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

const sample = [
  { id: 1, name: 'Idea One', goal: 'Does one thing.' },
  { id: 2, name: 'Idea Two', goal: 'Does another.' },
]

describe('PlannedProjects', () => {
  it('renders a labelled section saying nothing is built yet', () => {
    render(<PlannedProjects items={sample} />)
    const section = screen.getByRole('region', { name: /in the works/i })
    expect(within(section).getByRole('heading', { level: 2, name: /in the works/i })).toBeInTheDocument()
    expect(within(section).getByText('Planned projects. Nothing here is built yet.')).toBeInTheDocument()
    expect(within(section).getAllByRole('listitem')).toHaveLength(2)
    expect(within(section).getByRole('heading', { level: 3, name: 'Idea One' })).toBeInTheDocument()
    expect(within(section).getByText('Does another.')).toBeInTheDocument()
    expect(within(section).getAllByText('Planned')).toHaveLength(2)
  })

  it('has no links, no dates and no featured styling', () => {
    render(<PlannedProjects items={sample} />)
    const section = screen.getByRole('region', { name: /in the works/i })
    expect(within(section).queryByRole('link')).not.toBeInTheDocument()
    expect(section.textContent).not.toMatch(/featured|demo|repo|\b(19|20)\d{2}\b/i)
  })

  it('renders nothing when the array is empty', () => {
    const { container } = render(<PlannedProjects items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('planned projects in the content and API', () => {
  it('are the six planned items, each with only a name and a one-line goal', () => {
    expect(plannedProjects).toHaveLength(6)
    expect(plannedProjects.map((p) => p.name)).toEqual(expect.arrayContaining(['Deal Watch', 'TV Cleanup']))
    expect(plannedProjects.map((p) => p.name)).not.toContain('Athlink Upscale')
    expect(new Set(plannedProjects.map((p) => p.id)).size).toBe(plannedProjects.length)
    for (const p of plannedProjects) {
      expect(Object.keys(p).sort()).toEqual(['goal', 'id', 'name'])
      expect(p.name).toBeTruthy()
      expect(p.goal).not.toMatch(/https?:|\b(19|20)\d{2}\b/)
    }
  })

  it('never appear among projects or featured projects', async () => {
    vi.stubEnv('BACKEND_URL', '')
    const planned = await api.getPlannedProjects()
    expect(planned.map((p) => p.name)).toEqual(plannedProjects.map((p) => p.name))
    const names = new Set(planned.map((p) => p.name))
    for (const list of [projects, await api.getProjects(), await api.getProjects(true)]) {
      expect(list.some((p) => names.has(p.title))).toBe(false)
    }
  })

  it('getPlannedProjects never calls the API, even with BACKEND_URL set', async () => {
    vi.stubEnv('BACKEND_URL', 'http://backend.test')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await api.getPlannedProjects()).toHaveLength(plannedProjects.length)
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('/projects page', () => {
  it('lists planned items in their own section, after the real projects', async () => {
    vi.stubEnv('BACKEND_URL', '')
    render(await ProjectsPage())
    const section = screen.getByRole('region', { name: /in the works/i })
    for (const p of plannedProjects) {
      expect(within(section).getByRole('heading', { level: 3, name: p.name })).toBeInTheDocument()
    }
    // Real project cards stay outside the section and come first in the document.
    const firstReal = screen.getByRole('heading', { level: 2, name: projects[0].title })
    expect(section).not.toContainElement(firstReal)
    expect(firstReal.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows no section when there are no planned items or the getter fails', async () => {
    vi.stubEnv('BACKEND_URL', '')
    vi.spyOn(api, 'getPlannedProjects').mockResolvedValueOnce([])
    const { unmount } = render(await ProjectsPage())
    expect(screen.queryByText(/in the works/i)).not.toBeInTheDocument()
    unmount()

    vi.spyOn(api, 'getPlannedProjects').mockRejectedValueOnce(new Error('boom'))
    render(await ProjectsPage())
    expect(screen.queryByText(/in the works/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: projects[0].title })).toBeInTheDocument()
  })
})
