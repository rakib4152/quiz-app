/**
 * Apache Kafka Topic Registry and Event Schemas for Microservices Interconnection
 */

export const KAFKA_TOPICS = {
  USERS: 'exampro.users.events',
  QUESTIONS: 'exampro.questions.events',
  QUIZZES: 'exampro.quizzes.events',
  ATTEMPTS: 'exampro.attempts.events',
  PAYMENTS: 'exampro.payments.events',
  PAYMENT_TRANSACTIONS: 'exampro.payments.transactions',
  NOTIFICATIONS: 'exampro.notifications.dispatch',
  FLINK_ALERTS: 'exampro.flink.fraud-alerts',
  QUIZZES_CDC: 'exampro.quizzes.cdc',
} as const;

export type KafkaTopicName = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];

export interface BaseKafkaEvent<T = any> {
  eventId: string;
  topic: string;
  sourceService: 'user-service' | 'question-service' | 'quiz-service' | 'payment-service';
  eventType: string;
  traceId: string;
  timestamp: string;
  payload: T;
}
