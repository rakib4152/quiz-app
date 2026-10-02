import { PaymentTransactionRecord, LedgerEntry, GatewayProvider } from '../../types/architecture';
import { BaseKafkaEvent, KAFKA_TOPICS } from '../kafka/kafkaTopics';

export type PaymentEventType =
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'LEDGER_RECORDED';

export interface PaymentInitiatedPayload {
  transactionId: string;
  userId: string;
  amount: number;
  plan: string;
  gateway: GatewayProvider;
  idempotencyKey: string;
}

export interface PaymentCompletedPayload {
  transactionId: string;
  userId: string;
  amount: number;
  plan: string;
  gateway: GatewayProvider;
  gatewayRef: string;
  netAmount: number;
  completedAt: string;
}

export function createPaymentKafkaEvent<T>(
  eventType: PaymentEventType,
  transactionId: string,
  payload: T,
  traceId?: string
): BaseKafkaEvent<T> {
  return {
    eventId: `evt-pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    topic: KAFKA_TOPICS.PAYMENTS,
    sourceService: 'payment-service',
    eventType,
    traceId: traceId || `trace-${Date.now()}`,
    timestamp: new Date().toISOString(),
    payload,
  };
}
