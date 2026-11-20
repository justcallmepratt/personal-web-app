export interface ApiResponse {
  success: boolean
  message: string
}

/** A record the Kafka demo's consumer has read from the topic and stored. */
export interface KafkaRecord {
  id: string
  key: string
  content: string
  /** When the consumer stored it: ISO local date-time in the service's zone (UTC). */
  timestamp: string
  topic: string
}

export interface KafkaMessagesResponse extends ApiResponse {
  records: KafkaRecord[]
}
