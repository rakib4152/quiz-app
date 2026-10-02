import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Send,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Quiz, Question, UserAnswer, QuizAttempt } from '../types';
import { calculateQuizScore } from '../api/mobileApi';

interface QuizAttemptViewProps {
  quiz: Quiz;
  questions: Question[];
  userId: string;
  onFinishQuiz: (attempt: QuizAttempt) => void;
  onCancelQuiz: () => void;
  onBookmarkQuestion: (questionId: string) => void;
  bookmarkedQuestionIds: string[];
}

export const QuizAttemptView: React.FC<QuizAttemptViewProps> = ({
  quiz,
  questions,
  userId,
  onFinishQuiz,
  onCancelQuiz,
  onBookmarkQuestion,
  bookmarkedQuestionIds,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(quiz.durationMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalSecondsAllocated = quiz.durationMinutes * 60;

  // Live Countdown Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitQuiz(true); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentQuestion = questions[currentIdx] || questions[0];
  const currentAnswer = userAnswers[currentQuestion?.id] || {
    questionId: currentQuestion?.id,
    selectedOptionId: null,
    isMarkedForReview: false,
  };

  // Keyboard navigation shortcuts (A, B, C, D, Arrows) inspired by Mobbin Quizlet flow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
        const opt = currentQuestion.options[letterMap[key]];
        if (opt) handleSelectOption(opt.id);
      } else if (e.key === 'ArrowRight') {
        setCurrentIdx((p) => Math.min(questions.length - 1, p + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIdx((p) => Math.max(0, p - 1));
      } else if (key === 'R') {
        handleToggleReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, questions.length]);

  const handleSelectOption = (optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        isMarkedForReview: prev[currentQuestion.id]?.isMarkedForReview || false,
      },
    }));
  };

  const handleClearOption = () => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionId: null,
        isMarkedForReview: prev[currentQuestion.id]?.isMarkedForReview || false,
      },
    }));
  };

  const handleToggleReview = () => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionId: prev[currentQuestion.id]?.selectedOptionId || null,
        isMarkedForReview: !prev[currentQuestion.id]?.isMarkedForReview,
      },
    }));
  };

  const answeredCount = Object.values(userAnswers).filter((a) => a.selectedOptionId !== null).length;
  const reviewCount = Object.values(userAnswers).filter((a) => a.isMarkedForReview).length;
  const unattemptedCount = questions.length - answeredCount;

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeftSeconds < 120; // under 2 minutes warning

  const handleSubmitQuiz = (isAutoTimeout = false) => {
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpentSeconds = Math.max(1, totalSecondsAllocated - timeLeftSeconds);
    const scoreResult = calculateQuizScore(quiz, questions, userAnswers);

    const attempt: QuizAttempt = {
      id: 'att-' + Date.now(),
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
      status: isAutoTimeout ? 'TIMED_OUT' : 'COMPLETED',
      startedAt: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      answers: scoreResult.breakdown,
    };

    onFinishQuiz(attempt);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16">
      {/* Top Test Header Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-20 z-30">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
            {quiz.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span>Pass: {quiz.passMarks}/{quiz.totalMarks} Marks</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              Negative Penalty: -{quiz.negativeMarkRate}/wrong
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Timer badge */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-sm font-black transition-colors ${
              isLowTime
                ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800 animate-pulse'
                : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-600' : 'text-slate-500'}`} />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          {/* Submit Test Button */}
          <button
            id="open-submit-modal-btn"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Submit Exam
          </button>
        </div>
      </div>

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Question Prompt & 4 Options */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 overflow-hidden relative">
            {/* Top Linear Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.round(((currentIdx + 1) / questions.length) * 100)}%` }}
              />
            </div>

            {/* Question Meta Header - Zero-Pill Typography */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  +{currentQuestion.marks} Mark / -{currentQuestion.negativeMarks} Penalty
                </span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Keyboard keys: <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">A</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">B</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">C</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">D</kbd>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onBookmarkQuestion(currentQuestion.id)}
                  title="Bookmark question for future revision"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarkedQuestionIds.includes(currentQuestion.id)
                        ? 'fill-amber-500 text-amber-500'
                        : ''
                    }`}
                  />
                </button>
                <button
                  onClick={handleToggleReview}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    currentAnswer.isMarkedForReview
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {currentAnswer.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>
            </div>

            {/* Question Text in clear typography */}
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.text}
            </div>

            {/* 4 Options (A, B, C, D) */}
            <div className="space-y-2.5 pt-2">
              {currentQuestion.options.map((option) => {
                const isSelected = currentAnswer.selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 rounded-xl border text-sm flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {option.optionLetter}
                      </span>
                      <span>{option.text}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleClearOption}
                disabled={!currentAnswer.selectedOptionId}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Selection
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                  disabled={currentIdx === 0}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-slate-700 dark:text-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Question Navigation Palette */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Question Navigator
              </h3>
              <span className="text-[11px] text-slate-500">
                {answeredCount}/{questions.length} Attempted
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                <span>Unattempted ({unattemptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-emerald-500 bg-white dark:bg-slate-900" />
                <span>Current</span>
              </div>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {questions.map((q, idx) => {
                const ans = userAnswers[q.id];
                const isAnswered = ans && ans.selectedOptionId !== null;
                const isReview = ans && ans.isMarkedForReview;
                const isCurrent = idx === currentIdx;

                let btnClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                if (isReview) {
                  btnClass = 'bg-amber-500 text-white font-black';
                } else if (isAnswered) {
                  btnClass = 'bg-emerald-600 text-white font-bold';
                }

                if (isCurrent) {
                  btnClass += ' ring-2 ring-slate-900 dark:ring-white ring-offset-2';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl text-xs flex items-center justify-center transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Exit / Quit Test link */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={onCancelQuiz}
                className="text-xs text-rose-500 hover:underline"
              >
                Quit Examination (No Score Saved)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Submit Examination?
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please review your test attempt summary before finalizing. Once submitted, your score
              will be computed with negative marking and published to the merit leaderboard.
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <div>
                <p className="text-lg font-black text-emerald-600">{answeredCount}</p>
                <p className="text-[10px] text-slate-400">Answered</p>
              </div>
              <div>
                <p className="text-lg font-black text-amber-500">{reviewCount}</p>
                <p className="text-[10px] text-slate-400">Marked Review</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-500">{unattemptedCount}</p>
                <p className="text-[10px] text-slate-400">Unanswered</p>
              </div>
            </div>

            {unattemptedCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  You still have {unattemptedCount} unattempted questions. Are you sure you want to
                  submit now?
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Keep Reviewing
              </button>
              <button
                id="confirm-submit-exam-btn"
                disabled={isSubmitting}
                onClick={() => handleSubmitQuiz(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
