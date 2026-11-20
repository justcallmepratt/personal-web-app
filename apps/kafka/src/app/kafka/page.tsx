import KafkaDemo from '@/components/sections/KafkaDemo'
import GlitchText from '@/components/ui/GlitchText'
import NeonButton from '@/components/ui/NeonButton'
import { kafkaDemoUrl } from '@/lib/kafka'

export const metadata = { title: 'Kafka Live Demo' }

const REPO_URL = 'https://github.com/justcallmepratt/Kafka-Producer-Consumer-Demo'

// Static page. Whether the demo is connected is decided at build time, so an
// unconfigured deployment never calls a function to find out.
export default function KafkaDemoPage() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-16 space-y-6">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl tracking-wider">
        <GlitchText text="// KAFKA LIVE DEMO" />
      </h1>
      <p className="max-w-3xl text-cp-text/80">
        Send a record and watch it travel through a real Apache Kafka broker: a Spring Boot producer
        publishes it to a topic, a consumer group reads it back and stores it, and it shows up below.
        You only see records produced from this browser session.
      </p>
      <KafkaDemo configured={kafkaDemoUrl() !== null} />
      <NeonButton href={REPO_URL} target="_blank" rel="noreferrer" accent="yellow">
        Source on GitHub
      </NeonButton>
    </section>
  )
}
