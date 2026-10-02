import { User, SubscriptionPlan } from '../../types';
import { BaseKafkaEvent, KAFKA_TOPICS } from '../kafka/kafkaTopics';

export type UserEventType =
  | 'USER_REGISTERED'
  | 'USER_LOGGED_IN'
  | 'USER_SUBSCRIPTION_UPGRADED'
  | 'USER_PROFILE_UPDATED';

export interface UserRegisteredPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UserUpgradedPayload {
  userId: string;
  previousPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  expiresAt: string;
  transactionId: string;
  amount: number;
}

export function createUserKafkaEvent<T>(
  eventType: UserEventType,
  userId: string,
  payload: T,
  traceId?: string
): BaseKafkaEvent<T> {
  return {
    eventId: `evt-usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    topic: KAFKA_TOPICS.USERS,
    sourceService: 'user-service',
    eventType,
    traceId: traceId || `trace-${Date.now()}`,
    timestamp: new Date().toISOString(),
    payload,
  };
}
