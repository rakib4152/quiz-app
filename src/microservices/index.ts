/**
 * Microservices Architecture & Kafka Interconnection Orchestrator
 *
 * Microservices:
 * 1. User Service (src/microservices/user-service)
 * 2. Question Service (src/microservices/question-service)
 * 3. Quiz Service (src/microservices/quiz-service)
 * 4. Payment Service (src/microservices/payment-service)
 *
 * Interconnected via Apache Kafka event bus:
 * - exampro.users.events
 * - exampro.questions.events
 * - exampro.quizzes.events
 * - exampro.attempts.events
 * - exampro.payments.events
 */

import { userKafkaConsumer } from './user-service/userConsumer';
import { questionKafkaConsumer } from './question-service/questionConsumer';
import { quizKafkaConsumer } from './quiz-service/quizConsumer';
import { paymentKafkaConsumer } from './payment-service/paymentConsumer';

export * from './kafka';
export * from './user-service';
export * from './question-service';
export * from './quiz-service';
export * from './payment-service';
export * from './serviceRegistry';

let isInitialized = false;

/**
 * Bootstraps all microservices Kafka consumers for asynchronous inter-service event processing
 */
export function initMicroservices() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('[Microservices] Initializing Kafka event bus interconnections...');
  userKafkaConsumer.start();
  questionKafkaConsumer.start();
  quizKafkaConsumer.start();
  paymentKafkaConsumer.start();
  console.log('[Microservices] All microservices successfully connected via Apache Kafka.');
}

// Auto-initialize in runtime
if (typeof window !== 'undefined') {
  initMicroservices();
}
