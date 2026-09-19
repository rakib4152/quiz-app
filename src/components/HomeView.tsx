import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Users,
  ShieldCheck,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Quiz, Subject, LeaderboardEntry, User } from '../types';

interface HomeViewProps {
  quizzes: Quiz[];
  subjects: Subject[];
  leaderboard: LeaderboardEntry[];
  currentUser: User;
  onStartQuiz: (quizId: string) => void;
  onNavigate: (view: string) => void;
  onSelectSubject: (subjectId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  quizzes,
  subjects,
  leaderboard,
  currentUser,
  onStartQuiz,
  onNavigate,
  onSelectSubject,
}) => {
  // Daily Question interactive card state
  const [selectedDailyOption, setSelectedDailyOption] = useState<number | null>(null);
  const [hasAnsweredDaily, setHasAnsweredDaily] = useState(false);

  const dailyQuestion = {
    text: '‘স্বাধীনতা হীনতায় কে বাঁচিতে চায় হে, কে বাঁচিতে চায়?’ - চরণটি কার রচনা?',
    options: ['ঈশ্বরচন্দ্র গুপ্ত', 'রঙ্গলাল বন্দ্যোপাধ্যায়', 'মাইকেল মধুসূদন দত্ত', 'হেমচন্দ্র বন্দ্যোপাধ্যায়'],
    correctIndex: 1,
    explanation: 'পদ্মিনী উপাখ্যান (১৮৫৮) কাব্যে কবি রঙ্গলাল বন্দ্যোপাধ্যায় এই বিখ্যাত স্বদেশপ্রেমমূলক চরণটি রচনা করেন।',
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Exam Preparation Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-emerald-900/40">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold backdrop-blur">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>47th BCS & Combined Bank Officer Live Exam Series</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Master Competitive Exams with Precision MCQ Analytics
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Real-time examination simulation with standard negative marking (0.25 & 0.50), subject-wise deep analytics,
            curated question banks, and competitive merit rankings for BCS, Bank, and University admissions.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-start-primary-quiz-btn"
              onClick={() => onStartQuiz(quizzes[0]?.id || 'quiz-bcs-model-1')}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:translate-y-[-1px]"
            >
              <Zap className="w-4 h-4 fill-current" />
              Take Free BCS Model Test
            </button>
            <button
              id="hero-explore-all-btn"
              onClick={() => onNavigate('quizzes')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 backdrop-blur flex items-center gap-2 transition-colors"
            >
              Explore 50+ Quizzes
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="text-2xl font-black text-white">4,800+</p>
              <p className="text-xs text-slate-400">Authentic Questions</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">0.25</p>
              <p className="text-xs text-slate-400">Negative Marking</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400">45k+</p>
              <p className="text-xs text-slate-400">Completed Attempts</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-400">98.4%</p>
              <p className="text-xs text-slate-400">BCS Exam Accuracy</p>
            </div>
          </div>
        </div>

        {/* Decorative subtle gradient orbs */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Target Competitive Exams Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Target Your Examination</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your specific recruitment category for aligned syllabus questions
            </p>
          </div>
          <button
            onClick={() => onNavigate('quizzes')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All Categories <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('quizzes')}
            className="group cursor-pointer p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              BCS
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              47th BCS Preliminary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              200-mark complete model test series with subject distribution matching BPSC syllabus.
            </p>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              18 Model Tests Available &rarr;
            </div>
          </div>

          <div
            onClick={() => onNavigate('quizzes')}
            className="group cursor-pointer p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              BANK
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Combined Bank Recruitment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Officer & Senior Officer mock tests with speed math, analytical reasoning and banking terms.
            </p>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              12 Practice Sets &rarr;
            </div>
          </div>

          <div
            onClick={() => onNavigate('quizzes')}
            className="group cursor-pointer p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/60 dark:hover:border-purple-500/60 transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              DU
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              University Admission
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Dhaka University KA/KHA/GHA units, GST unified admission solved past sets.
            </p>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              15 Unit Models &rarr;
            </div>
          </div>

          <div
            onClick={() => onNavigate('quizzes')}
            className="group cursor-pointer p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              DPE
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
              Primary Teacher Recruitment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Primary assistant teacher model tests with comprehensive Bengali, Math & GK focus.
            </p>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              10 Practice Tests &rarr;
            </div>
          </div>
        </div>
      </section>

      {/* Featured Model Tests & Daily Practice Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Featured Quizzes (2 columns) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Model Tests</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recommended exams with live timer & negative mark grading
              </p>
            </div>
            <button
              onClick={() => onNavigate('quizzes')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              See All &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {quizzes.slice(0, 3).map((quiz) => (
              <div
                key={quiz.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {quiz.difficulty}
                    </span>
                    {quiz.isPaid ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        PRO • ৳{quiz.price}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        FREE ACCESS
                      </span>
                    )}
                    <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                      -{quiz.negativeMarkRate} Wrong Penalty
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{quiz.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {quiz.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.totalQuestions} Questions ({quiz.totalMarks} Marks)
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.attemptCount} Participated
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center justify-between sm:items-end gap-2 shrink-0">
                  <button
                    onClick={() => onStartQuiz(quiz.id)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 ${
                      !quiz.isPaid || currentUser.isPremium
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {!quiz.isPaid || currentUser.isPremium ? (
                      <>
                        <Zap className="w-3.5 h-3.5" /> Start Exam
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Unlock Pro
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400">Pass: {quiz.passMarks} marks</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Daily Question of the Day & Live Leaderboard preview */}
        <div className="space-y-6">
          {/* Question of the Day Widget */}
          <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">
                Daily BCS Question
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Bangla Lit
              </span>
            </div>

            <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
              {dailyQuestion.text}
            </p>

            <div className="space-y-1.5 pt-1">
              {dailyQuestion.options.map((opt, idx) => {
                const isSelected = selectedDailyOption === idx;
                const isCorrect = idx === dailyQuestion.correctIndex;
                let btnStyle = 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800';

                if (hasAnsweredDaily) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnsweredDaily}
                    onClick={() => {
                      setSelectedDailyOption(idx);
                      setHasAnsweredDaily(true);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {hasAnsweredDaily && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            {hasAnsweredDaily && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 mt-2 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Explanation:</p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {dailyQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Top Rankers mini podium */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Live Merit Board
              </h3>
              <button
                onClick={() => onNavigate('leaderboard')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                Full List &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : 'bg-amber-700 text-amber-100'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white max-w-[140px] truncate">
                        {entry.userName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Acc: {entry.accuracy}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {entry.score}/{entry.totalMarks}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{entry.timeSpentSeconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Exploration Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subject-Wise Practice</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a subject to practice chapter-wise questions and diagnostic sets
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                onSelectSubject(sub.id);
                onNavigate('quizzes');
              }}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 text-left transition-all hover:translate-y-[-2px] group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600">
                {sub.name}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{sub.questionCount} MCQs</p>
            </button>
          ))}
        </div>
      </section>

      {/* BCS Pro Pass Callout Banner */}
      {!currentUser.isPremium && (
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-black px-2.5 py-1 rounded bg-amber-400 text-amber-950 uppercase tracking-wider">
              Special BCS Offer
            </span>
            <h3 className="text-2xl font-black">Unlock 47th BCS Complete Model Test Pass</h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Get unlimited access to 100+ full-length preliminary model tests, subject question banks,
              detailed video rationale, and all-Bangladesh merit standing for only ৳299/month.
            </p>
          </div>
          <button
            id="home-upgrade-pro-btn"
            onClick={() => onNavigate('pricing')}
            className="px-6 py-3 rounded-xl bg-white text-emerald-900 hover:bg-slate-100 font-extrabold text-xs shrink-0 shadow-md transition-colors"
          >
            Upgrade to Pro Now &rarr;
          </button>
        </section>
      )}
    </div>
  );
};
