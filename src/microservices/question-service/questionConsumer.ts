import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';
import { questionService } from './questionService';

/**
 * Question Service Kafka Consumer
 * Consumer Group: cg-question-service
 * Listens to: exampro.attempts.events
 */
export class QuestionKafkaConsumer {
  private unsubscribe: (() => void) | null = null;
  private isConsuming = false;
  private processedEventIds = new Set<string>();

  public start() {
    if (this.isConsuming) return;
    this.isConsuming = true;

    this.unsubscribe = kafkaClient.subscribe(KAFKA_TOPICS.ATTEMPTS, (record) => {
      this.handleAttemptEvent(record.value);
    });

    console.log('[question-service] Kafka Consumer started on topic:', KAFKA_TOPICS.ATTEMPTS);
  }

  public stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isConsuming = false;
  }

  private handleAttemptEvent(event: any) {
    if (!event) return;

    // Handle attempt submitted
    const attempt = event.attempt || event.payload?.attempt;
    if (attempt && Array.isArray(attempt.answers)) {
      if (event.eventId && this.processedEventIds.has(event.eventId)) {
        return;
      }
      if (event.eventId) {
        this.processedEventIds.add(event.eventId);
      }

      console.log(`[question-service] Consuming attempt ${attempt.id} from Kafka. Calibrating question item metrics...`);
      attempt.answers.forEach((ans: any) => {
        if (ans.questionId && ans.selectedOptionId) {
          questionService.recordAnswer(ans.questionId, !!ans.isCorrect);
        }
      });
    }
  }
}

export const questionKafkaConsumer = new QuestionKafkaConsumer();
