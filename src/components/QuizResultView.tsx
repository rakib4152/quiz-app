import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  BookOpen,
  Bookmark,
  Share2,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Quiz, Question, QuizAttempt } from '../types';

interface QuizResultViewProps {
  quiz: Quiz;
  questions: Question[];
  attempt: QuizAttempt;
  onRetakeQuiz: () => void;
  onNavigate: (view: string) => void;
  onBookmarkQuestion: (questionId: string) => void;
  bookmarkedQuestionIds: string[];
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  quiz,
  questions,
  attempt,
  onRetakeQuiz,
  onNavigate,
  onBookmarkQuestion,
  bookmarkedQuestionIds,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'WRONG' | 'CORRECT' | 'SKIPPED'>('ALL');

  // Filter questions according to result
  const filteredQuestions = questions.filter((q) => {
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    if (!ans) return filterType === 'ALL';
    if (filterType === 'CORRECT') return ans.isCorrect;
    if (filterType === 'WRONG') return !ans.isCorrect && ans.selectedOptionId !== null;
    if (filterType === 'SKIPPED') return ans.selectedOptionId === null;
    return true;
  });

  const isPassed = attempt.passed;
  const timeFormatted = `${Math.floor(attempt.timeSpentSeconds / 60)}m ${attempt.timeSpentSeconds % 60}s`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Banner & Summary Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden text-white ${
          isPassed
            ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 border-emerald-500/30'
            : 'bg-gradient-to-br from-slate-900 via-rose-950/70 to-slate-900 border-rose-500/30'
        }`}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
              }`}
            >
              {isPassed ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {isPassed ? 'Passed • Merit List Qualified' : 'Below Cut-Off Mark'}
            </span>

            <span className="text-xs text-slate-300">
              Exam: <strong>{quiz.title}</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Your Net Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-6xl font-black text-white">
                  {attempt.score.toFixed(2)}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-400">
                  / {attempt.totalMarks}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Pass mark requirement was {quiz.passMarks} marks.
                {attempt.negativeDeducted > 0 && (
                  <span className="text-rose-400 ml-1 font-semibold">
                    (-{attempt.negativeDeducted} marks deducted for {attempt.wrongCount} incorrect answers)
                  </span>
                )}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="retake-exam-btn"
                onClick={onRetakeQuiz}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake Test
              </button>
              <button
                id="view-leaderboard-btn"
                onClick={() => onNavigate('leaderboard')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur flex items-center gap-1.5 transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" /> View Rank List
              </button>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Accuracy</span>
              <span className="text-xl font-black text-emerald-400">{attempt.accuracyPercentage}%</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Correct Answers</span>
              <span className="text-xl font-black text-emerald-400">+{attempt.correctCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wrong Answers</span>
              <span className="text-xl font-black text-rose-400">-{attempt.wrongCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time Spent</span>
              <span className="text-xl font-black text-blue-400">{timeFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Review Section Header & Filters */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Detailed Solution & Explanations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review every question, examine references, and bookmark high-yield items
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => setFilterType('WRONG')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === 'WRONG'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Wrong ({attempt.wrongCount})
          </button>
          <button
            onClick={() => setFilterType('SKIPPED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === 'SKIPPED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Skipped ({attempt.skippedCount})
          </button>
          <button
            onClick={() => setFilterType('CORRECT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === 'CORRECT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Correct ({attempt.correctCount})
          </button>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const ans = attempt.answers.find((a) => a.questionId === q.id);
          const userSelectedOptionId = ans?.selectedOptionId;
          const isCorrect = ans?.isCorrect || false;
          const isSkipped = !userSelectedOptionId;
          const correctOption = q.options.find((o) => o.isCorrect);
          const isBookmarked = bookmarkedQuestionIds.includes(q.id);

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 space-y-4 transition-all ${
                isCorrect
                  ? 'border-emerald-200 dark:border-emerald-950/80'
                  : isSkipped
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-rose-200 dark:border-rose-950/80'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    Q{idx + 1}
                  </span>
                  {isCorrect && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.marks})
                    </span>
                  )}
                  {!isCorrect && !isSkipped && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect (-{q.negativeMarks})
                    </span>
                  )}
                  {isSkipped && (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Skipped (0 Marks)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onBookmarkQuestion(q.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                  title="Bookmark question for review"
                >
                  <Bookmark
                    className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                  />
                </button>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                {q.text}
              </div>

              {/* 4 Options breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt) => {
                  const isUserChoice = userSelectedOptionId === opt.id;
                  const isRightAnswer = opt.isCorrect;

                  let optClass = 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';

                  if (isRightAnswer) {
                    optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                  } else if (isUserChoice && !isRightAnswer) {
                    optClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 line-through';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px]">
                          {opt.optionLetter}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isRightAnswer && (
                        <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                          Correct
                        </span>
                      )}
                      {isUserChoice && !isRightAnswer && (
                        <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">
                          Your Choice
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {q.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Explanation & Context:</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
