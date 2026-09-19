export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'TIMED_OUT';

export type SubscriptionPlan = 'FREE' | 'MONTHLY_PRO' | 'SIX_MONTH_PASS' | 'ANNUAL_BCS_MASTER';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export type PaymentProvider = 'BKASH' | 'NAGAD' | 'UPAY' | 'SSLCOMMERZ';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  isPremium: boolean;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiresAt?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  questionCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subjectId: string;
  description: string;
}

export interface Chapter {
  id: string;
  name: string;
  order: number;
  categoryId: string;
}

export interface Option {
  id: string;
  questionId: string;
  optionLetter: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  quizId: string;
  chapterId?: string;
  text: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  difficulty: Difficulty;
  options: Option[];
}

export interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  negativeMarkRate: number; // e.g. 0.25
  isPaid: boolean;
  price: number; // in BDT
  difficulty: Difficulty;
  subjectId: string;
  categoryId: string;
  chapterId?: string;
  isPublished: boolean;
  totalQuestions: number;
  attemptCount: number;
  createdAt: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  negativeDeducted: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  passed: boolean;
  status: AttemptStatus;
  startedAt: string;
  completedAt?: string;
  answers: {
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    marksAwarded: number;
    isMarkedForReview: boolean;
  }[];
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  timeSpentSeconds: number;
  rank: number;
  recordedAt: string;
  quizTitle: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  transactionId: string;
  plan: SubscriptionPlan;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'QUIZ_ANNOUNCEMENT' | 'PAYMENT_SUCCESS' | 'RESULT_PUBLISHED' | 'SYSTEM_ALERT';
  isRead: boolean;
  createdAt: string;
}
