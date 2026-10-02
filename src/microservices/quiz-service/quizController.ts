import { quizService } from './quizService';
import { Quiz, UserAnswer } from '../../types';

export class QuizController {
  public static getAllQuizzes() {
    return {
      success: true,
      service: 'quiz-service',
      data: quizService.getQuizzes(),
    };
  }

  public static getQuizById(id: string) {
    const q = quizService.getQuizById(id);
    if (!q) {
      return { success: false, error: 'Quiz not found' };
    }
    return {
      success: true,
      service: 'quiz-service',
      data: q,
    };
  }

  public static startAttempt(quizId: string, userId: string) {
    const res = quizService.startAttempt(quizId, userId);
    return {
      ...res,
      service: 'quiz-service',
    };
  }

  public static submitAttempt(params: {
    quizId: string;
    userId: string;
    userName: string;
    userAnswers: Record<string, UserAnswer>;
    timeSpentSeconds: number;
  }) {
    const res = quizService.submitAttempt(params);
    return {
      ...res,
      service: 'quiz-service',
    };
  }

  public static createQuiz(data: Omit<Quiz, 'id'>) {
    try {
      const q = quizService.createQuiz(data);
      return {
        success: true,
        service: 'quiz-service',
        data: q,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
