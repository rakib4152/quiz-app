import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';

/**
 * Payment Service Kafka Consumer
 * Consumer Group: cg-payment-service
 * Listens to: exampro.users.events
 */
export class PaymentKafkaConsumer {
  private unsubscribe: (() => void) | null = null;
  private isConsuming = false;

  public start() {
    if (this.isConsuming) return;
    this.isConsuming = true;

    this.unsubscribe = kafkaClient.subscribe(KAFKA_TOPICS.USERS, (record) => {
      this.handleUserEvent(record.value);
    });

    console.log('[payment-service] Kafka Consumer started on topic:', KAFKA_TOPICS.USERS);
  }

  public stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isConsuming = false;
  }

  private handleUserEvent(event: any) {
    if (!event || !event.eventType) return;
    if (event.eventType === 'USER_REGISTERED') {
      const { userId, email } = event.payload || {};
      console.log(`[payment-service] Registered user ${userId} (${email}) in payment ledger registry.`);
    }
  }
}

export const paymentKafkaConsumer = new PaymentKafkaConsumer();
