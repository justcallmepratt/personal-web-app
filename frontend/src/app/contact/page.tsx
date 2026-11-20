import ContactForm from '@/components/sections/ContactForm'
import GlitchText from '@/components/ui/GlitchText'
import { publicContactEmail } from '@/lib/contactEmail'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Contact // Open Channel',
  description: 'Open a channel: send a message through the contact form.',
  path: '/contact',
})

export default function ContactPage() {
  const directEmail = publicContactEmail()
  return (
    <section className="max-w-2xl md:max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-6">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl tracking-wider">
        <GlitchText text="// OPEN CHANNEL" />
      </h1>
      <p className="text-cp-text/80 font-[var(--font-mono)] text-sm">
        Transmissions encrypted. Replies routed via secure netrunner relay.
      </p>
      <ContactForm />
      {directEmail && (
        <p className="text-cp-text/80 font-[var(--font-mono)] text-sm">
          Or email me directly:{' '}
          <a href={`mailto:${directEmail}`} className="text-cp-yellow underline">
            {directEmail}
          </a>
        </p>
      )}
    </section>
  )
}
