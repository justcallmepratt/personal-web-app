import GitHubActivity from '@/components/sections/GitHubActivity'
import HeroSection from '@/components/sections/HeroSection'
import ProjectsGrid from '@/components/sections/ProjectsGrid'
import GlitchText from '@/components/ui/GlitchText'
import NeonButton from '@/components/ui/NeonButton'
import { api } from '@/lib/api'
import { getGitHubActivity } from '@/lib/github'
import { pageMetadata, siteDescription } from '@/lib/site'

// No `title`: the home page uses the site-wide default title.
export const metadata = pageMetadata({ description: siteDescription, path: '/' })

export default async function HomePage() {
  const [profile, featured, github] = await Promise.all([
    api.getProfile().catch(() => null),
    api.getProjects(true).catch(() => []),
    getGitHubActivity(), // never throws; falls back to a profile link
  ])

  return (
    <>
      <HeroSection profile={profile} />
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-[var(--font-display)] text-2xl tracking-wider">
              <GlitchText text="// FEATURED OPS" />
            </h2>
            <NeonButton href="/projects" accent="yellow">All Projects</NeonButton>
          </div>
          <ProjectsGrid projects={featured} headingLevel={3} />
        </section>
      )}
      <GitHubActivity activity={github} />
    </>
  )
}
