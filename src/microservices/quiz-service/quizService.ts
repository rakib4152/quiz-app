import { Quiz, QuizAttempt, Question, UserAnswer } from '../../types';
import { INITIAL_QUIZZES } from '../../data/mockData';
import { calculateQuizScore, ScoreResult } from '../../api/mobileApi';
import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';
import { questionService } from '../question-service/questionService';
import { userService } from '../user-service/userService';
import { createQuizKafkaEvent, QuizCreatedPayload, AttemptStartedPayload, AttemptSubmittedPayload } from './quizEvents';

class QuizService {
  private quizzes: Map<string, Quiz> = new Map();
  private attempts: Map<string, QuizAttempt> = new Map();

  constructor() {
    INITIAL_QUIZZES.forEach((q) => this.quizzes.set(q.id, { ...q }));
  }

  public getQuizzes(): Quiz[] {
    return Array.from(this.quizzes.values());
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.quizzes.get(id);
  }

  public getAttemptsForUser(userId: string): QuizAttempt[] {
    return Array.from(this.attempts.values()).filter((a) => a.userId === userId);
  }

  /**
   * Start Quiz Attempt - checks entitlement with User Service and produces Kafka event
   */
  public startAttempt(quizId: string, userId: string): { success: boolean; quiz?: Quiz; error?: string } {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Inter-service check: Validate Pro membership with User Service
    if (quiz.isPaid) {
      const hasPro = userService.hasProAccess(userId);
      if (!hasPro) {
        return {
          success: false,
          error: 'This premium model test requires an active Pro subscription.',
        };
      }
    }

    const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Publish to Kafka: exampro.attempts.events
    const event = createQuizKafkaEvent<AttemptStartedPayload>('ATTEMPT_STARTED', userId, {
      attemptId,
      quizId,
      userId,
      startedAt: new Date().toISOString(),
    });

    kafkaClient.produce(KAFKA_TOPICS.ATTEMPTS, userId, event, [
      { key: 'event.type', value: 'ATTEMPT_STARTED' },
      { key: 'quiz.id', value: quizId },
      { key: 'service', value: 'quiz-service' },
    ]);

    return { success: true, quiz };
  }

  /**
   * Submit Attempt - fetches questions from Question Service, scores with negative marking,
   * stores attempt, and publishes ATTEMPT_SUBMITTED event to Kafka!
   */
  public submitAttempt(params: {
    quizId: string;
    userId: string;
    userName: string;
    userAnswers: Record<string, UserAnswer>;
    timeSpentSeconds: number;
  }): { success: boolean; attempt?: QuizAttempt; scoreResult?: ScoreResult; error?: string } {
    const { quizId, userId, userName, userAnswers, timeSpentSeconds } = params;

    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Inter-service query: Fetch questions from Question Service
    let questions = questionService.getQuestionsByQuizId(quizId);
    if (!questions || questions.length === 0) {
      questions = questionService.getQuestions().slice(0, quiz.totalQuestions || 10);
    }

    // Server-side scoring engine with negative marks
    const scoreResult = calculateQuizScore(quiz, questions, userAnswers);

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      quizId: quiz.id,
      score: scoreResult.score,
      totalMarks: scoreResult.totalMarks,
      correctCount: scoreResult.correctCount,
      wrongCount: scoreResult.wrongCount,
      skippedCount: scoreResult.skippedCount,
      negativeDeducted: scoreResult.negativeDeducted,
      accuracyPercentage: scoreResult.accuracyPercentage,
      timeSpentSeconds,
      passed: scoreResult.passed,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      answers: scoreResult.breakdown,
    };

    this.attempts.set(attempt.id, attempt);

    // Publish to Kafka: exampro.attempts.events
    // Consumed by Question Service (for question difficulty telemetry) and Analytics Service!
    const event = createQuizKafkaEvent<AttemptSubmittedPayload>('ATTEMPT_SUBMITTED', userId, {
      attempt,
      quiz,
      userId,
      userName,
    });

    kafkaClient.produce(KAFKA_TOPICS.ATTEMPTS, userId, event, [
      { key: 'event.type', value: 'ATTEMPT_SUBMITTED' },
      { key: 'quiz.id', value: quizId },
      { key: 'score', value: attempt.score.toString() },
      { key: 'service', value: 'quiz-service' },
    ]);

    return {
      success: true,
      attempt,
      scoreResult,
    };
  }

  /**
   * Create Quiz and publish to Kafka
   */
  public createQuiz(data: Omit<Quiz, 'id'>): Quiz {
    const id = `quiz-${Date.now().toString(36)}`;
    const newQuiz: Quiz = {
      ...data,
      id,
    };

    this.quizzes.set(id, newQuiz);

    // Publish to Kafka: exampro.quizzes.events
    const event = createQuizKafkaEvent<QuizCreatedPayload>('QUIZ_CREATED', id, {
      quizId: id,
      title: newQuiz.title,
      subjectId: newQuiz.subjectId,
      totalQuestions: newQuiz.totalQuestions,
      totalMarks: newQuiz.totalMarks,
      isPaid: newQuiz.isPaid,
      price: newQuiz.price,
      createdAt: new Date().toISOString(),
    });

    kafkaClient.produce(KAFKA_TOPICS.QUIZZES, id, event, [
      { key: 'event.type', value: 'QUIZ_CREATED' },
      { key: 'service', value: 'quiz-service' },
    ]);

    return newQuiz;
  }
}

export const quizService = new QuizService();
