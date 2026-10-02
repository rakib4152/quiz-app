import {
  KafkaRecord,
  KafkaTopicMetadata,
  KafkaConsumerGroupState
} from '../../types/architecture';

type EventListener = (record: KafkaRecord) => void;

class KafkaEventBus {
  private topics: Map<string, KafkaTopicMetadata> = new Map();
  private records: KafkaRecord[] = [];
  private listeners: Map<string, Set<EventListener>> = new Map();
  private consumerGroups: Map<string, KafkaConsumerGroupState> = new Map();
  private offsets: Map<string, number> = new Map(); // topic -> current offset

  constructor() {
    this.initDefaultTopics();
  }

  private initDefaultTopics() {
    const defaultTopics: KafkaTopicMetadata[] = [
      {
        name: 'exampro.users.events',
        partitionsCount: 6,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 720,
        bytesInPerSec: 940,
      },
      {
        name: 'exampro.questions.events',
        partitionsCount: 8,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 360,
        bytesInPerSec: 1200,
      },
      {
        name: 'exampro.quizzes.events',
        partitionsCount: 8,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 360,
        bytesInPerSec: 1680,
      },
      {
        name: 'exampro.quizzes.cdc',
        partitionsCount: 6,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 168, // 7 days
        bytesInPerSec: 1420,
      },
      {
        name: 'exampro.attempts.events',
        partitionsCount: 12,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 72,
        bytesInPerSec: 3200,
      },
      {
        name: 'exampro.payments.events',
        partitionsCount: 6,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 720,
        bytesInPerSec: 890,
      },
      {
        name: 'exampro.payments.transactions',
        partitionsCount: 4,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 720, // 30 days
        bytesInPerSec: 850,
      },
      {
        name: 'exampro.flink.fraud-alerts',
        partitionsCount: 3,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 336,
        bytesInPerSec: 410,
      },
      {
        name: 'exampro.notifications.dispatch',
        partitionsCount: 4,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 48,
        bytesInPerSec: 620,
      },
    ];

    defaultTopics.forEach((t) => {
      this.topics.set(t.name, t);
      this.offsets.set(t.name, 0);
    });

    // Default consumer groups
    this.consumerGroups.set('cg-user-service', {
      groupId: 'cg-user-service',
      topic: 'exampro.payments.events',
      activeMembers: 3,
      totalLag: 0,
      state: 'Stable',
    });

    this.consumerGroups.set('cg-question-service', {
      groupId: 'cg-question-service',
      topic: 'exampro.attempts.events',
      activeMembers: 4,
      totalLag: 0,
      state: 'Stable',
    });

    this.consumerGroups.set('cg-quiz-service', {
      groupId: 'cg-quiz-service',
      topic: 'exampro.questions.events',
      activeMembers: 6,
      totalLag: 0,
      state: 'Stable',
    });

    this.consumerGroups.set('cg-payment-service', {
      groupId: 'cg-payment-service',
      topic: 'exampro.users.events',
      activeMembers: 2,
      totalLag: 0,
      state: 'Stable',
    });

    this.consumerGroups.set('cg-elasticsearch-sink', {
      groupId: 'cg-elasticsearch-sink',
      topic: 'exampro.quizzes.cdc',
      activeMembers: 3,
      totalLag: 0,
      state: 'Stable',
    });

    this.consumerGroups.set('cg-flink-stream-processor', {
      groupId: 'cg-flink-stream-processor',
      topic: 'exampro.attempts.events',
      activeMembers: 6,
      totalLag: 0,
      state: 'Stable',
    });

    this.consumerGroups.set('cg-payment-ledger-sync', {
      groupId: 'cg-payment-ledger-sync',
      topic: 'exampro.payments.transactions',
      activeMembers: 2,
      totalLag: 0,
      state: 'Stable',
    });
  }

  // Hash partitioner based on record key
  private getPartitionForKey(key: string, partitionsCount: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % partitionsCount;
  }

  /**
   * Produce message to Kafka topic
   */
  public produce<T = any>(
    topic: string,
    key: string,
    value: T,
    headers: { key: string; value: string }[] = []
  ): KafkaRecord<T> {
    let topicMeta = this.topics.get(topic);
    if (!topicMeta) {
      topicMeta = {
        name: topic,
        partitionsCount: 4,
        replicationFactor: 3,
        messageCount: 0,
        retentionHours: 72,
        bytesInPerSec: 100,
      };
      this.topics.set(topic, topicMeta);
      this.offsets.set(topic, 0);
    }

    const currentOffset = (this.offsets.get(topic) || 0) + 1;
    this.offsets.set(topic, currentOffset);

    const partition = this.getPartitionForKey(key, topicMeta.partitionsCount);

    const record: KafkaRecord<T> = {
      topic,
      partition,
      offset: currentOffset,
      key,
      value,
      headers: [
        ...headers,
        { key: 'producer', value: 'ExamPro-Microservice-Gateway' },
        { key: 'cluster', value: 'bcs-prod-kafka-broker-01' },
      ],
      timestamp: new Date().toISOString(),
    };

    // Store in ring buffer (keep last 300 records for UI inspectability)
    this.records.unshift(record);
    if (this.records.length > 300) {
      this.records.pop();
    }

    topicMeta.messageCount++;

    // Notify topic listeners
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach((listener) => {
        try {
          listener(record);
        } catch (e) {
          console.error('Kafka listener error:', e);
        }
      });
    }

    // Notify wildcard '*' listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => {
        try {
          listener(record);
        } catch (e) {
          console.error('Kafka wildcard listener error:', e);
        }
      });
    }

    return record;
  }

  /**
   * Subscribe to a topic or wildcard '*'
   */
  public subscribe(topic: string, listener: EventListener): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(listener);

    return () => {
      this.listeners.get(topic)?.delete(listener);
    };
  }

  public getTopics(): KafkaTopicMetadata[] {
    return Array.from(this.topics.values());
  }

  public getRecords(limit: number = 50, topic?: string): KafkaRecord[] {
    if (topic) {
      return this.records.filter((r) => r.topic === topic).slice(0, limit);
    }
    return this.records.slice(0, limit);
  }

  public getConsumerGroups(): KafkaConsumerGroupState[] {
    return Array.from(this.consumerGroups.values());
  }

  public getTotalMessagesCount(): number {
    return Array.from(this.topics.values()).reduce((acc, t) => acc + t.messageCount, 0);
  }
}

export const kafkaClient = new KafkaEventBus();
