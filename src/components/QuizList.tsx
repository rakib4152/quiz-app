import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Lock,
  Zap,
  Bookmark,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Quiz, Subject, Category, Chapter, User } from '../types';

interface QuizListProps {
  quizzes: Quiz[];
  subjects: Subject[];
  categories: Category[];
  chapters: Chapter[];
  currentUser: User;
  onStartQuiz: (quizId: string) => void;
  onNavigate: (view: string) => void;
  selectedSubjectId?: string;
  onSelectSubject: (subjectId: string) => void;
  bookmarks: string[];
  onToggleBookmark: (quizId: string) => void;
  initialSearchQuery?: string;
}

export const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  subjects,
  categories,
  chapters,
  currentUser,
  onStartQuiz,
  onNavigate,
  selectedSubjectId = 'ALL',
  onSelectSubject,
  bookmarks,
  onToggleBookmark,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [accessFilter, setAccessFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');

  // Filtered quizzes calculation
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = quiz.title.toLowerCase().includes(query);
        const matchesDesc = quiz.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Subject filter
      if (selectedSubjectId !== 'ALL' && quiz.subjectId !== selectedSubjectId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && quiz.categoryId !== selectedCategory) {
        return false;
      }

      // Free / Paid filter
      if (accessFilter === 'FREE' && quiz.isPaid) return false;
      if (accessFilter === 'PAID' && !quiz.isPaid) return false;

      // Difficulty filter
      if (difficultyFilter !== 'ALL' && quiz.difficulty !== difficultyFilter) {
        return false;
      }

      return true;
    });
  }, [quizzes, searchQuery, selectedSubjectId, selectedCategory, accessFilter, difficultyFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setAccessFilter('ALL');
    onSelectSubject('ALL');
    setSelectedCategory('ALL');
    setDifficultyFilter('ALL');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Competitive Exam Model Tests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose from comprehensive subject-wise tests, chapter drills, and full BCS preliminary model sets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <strong className="text-emerald-600">{filteredQuizzes.length}</strong> of {quizzes.length} Tests
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        {/* Search Bar & Access Tabs */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="quiz-list-search-input"
              type="text"
              placeholder="Search by title, keywords (e.g., BCS Prelims, Math, Charjapad)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Paid / Free Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={() => setAccessFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                accessFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Tests
            </button>
            <button
              onClick={() => setAccessFilter('FREE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                accessFilter === 'FREE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Free Only
            </button>
            <button
              onClick={() => setAccessFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                accessFilter === 'PAID'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pro Only
            </button>
          </div>
        </div>

        {/* Dropdowns Row: Subject, Category, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Subject Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Subject
            </label>
            <select
              id="subject-filter-select"
              value={selectedSubjectId}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Exam Track
            </label>
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Exam Tracks</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Difficulty
            </label>
            <select
              id="difficulty-filter-select"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="w-full text-xs py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium (Standard)</option>
              <option value="HARD">Hard (BCS Standard)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Quizzes List Cards */}
      {filteredQuizzes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No quizzes match your filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try adjusting your search query, subject filter, or access type.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => {
            const subject = subjects.find((s) => s.id === quiz.subjectId);
            const category = categories.find((c) => c.id === quiz.categoryId);
            const isBookmarked = bookmarks.includes(quiz.id);
            const canAccess = !quiz.isPaid || currentUser.isPremium;

            return (
              <div
                key={quiz.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  {/* Category & Status Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {category?.name || 'Model Test'}
                      </span>
                      {quiz.isPaid ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> PRO • ৳{quiz.price}
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          FREE
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {quiz.difficulty}
                      </span>
                    </div>

                    {/* Bookmark icon button */}
                    <button
                      onClick={() => onToggleBookmark(quiz.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this test'}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>

                  {/* Exam Rules Pill */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.totalQuestions} MCQs ({quiz.totalMarks} Marks)
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                      -{quiz.negativeMarkRate} Negative Marking
                    </span>
                  </div>
                </div>

                {/* Bottom Bar: Action Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Pass: <strong>{quiz.passMarks} Marks</strong>
                  </div>

                  {canAccess ? (
                    <button
                      id={`start-quiz-btn-${quiz.id}`}
                      onClick={() => onStartQuiz(quiz.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all hover:translate-y-[-1px]"
                    >
                      <Zap className="w-3.5 h-3.5" /> Start Test Now
                    </button>
                  ) : (
                    <button
                      id={`unlock-quiz-btn-${quiz.id}`}
                      onClick={() => onNavigate('pricing')}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Unlock with Pro Pass
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
