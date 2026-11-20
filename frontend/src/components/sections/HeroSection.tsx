import HUDChrome from '@/components/layout/HUDChrome'
import GlitchText from '@/components/ui/GlitchText'
import NeonButton from '@/components/ui/NeonButton'
import type { Profile } from '@/lib/types'

export default function HeroSection({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center">
        <h1 className="text-cp-red">{'// PROFILE NOT FOUND //'}</h1>
      </section>
    )
  }
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 sm:py-16 md:py-24 grid md:grid-cols-3 gap-6 md:gap-8">
      <div className="md:col-span-2 space-y-5">
        <p className="text-cp-teal text-xs uppercase tracking-[0.4em] terminal-cursor">
          init: portfolio.exe
        </p>
        {/* Scale down on smallest phones; bump up at sm+ */}
        <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl md:text-7xl tracking-tight text-cp-text leading-[1.1]">
          <GlitchText text={profile.name} />
        </h1>
        <p className="font-[var(--font-mono)] text-cp-yellow text-base sm:text-lg">
          {'// '}{profile.tagline}
        </p>
        <p className="max-w-xl text-cp-text/80 leading-relaxed text-sm sm:text-base">{profile.bio}</p>

        {/* Stack vertically on mobile → row from sm up */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
          <NeonButton href="/projects" accent="teal" className="w-full sm:w-auto justify-center">
            View Projects
          </NeonButton>
          {/* Only when the content names a real CV file; there is no placeholder PDF. */}
          {profile.cvUrl && (
            <NeonButton href={profile.cvUrl} accent="yellow" className="w-full sm:w-auto justify-center">
              Download CV
            </NeonButton>
          )}
          <NeonButton href="/contact" accent="red" className="w-full sm:w-auto justify-center">
            Contact
          </NeonButton>
        </div>
      </div>

      <HUDChrome accent="yellow" title="System Profile">
        <dl className="space-y-3 text-sm font-[var(--font-mono)]">
          <div>
            <dt className="text-cp-teal text-xs uppercase tracking-widest">Location</dt>
            <dd className="text-cp-text">{profile.location || '—'}</dd>
          </div>
          {profile.email && (
            <div>
              <dt className="text-cp-teal text-xs uppercase tracking-widest">Comm</dt>
              <dd className="text-cp-text break-all">{profile.email}</dd>
            </div>
          )}
          <div>
            <dt className="text-cp-teal text-xs uppercase tracking-widest">Stack</dt>
            <dd className="flex flex-wrap gap-1 pt-1">
              {profile.techStack.map((t) => (
                <span key={t} className="px-2 py-0.5 text-[10px] uppercase border border-cp-teal/40 text-cp-teal/90">
                  {t}
                </span>
              ))}
            </dd>
          </div>
          {Object.keys(profile.socials).length > 0 && (
            <div>
              <dt className="text-cp-teal text-xs uppercase tracking-widest">Net</dt>
              <dd className="flex flex-col gap-1 pt-1">
                {Object.entries(profile.socials).map(([k, v]) => (
                  <a key={k} href={v} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-6 text-cp-yellow hover:underline">
                    <span aria-hidden="true">▶&nbsp;</span>{k}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </HUDChrome>
    </section>
  )
}
