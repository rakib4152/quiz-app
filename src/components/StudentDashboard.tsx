import React, { useState } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  Bookmark,
  Zap,
  TrendingUp,
  Flame,
  Calendar,
  CreditCard,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { User, QuizAttempt, Quiz, Question } from '../types';

interface StudentDashboardProps {
  currentUser: User;
  attempts: QuizAttempt[];
  quizzes: Quiz[];
  bookmarkedQuestionIds: string[];
  allQuestions: Record<string, Question[]>;
  onReviewAttempt: (attempt: QuizAttempt) => void;
  onNavigate: (view: string) => void;
  onStartQuiz: (quizId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  attempts,
  quizzes,
  bookmarkedQuestionIds,
  allQuestions,
  onReviewAttempt,
  onNavigate,
  onStartQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'BOOKMARKS' | 'SUBSCRIPTION'>('HISTORY');

  // Compute student stats
  const totalCompleted = attempts.length;
  const avgAccuracy =
    totalCompleted > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.accuracyPercentage, 0) / totalCompleted)
      : 84;
  const avgScore =
    totalCompleted > 0
      ? (attempts.reduce((acc, a) => acc + a.score, 0) / totalCompleted).toFixed(1)
      : '8.5';

  // Gather bookmarked questions
  const bookmarkedQuestions: Question[] = [];
  Object.values(allQuestions).forEach((qList) => {
    qList.forEach((q) => {
      if (bookmarkedQuestionIds.includes(q.id)) {
        bookmarkedQuestions.push(q);
      }
    });
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Student Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              {currentUser.isPremium ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                  <Zap className="w-3 h-3 fill-current" /> PRO Pass Active
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Free Member
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser.email}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Targeting: 47th BCS Preliminary & Combined Bank Recruitment
            </p>
          </div>
        </div>

        {!currentUser.isPremium && (
          <button
            onClick={() => onNavigate('pricing')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> Upgrade to BCS Pro Pass
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Completed Tests</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalCompleted > 0 ? totalCompleted : 6}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">+2 this week</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Average Accuracy</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {avgAccuracy}%
          </p>
          <span className="text-[10px] text-slate-400">Top 15% tier</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-500">
            7 Days
          </p>
          <span className="text-[10px] text-amber-600 font-semibold">Streak on fire!</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Merit Standing</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            #42
          </p>
          <span className="text-[10px] text-slate-400">All-Bangladesh Rank</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'HISTORY'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Exam History ({attempts.length})
        </button>
        <button
          onClick={() => setActiveTab('BOOKMARKS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'BOOKMARKS'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Bookmarked Questions ({bookmarkedQuestions.length})
        </button>
        <button
          onClick={() => setActiveTab('SUBSCRIPTION')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'SUBSCRIPTION'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Subscription & Billing
        </button>
      </div>

      {/* Tab 1: Exam History */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No examination attempts yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Take your first preliminary model test to see your score diagnostics and ranking.
              </p>
              <button
                onClick={() => onStartQuiz(quizzes[0]?.id || 'quiz-bcs-model-1')}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Start Diagnostic Test Now
              </button>
            </div>
          ) : (
            attempts.map((att) => {
              const quiz = quizzes.find((q) => q.id === att.quizId);
              return (
                <div
                  key={att.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          att.passed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(att.startedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {quiz?.title || 'BCS Model Test'}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Correct: +{att.correctCount}</span>
                      <span>Wrong: -{att.wrongCount}</span>
                      <span>Acc: {att.accuracyPercentage}%</span>
                      <span>Time: {Math.floor(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
                        {att.score.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/ {att.totalMarks} Marks</span>
                    </div>

                    <button
                      onClick={() => onReviewAttempt(att)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                    >
                      Review Solutions
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Bookmarked Questions */}
      {activeTab === 'BOOKMARKS' && (
        <div className="space-y-3">
          {bookmarkedQuestions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No bookmarked questions yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                While taking a quiz or reviewing answers, click the bookmark icon on difficult questions to review them here.
              </p>
            </div>
          ) : (
            bookmarkedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Saved Question #{idx + 1}
                  </span>
                  <span className="text-xs text-slate-400">Difficulty: {q.difficulty}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{q.text}</p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Answer & Reference:</p>
                  <p className="text-[11px] leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Subscription & Billing */}
      {activeTab === 'SUBSCRIPTION' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Subscription</h3>
                <p className="text-xs text-slate-500">Plan details and validity period</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {currentUser.isPremium ? 'PRO PASS ACTIVE' : 'FREE TIER'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Plan Name</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentUser.subscriptionPlan || 'Free Explorer'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Access Level</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {currentUser.isPremium ? 'Unlimited Paid Tests' : 'Free Model Tests Only'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Renewal / Expiry</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentUser.subscriptionExpiresAt || 'Perpetual Free'}
                </p>
              </div>
            </div>

            {!currentUser.isPremium && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('pricing')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Upgrade to Unlimited BCS Pro Pass &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
