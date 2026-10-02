import { Question } from '../../types';
import { BaseKafkaEvent, KAFKA_TOPICS } from '../kafka/kafkaTopics';

export type QuestionEventType =
  | 'QUESTION_CREATED'
  | 'QUESTION_UPDATED'
  | 'QUESTION_DELETED'
  | 'QUESTION_STAT_UPDATED';

export interface QuestionCreatedPayload {
  questionId: string;
  quizId?: string;
  text: string;
  subjectId?: string;
  marks: number;
  optionsCount: number;
  createdAt: string;
}

export interface QuestionStatPayload {
  questionId: string;
  totalAttempts: number;
  correctAnswers: number;
  accuracyRate: number;
  calibratedDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export function createQuestionKafkaEvent<T>(
  eventType: QuestionEventType,
  questionId: string,
  payload: T,
  traceId?: string
): BaseKafkaEvent<T> {
  return {
    eventId: `evt-qst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    topic: KAFKA_TOPICS.QUESTIONS,
    sourceService: 'question-service',
    eventType,
    traceId: traceId || `trace-${Date.now()}`,
    timestamp: new Date().toISOString(),
    payload,
  };
}
