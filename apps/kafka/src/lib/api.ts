import type { ApiResponse, KafkaMessagesResponse } from './types'

// Browser-side calls. They go to this app's own route handlers under
// /kafka/api, which relay to the Kafka demo service (see lib/kafka.ts).
export const api = {
  kafkaProduce: (body: { sid: string; key: string; message: string }): Promise<ApiResponse> =>
    fetch('/kafka/api/produce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  kafkaMessages: (sid: string): Promise<KafkaMessagesResponse> =>
    fetch(`/kafka/api/messages?sid=${sid}`, { cache: 'no-store' }).then((r) => r.json()),
}
