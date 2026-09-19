/**
 * Reusable Business Logic & Mobile REST API client for ExamPro.
 * These functions and endpoints are designed to be shared directly
 * with the React Native / Expo mobile app.
 */

import { Question, Quiz, QuizAttempt, UserAnswer } from '../types';

export interface ScoreResult {
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  negativeDeducted: number;
  accuracyPercentage: number;
  passed: boolean;
  breakdown: {
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    marksAwarded: number;
    isMarkedForReview: boolean;
  }[];
}

/**
 * Universal scoring engine adhering to BCS / Govt recruitment negative marking rules.
 * - Correct answer: +question.marks (typically 1.0)
 * - Incorrect answer: -quiz.negativeMarkRate (e.g. 0.25 or 0.50)
 * - Skipped/Unanswered: 0 marks
 */
export function calculateQuizScore(
  quiz: Quiz,
  questions: Question[],
  userAnswers: Record<string, UserAnswer>
): ScoreResult {
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let negativeDeducted = 0;

  const breakdown = questions.map((q) => {
    const ua = userAnswers[q.id];
    const selectedOptionId = ua?.selectedOptionId || null;
    const isMarkedForReview = !!ua?.isMarkedForReview;

    if (!selectedOptionId) {
      skippedCount++;
      return {
        questionId: q.id,
        selectedOptionId: null,
        isCorrect: false,
        marksAwarded: 0,
        isMarkedForReview,
      };
    }

    const correctOption = q.options.find((opt) => opt.isCorrect);
    const isCorrect = correctOption ? correctOption.id === selectedOptionId : false;

    if (isCorrect) {
      correctCount++;
      const marks = q.marks || 1;
      score += marks;
      return {
        questionId: q.id,
        selectedOptionId,
        isCorrect: true,
        marksAwarded: marks,
        isMarkedForReview,
      };
    } else {
      wrongCount++;
      const penalty = q.negativeMarks ?? quiz.negativeMarkRate ?? 0.25;
      negativeDeducted += penalty;
      score -= penalty;
      return {
        questionId: q.id,
        selectedOptionId,
        isCorrect: false,
        marksAwarded: -penalty,
        isMarkedForReview,
      };
    }
  });

  // Clamp minimum score to 0 to prevent negative net score in standardized displays if preferred,
  // or allow realistic negative score (in BCS, net score can be < 0). Here we round to 2 decimal places.
  const finalScore = Math.round(score * 100) / 100;
  const attemptedCount = correctCount + wrongCount;
  const accuracyPercentage = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const passed = finalScore >= quiz.passMarks;

  return {
    score: finalScore,
    totalMarks: quiz.totalMarks,
    correctCount,
    wrongCount,
    skippedCount,
    negativeDeducted: Math.round(negativeDeducted * 100) / 100,
    accuracyPercentage,
    passed,
    breakdown,
  };
}

/**
 * Mobile REST API Endpoints Specification (Reusable by Expo / React Native)
 */
export const MOBILE_API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    description: 'Authenticate user with email & password, returns JWT token and profile with subscription status.',
    authRequired: false,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/register',
    description: 'Register a new student account.',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/v1/quizzes',
    description: 'Fetch filtered quiz list by subject, category, chapter, or paid/free status.',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/v1/quizzes/:id/start',
    description: 'Initiate exam attempt session, verifies access rights (free vs active subscription). Returns questions without isCorrect flag.',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/v1/quizzes/:id/submit',
    description: 'Submit answers payload, runs server-side scoring with negative marks, updates national leaderboard.',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/v1/leaderboard/:quizId',
    description: 'Fetch real-time ranks for a specific quiz or all-time national ladder.',
    authRequired: false,
  },
  {
    method: 'POST',
    path: '/api/v1/bookmarks/toggle',
    description: 'Bookmark or unbookmark a specific question or quiz.',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/v1/subscriptions/checkout',
    description: 'Initiate bKash/Nagad payment gateway session for Pro membership.',
    authRequired: true,
  },
];
