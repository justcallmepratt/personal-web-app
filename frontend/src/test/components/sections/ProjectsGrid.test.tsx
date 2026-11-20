import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProjectsGrid from '@/components/sections/ProjectsGrid'
import type { Project } from '@/lib/types'

function makeProject(id: number, title: string): Project {
  return {
    id,
    title,
    description: 'A project description',
    longDescription: '',
    tags: ['React'],
    stack: ['Next.js'],
    demoUrl: '',
    repoUrl: 'https://github.com/example/repo',
    imageUrl: '',
    featured: false,
    sortOrder: id,
    createdAt: '2024-01-01T00:00:00',
  }
}

describe('ProjectsGrid', () => {
  it('renders all projects', () => {
    render(<ProjectsGrid projects={[makeProject(1, 'Project Alpha'), makeProject(2, 'Project Beta')]} />)
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    expect(screen.getByText('Project Beta')).toBeInTheDocument()
  })

  it('renders a NeonCard for each project', () => {
    render(<ProjectsGrid projects={[makeProject(1, 'Alpha'), makeProject(2, 'Beta'), makeProject(3, 'Gamma')]} />)
    // Each NeonCard shows the project title
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
  })

  it('renders empty state when no projects', () => {
    const { container } = render(<ProjectsGrid projects={[]} />)
    // No project headings
    expect(container.querySelectorAll('h2, h3').length).toBe(0)
  })
})
