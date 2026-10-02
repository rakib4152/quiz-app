import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';

/**
 * Quiz Service Kafka Consumer
 * Consumer Group: cg-quiz-service
 * Listens to: exampro.questions.events, exampro.payments.events
 */
export class QuizKafkaConsumer {
  private unsubs: (() => void)[] = [];
  private isConsuming = false;
  private proCache = new Set<string>();

  public start() {
    if (this.isConsuming) return;
    this.isConsuming = true;

    // Listen to question events
    const unsubQuestions = kafkaClient.subscribe(KAFKA_TOPICS.QUESTIONS, (record) => {
      this.handleQuestionEvent(record.value);
    });
    this.unsubs.push(unsubQuestions);

    // Listen to payment events
    const unsubPayments = kafkaClient.subscribe(KAFKA_TOPICS.PAYMENTS, (record) => {
      this.handlePaymentEvent(record.value);
    });
    this.unsubs.push(unsubPayments);

    console.log('[quiz-service] Kafka Consumer started on topics:', [
      KAFKA_TOPICS.QUESTIONS,
      KAFKA_TOPICS.PAYMENTS,
    ]);
  }

  public stop() {
    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];
    this.isConsuming = false;
  }

  private handleQuestionEvent(event: any) {
    if (!event || !event.eventType) return;
    if (event.eventType === 'QUESTION_CREATED') {
      console.log(`[quiz-service] New question ${event.payload?.questionId} registered in question-service. Updating quiz catalog.`);
    }
  }

  private handlePaymentEvent(event: any) {
    if (!event || !event.eventType) return;
    if (event.eventType === 'PAYMENT_COMPLETED') {
      const userId = event.payload?.userId;
      if (userId) {
        this.proCache.add(userId);
        console.log(`[quiz-service] Cached unlocked Pro tier for user ${userId} via Kafka.`);
      }
    }
  }
}

export const quizKafkaConsumer = new QuizKafkaConsumer();
