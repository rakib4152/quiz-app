import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';
import { userService } from './userService';
import { SubscriptionPlan } from '../../types';

/**
 * User Service Kafka Consumer
 * Consumer Group: cg-user-service
 * Listens to: exampro.payments.events
 */
export class UserKafkaConsumer {
  private unsubscribe: (() => void) | null = null;
  private isConsuming = false;
  private processedEventIds = new Set<string>();

  public start() {
    if (this.isConsuming) return;
    this.isConsuming = true;

    this.unsubscribe = kafkaClient.subscribe(KAFKA_TOPICS.PAYMENTS, (record) => {
      this.handlePaymentEvent(record.value);
    });

    console.log('[user-service] Kafka Consumer started on topic:', KAFKA_TOPICS.PAYMENTS);
  }

  public stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isConsuming = false;
  }

  private handlePaymentEvent(event: any) {
    if (!event || !event.eventType) return;

    // Avoid duplicate processing (Idempotent Consumer)
    if (event.eventId && this.processedEventIds.has(event.eventId)) {
      return;
    }
    if (event.eventId) {
      this.processedEventIds.add(event.eventId);
    }

    if (event.eventType === 'PAYMENT_COMPLETED') {
      const { userId, plan, transactionId, amount } = event.payload || {};
      if (userId && plan) {
        console.log(`[user-service] Received PAYMENT_COMPLETED event for user ${userId}. Upgrading to plan ${plan}...`);
        try {
          userService.upgradeSubscription(userId, plan as SubscriptionPlan, transactionId || 'tx-auto', amount || 0);
          console.log(`[user-service] User ${userId} successfully upgraded to ${plan} via Kafka event-driven interconnection.`);
        } catch (err) {
          console.error(`[user-service] Error handling PAYMENT_COMPLETED event:`, err);
        }
      }
    }
  }
}

export const userKafkaConsumer = new UserKafkaConsumer();
