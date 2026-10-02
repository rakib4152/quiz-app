import { User, SubscriptionPlan } from '../../types';
import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';
import { createUserKafkaEvent, UserRegisteredPayload, UserUpgradedPayload } from './userEvents';

const SEED_USERS: User[] = [
  {
    id: 'usr-student-free',
    name: 'Rakibul Islam',
    email: 'rakib.edu.bd@gmail.com',
    role: 'STUDENT',
    isPremium: false,
    subscriptionPlan: 'FREE',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'usr-student-pro',
    name: 'Tasmia Sultana',
    email: 'tasmia.du@gmail.com',
    role: 'STUDENT',
    isPremium: true,
    subscriptionPlan: 'ANNUAL_BCS_MASTER',
    subscriptionExpiresAt: '2027-01-10T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'usr-instructor-01',
    name: 'Dr. Anwar Hossain (BCS Cadre)',
    email: 'anwar.cadre@exampro.ai',
    role: 'INSTRUCTOR',
    isPremium: true,
    subscriptionPlan: 'ANNUAL_BCS_MASTER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    createdAt: '2025-11-20T10:00:00Z',
  },
  {
    id: 'usr-admin-01',
    name: 'System Super Admin',
    email: 'admin@exampro.ai',
    role: 'ADMIN',
    isPremium: true,
    subscriptionPlan: 'ANNUAL_BCS_MASTER',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    createdAt: '2025-10-01T10:00:00Z',
  },
];

class UserService {
  private users: Map<string, User> = new Map();

  constructor() {
    SEED_USERS.forEach((u) => this.users.set(u.id, { ...u }));
  }

  public getUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Register a new user and publish event to Kafka
   */
  public registerUser(name: string, email: string, role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = 'STUDENT'): User {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error(`User with email ${email} already exists`);
    }

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      name,
      email,
      role,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      isPremium: false,
      subscriptionPlan: 'FREE',
      createdAt: new Date().toISOString(),
    };

    this.users.set(newUser.id, newUser);

    // Publish to Kafka: exampro.users.events
    const event = createUserKafkaEvent<UserRegisteredPayload>('USER_REGISTERED', newUser.id, {
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    });

    kafkaClient.produce(KAFKA_TOPICS.USERS, newUser.id, event, [
      { key: 'event.type', value: 'USER_REGISTERED' },
      { key: 'service', value: 'user-service' },
    ]);

    return newUser;
  }

  /**
   * Upgrade user subscription plan and publish Kafka event
   */
  public upgradeSubscription(
    userId: string,
    newPlan: SubscriptionPlan,
    transactionId: string,
    amount: number
  ): User {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const previousPlan: SubscriptionPlan = user.subscriptionPlan || 'FREE';
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    user.subscriptionPlan = newPlan;
    user.isPremium = newPlan !== 'FREE';
    user.subscriptionExpiresAt = expiresAt;

    // Publish to Kafka: exampro.users.events
    const event = createUserKafkaEvent<UserUpgradedPayload>('USER_SUBSCRIPTION_UPGRADED', user.id, {
      userId: user.id,
      previousPlan,
      newPlan,
      expiresAt,
      transactionId,
      amount,
    });

    kafkaClient.produce(KAFKA_TOPICS.USERS, user.id, event, [
      { key: 'event.type', value: 'USER_SUBSCRIPTION_UPGRADED' },
      { key: 'plan', value: newPlan },
      { key: 'service', value: 'user-service' },
    ]);

    return { ...user };
  }

  /**
   * Check if user has active pro entitlement
   */
  public hasProAccess(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return !!user.isPremium;
  }
}

export const userService = new UserService();
