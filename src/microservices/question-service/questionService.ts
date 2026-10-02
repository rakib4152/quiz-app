import { Question, Option } from '../../types';
import { INITIAL_QUESTIONS } from '../../data/mockData';
import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';
import { createQuestionKafkaEvent, QuestionCreatedPayload, QuestionStatPayload } from './questionEvents';

export interface QuestionAnalytics {
  totalAttempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracyRate: number;
}

class QuestionService {
  private questions: Map<string, Question> = new Map();
  private analytics: Map<string, QuestionAnalytics> = new Map();

  constructor() {
    Object.values(INITIAL_QUESTIONS).flat().forEach((q: Question) => {
      this.questions.set(q.id, { ...q });
      this.analytics.set(q.id, {
        totalAttempts: 120 + Math.floor(Math.random() * 200),
        correctAnswers: 80 + Math.floor(Math.random() * 80),
        wrongAnswers: 30 + Math.floor(Math.random() * 40),
        accuracyRate: 72.5,
      });
    });
  }

  public getQuestions(): Question[] {
    return Array.from(this.questions.values());
  }

  public getQuestionById(id: string): Question | undefined {
    return this.questions.get(id);
  }

  public getQuestionsByQuizId(quizId: string): Question[] {
    return Array.from(this.questions.values()).filter((q) => q.quizId === quizId);
  }

  public getQuestionsByIds(ids: string[]): Question[] {
    return ids.map((id) => this.questions.get(id)).filter(Boolean) as Question[];
  }

  /**
   * Create question and publish event to Kafka
   */
  public createQuestion(data: Omit<Question, 'id'>): Question {
    const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newQuestion: Question = {
      ...data,
      id,
    };

    this.questions.set(id, newQuestion);
    this.analytics.set(id, {
      totalAttempts: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      accuracyRate: 0,
    });

    // Publish to Kafka: exampro.questions.events
    const event = createQuestionKafkaEvent<QuestionCreatedPayload>('QUESTION_CREATED', id, {
      questionId: id,
      quizId: newQuestion.quizId,
      text: newQuestion.text,
      marks: newQuestion.marks,
      optionsCount: newQuestion.options.length,
      createdAt: new Date().toISOString(),
    });

    kafkaClient.produce(KAFKA_TOPICS.QUESTIONS, id, event, [
      { key: 'event.type', value: 'QUESTION_CREATED' },
      { key: 'service', value: 'question-service' },
    ]);

    return newQuestion;
  }

  /**
   * Update question analytics after exam attempt evaluation
   */
  public recordAnswer(questionId: string, isCorrect: boolean): void {
    const stat = this.analytics.get(questionId) || {
      totalAttempts: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      accuracyRate: 0,
    };

    stat.totalAttempts += 1;
    if (isCorrect) {
      stat.correctAnswers += 1;
    } else {
      stat.wrongAnswers += 1;
    }
    stat.accuracyRate = Math.round((stat.correctAnswers / stat.totalAttempts) * 100);
    this.analytics.set(questionId, stat);

    // If milestone reached, publish stat update to Kafka
    if (stat.totalAttempts % 5 === 0) {
      const difficulty: 'EASY' | 'MEDIUM' | 'HARD' =
        stat.accuracyRate > 75 ? 'EASY' : stat.accuracyRate > 45 ? 'MEDIUM' : 'HARD';

      const event = createQuestionKafkaEvent<QuestionStatPayload>('QUESTION_STAT_UPDATED', questionId, {
        questionId,
        totalAttempts: stat.totalAttempts,
        correctAnswers: stat.correctAnswers,
        accuracyRate: stat.accuracyRate,
        calibratedDifficulty: difficulty,
      });

      kafkaClient.produce(KAFKA_TOPICS.QUESTIONS, questionId, event, [
        { key: 'event.type', value: 'QUESTION_STAT_UPDATED' },
        { key: 'service', value: 'question-service' },
      ]);
    }
  }

  public getQuestionAnalytics(questionId: string): QuestionAnalytics | undefined {
    return this.analytics.get(questionId);
  }
}

export const questionService = new QuestionService();
