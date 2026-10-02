import { Quiz, QuizAttempt } from '../../types';
import { BaseKafkaEvent, KAFKA_TOPICS } from '../kafka/kafkaTopics';

export type QuizEventType =
  | 'QUIZ_CREATED'
  | 'QUIZ_UPDATED'
  | 'ATTEMPT_STARTED'
  | 'ATTEMPT_SUBMITTED';

export interface QuizCreatedPayload {
  quizId: string;
  title: string;
  subjectId: string;
  totalQuestions: number;
  totalMarks: number;
  isPaid: boolean;
  price: number;
  createdAt: string;
}

export interface AttemptStartedPayload {
  attemptId: string;
  quizId: string;
  userId: string;
  startedAt: string;
}

export interface AttemptSubmittedPayload {
  attempt: QuizAttempt;
  quiz: Quiz;
  userId: string;
  userName: string;
}

export function createQuizKafkaEvent<T>(
  eventType: QuizEventType,
  key: string,
  payload: T,
  traceId?: string
): BaseKafkaEvent<T> {
  return {
    eventId: `evt-qz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    topic: eventType.startsWith('ATTEMPT') ? KAFKA_TOPICS.ATTEMPTS : KAFKA_TOPICS.QUIZZES,
    sourceService: 'quiz-service',
    eventType,
    traceId: traceId || `trace-${Date.now()}`,
    timestamp: new Date().toISOString(),
    payload,
  };
}
