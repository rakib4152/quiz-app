import { CdcEvent, CdcOperation, CdcPayload } from '../../types/architecture';
import { kafkaClient } from '../kafka/kafkaClient';
import { elasticsearchEngine } from '../elasticsearch/elasticsearchClient';

type CdcTable = 'Quiz' | 'Question' | 'QuizAttempt' | 'Payment' | 'User';

class CdcEngine {
  private currentLsn = 1482049102;
  private transactionCounter = 49201;
  private cdcEventsLog: CdcEvent[] = [];
  private listeners: Set<(event: CdcEvent) => void> = new Set();

  constructor() {
    // When CDC captures a Quiz change, automatically sync to Elasticsearch
    this.subscribe((event) => {
      if (event.payload.source.table === 'Quiz') {
        const { op, after, before } = event.payload;
        if ((op === 'c' || op === 'u') && after) {
          elasticsearchEngine.indexQuiz({
            id: after.id,
            title: after.title,
            slug: after.slug || after.title.toLowerCase().replace(/\s+/g, '-'),
            description: after.description || '',
            subjectId: after.subjectId || 'subj-bangla',
            subjectName: 'Live CDC Synced',
            categoryId: after.categoryId || 'cat-lit',
            categoryName: 'General',
            difficulty: after.difficulty || 'MEDIUM',
            isPaid: Boolean(after.isPaid),
            price: Number(after.price || 0),
            durationMinutes: Number(after.durationMinutes || 60),
            totalQuestions: Number(after.totalQuestions || 20),
            passMarks: Number(after.passMarks || 10),
            tags: ['cdc-streamed', 'live-sync'],
            createdAt: after.createdAt || new Date().toISOString(),
          });
        } else if (op === 'd' && before) {
          elasticsearchEngine.deleteQuiz(before.id);
        }
      }
    });
  }

  /**
   * Capture mutation on a PostgreSQL table and emit Debezium-standard CDC event
   */
  public captureMutation<T = any>(
    table: CdcTable,
    operation: CdcOperation,
    before: T | null,
    after: T | null
  ): CdcEvent<T> {
    this.currentLsn += Math.floor(Math.random() * 50) + 16;
    this.transactionCounter++;

    const source = {
      version: '2.5.0.Final',
      connector: 'postgresql' as const,
      name: 'pg-exampro-cluster-cdc',
      ts_ms: Date.now(),
      snapshot: 'false' as const,
      db: 'exampro_db',
      schema: 'public',
      table,
      txId: this.transactionCounter,
      lsn: this.currentLsn,
    };

    const payload: CdcPayload<T> = {
      before,
      after,
      source,
      op: operation,
      ts_ms: Date.now(),
      transaction: {
        id: `tx-${this.transactionCounter}`,
        total_order: 1,
        data_collection_order: 1,
      },
    };

    const key = (after as any)?.id || (before as any)?.id || `key-${Date.now()}`;
    const topic = 'exampro.quizzes.cdc';

    const event: CdcEvent<T> = {
      eventId: `cdc-${this.transactionCounter}-${Date.now().toString(36)}`,
      topic,
      key,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Store in circular log (last 100 events)
    this.cdcEventsLog.unshift(event);
    if (this.cdcEventsLog.length > 100) {
      this.cdcEventsLog.pop();
    }

    // Publish into Kafka Topic
    kafkaClient.produce(topic, key, payload, [
      { key: 'cdc.connector', value: 'debezium-postgres' },
      { key: 'cdc.table', value: table },
      { key: 'cdc.operation', value: operation },
      { key: 'cdc.lsn', value: this.currentLsn.toString() },
    ]);

    // Notify internal subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('CDC listener error:', err);
      }
    });

    return event;
  }

  public subscribe(listener: (event: CdcEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getEvents(limit: number = 30): CdcEvent[] {
    return this.cdcEventsLog.slice(0, limit);
  }

  public getStatus() {
    return {
      connectorName: 'debezium-postgres-connector',
      state: 'RUNNING',
      plugin: 'pgoutput',
      publication: 'exampro_cdc_publication',
      currentLsn: this.currentLsn,
      txCounter: this.transactionCounter,
      totalEventsEmitted: this.cdcEventsLog.length,
      tablesCaptured: ['Quiz', 'Question', 'QuizAttempt', 'Payment', 'User'],
    };
  }
}

export const cdcPipeline = new CdcEngine();
