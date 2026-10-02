import { Quiz, Question, QuizAttempt, UserAnswer } from '../types';
import { calculateQuizScore } from '../api/mobileApi';
import { cdcPipeline } from '../services/cdc/cdcPipeline';
import { kafkaClient } from '../services/kafka/kafkaClient';
import { flinkStreamEngine } from '../services/flink/flinkStreamEngine';
import { runMiddlewarePipeline, requireRole } from '../middleware';

export class QuizController {
  /**
   * Start exam session with access control check
   */
  public static async startQuizAttempt(
    quiz: Quiz,
    userId: string,
    isPremiumUser: boolean,
    reqHeaders: Record<string, string> = {}
  ) {
    const pipeline = runMiddlewarePipeline({ method: 'POST', headers: reqHeaders });
    if (!pipeline.passed) {
      return { success: false, error: pipeline.errorResponse?.detail || 'Unauthorized' };
    }

    if (quiz.isPaid && !isPremiumUser) {
      return {
        success: false,
        error: 'This premium model test requires an active BCS Pro subscription.',
        requiresUpgrade: true,
      };
    }

    // Publish to Kafka
    kafkaClient.produce(
      'exampro.attempts.events',
      userId,
      {
        action: 'ATTEMPT_STARTED',
        quizId: quiz.id,
        userId,
        timestamp: new Date().toISOString(),
      },
      [{ key: 'event.type', value: 'attempt.started' }]
    );

    return {
      success: true,
      quizId: quiz.id,
      durationMinutes: quiz.durationMinutes,
      startedAt: new Date().toISOString(),
      correlationId: pipeline.ctx.correlationId,
    };
  }

  /**
   * Submit exam attempt: server-side grading, negative marking, CDC capture, Kafka publish, and Flink stream update
   */
  public static async submitQuizAttempt(params: {
    quiz: Quiz;
    questions: Question[];
    userAnswers: Record<string, UserAnswer>;
    userId: string;
    userName: string;
    timeSpentSeconds: number;
    reqHeaders?: Record<string, string>;
  }): Promise<{ success: boolean; attempt: QuizAttempt; correlationId: string }> {
    const { quiz, questions, userAnswers, userId, userName, timeSpentSeconds, reqHeaders = {} } = params;

    const pipeline = runMiddlewarePipeline({ method: 'POST', headers: reqHeaders });

    // 1. Calculate Score with BCS negative marking rules
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

    // 2. Capture DB Mutation in CDC Pipeline (Debezium Postgres WAL simulation)
    cdcPipeline.captureMutation('QuizAttempt', 'c', null, attempt);

    // 3. Publish to Apache Kafka `exampro.attempts.events`
    kafkaClient.produce(
      'exampro.attempts.events',
      userId,
      {
        attempt,
        quiz,
        userName,
      },
      [
        { key: 'event.type', value: 'attempt.submitted' },
        { key: 'quiz.id', value: quiz.id },
        { key: 'score', value: scoreResult.score.toString() },
      ]
    );

    // 4. Feed into Apache Flink Stream Processing Engine
    flinkStreamEngine.processAttemptStream({ attempt, quiz, userName });

    return {
      success: true,
      attempt,
      correlationId: pipeline.ctx.correlationId,
    };
  }

  /**
   * Admin Create Quiz with RBAC and CDC propagation
   */
  public static async createQuiz(quiz: Quiz, reqHeaders: Record<string, string> = {}) {
    const pipeline = runMiddlewarePipeline(
      { method: 'POST', headers: reqHeaders },
      [requireRole(['ADMIN', 'INSTRUCTOR'])]
    );

    // CDC Pipeline capture
    cdcPipeline.captureMutation('Quiz', 'c', null, quiz);

    return {
      success: true,
      quiz,
      correlationId: pipeline.ctx.correlationId,
    };
  }
}
