import { questionService } from './questionService';
import { Question } from '../../types';

export class QuestionController {
  public static getAllQuestions() {
    return {
      success: true,
      service: 'question-service',
      data: questionService.getQuestions(),
    };
  }

  public static getQuestionById(id: string) {
    const q = questionService.getQuestionById(id);
    if (!q) {
      return { success: false, error: 'Question not found' };
    }
    return {
      success: true,
      service: 'question-service',
      data: q,
      analytics: questionService.getQuestionAnalytics(id),
    };
  }

  public static getQuestionsByQuiz(quizId: string) {
    return {
      success: true,
      service: 'question-service',
      quizId,
      data: questionService.getQuestionsByQuizId(quizId),
    };
  }

  public static createQuestion(data: Omit<Question, 'id'>) {
    try {
      const q = questionService.createQuestion(data);
      return {
        success: true,
        service: 'question-service',
        data: q,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
