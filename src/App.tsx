import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { QuizList } from './components/QuizList';
import { QuizAttemptView } from './components/QuizAttemptView';
import { QuizResultView } from './components/QuizResultView';
import { LeaderboardView } from './components/LeaderboardView';
import { StudentDashboard } from './components/StudentDashboard';
import { PricingView } from './components/PricingView';
import { AdminPanel } from './components/AdminPanel';
import { PrismaStudioView } from './components/PrismaStudioView';
import { ArchitectureHubView } from './components/ArchitectureHubView';
import { MobbinDesignView } from './components/MobbinDesignView';

import { elasticsearchEngine } from './services/elasticsearch/elasticsearchClient';
import { cdcPipeline } from './services/cdc/cdcPipeline';
import { kafkaClient } from './services/kafka/kafkaClient';
import { flinkStreamEngine } from './services/flink/flinkStreamEngine';
import { paymentMicroservice } from './services/payment/paymentService';
import { QuizController } from './controllers/QuizController';
import { PaymentController } from './controllers/PaymentController';

import {
  User,
  Quiz,
  Question,
  Subject,
  Category,
  Chapter,
  QuizAttempt,
  LeaderboardEntry,
  PaymentRecord,
  SubscriptionPlan,
  PaymentProvider
} from './types';

import {
  INITIAL_SUBJECTS,
  INITIAL_CATEGORIES,
  INITIAL_CHAPTERS,
  INITIAL_QUIZZES,
  INITIAL_QUESTIONS,
  INITIAL_LEADERBOARD,
  INITIAL_PAYMENTS
} from './data/mockData';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Active User State
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-student-free',
    name: 'Rakibul Islam',
    email: 'rakib.edu.bd@gmail.com',
    role: 'STUDENT',
    isPremium: false,
    subscriptionPlan: 'FREE',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    createdAt: '2026-01-10T10:00:00Z',
  });

  // App Data State
  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [chapters, setChapters] = useState<Chapter[]>(INITIAL_CHAPTERS);
  const [questions, setQuestions] = useState<Record<string, Question[]>>(INITIAL_QUESTIONS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [bookmarkedQuizIds, setBookmarkedQuizIds] = useState<string[]>([]);
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark mode class with root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Index catalog into Elasticsearch BM25 cluster on mount & updates
  useEffect(() => {
    elasticsearchEngine.initializeIndices(quizzes, subjects, categories, questions);
  }, [quizzes, subjects, categories, questions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Start exam handler
  const handleStartQuiz = (quizId: string) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    // Check access rules
    if (quiz.isPaid && !currentUser.isPremium) {
      showToast('This model test requires BCS Pro Pass. Redirecting to pricing...');
      setCurrentView('pricing');
      return;
    }

    // Publish attempt started event to Kafka
    kafkaClient.produce(
      'exampro.attempts.events',
      currentUser.id,
      { action: 'ATTEMPT_STARTED', quizId, userId: currentUser.id, timestamp: new Date().toISOString() },
      [{ key: 'event.type', value: 'attempt.started' }]
    );

    setActiveQuizId(quizId);
    setCurrentView('attempt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Finish exam handler - Integrated with CDC, Kafka, and Flink
  const handleFinishQuiz = (attempt: QuizAttempt) => {
    setAttempts((prev) => [attempt, ...prev]);
    setCurrentAttempt(attempt);

    // Update quiz attempt count
    setQuizzes((prev) =>
      prev.map((q) => (q.id === attempt.quizId ? { ...q, attemptCount: q.attemptCount + 1 } : q))
    );

    // Add to leaderboard
    const activeQuiz = quizzes.find((q) => q.id === attempt.quizId);
    const newEntry: LeaderboardEntry = {
      id: 'lb-' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      accuracy: attempt.accuracyPercentage,
      timeSpentSeconds: attempt.timeSpentSeconds,
      rank: Math.min(10, leaderboard.length + 1),
      recordedAt: new Date().toISOString(),
      quizTitle: activeQuiz?.title || 'BCS Model Test',
    };

    setLeaderboard((prev) => [newEntry, ...prev]);

    // 1. Capture in PostgreSQL CDC Pipeline (Debezium WAL)
    cdcPipeline.captureMutation('QuizAttempt', 'c', null, attempt);

    // 2. Publish to Apache Kafka `exampro.attempts.events` topic
    kafkaClient.produce(
      'exampro.attempts.events',
      currentUser.id,
      { attempt, quiz: activeQuiz, userName: currentUser.name },
      [
        { key: 'event.type', value: 'attempt.submitted' },
        { key: 'quiz.id', value: attempt.quizId },
        { key: 'score', value: attempt.score.toString() },
      ]
    );

    // 3. Ingest into Apache Flink Stateful Stream Processing Engine
    flinkStreamEngine.processAttemptStream({ attempt, quiz: activeQuiz, userName: currentUser.name });

    setCurrentView('result');
    showToast(`Test submitted! Score: ${attempt.score.toFixed(2)} • CDC & Kafka events streamed to Flink.`);
  };

  // Review past attempt handler
  const handleReviewAttempt = (attempt: QuizAttempt) => {
    setActiveQuizId(attempt.quizId);
    setCurrentAttempt(attempt);
    setCurrentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retake exam
  const handleRetakeQuiz = () => {
    if (activeQuizId) {
      setCurrentView('attempt');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Bookmark toggles
  const handleToggleQuizBookmark = (quizId: string) => {
    setBookmarkedQuizIds((prev) => {
      const exists = prev.includes(quizId);
      const updated = exists ? prev.filter((id) => id !== quizId) : [...prev, quizId];
      showToast(exists ? 'Model test removed from saved list' : 'Model test saved to bookmarks');
      return updated;
    });
  };

  const handleToggleQuestionBookmark = (questionId: string) => {
    setBookmarkedQuestionIds((prev) => {
      const exists = prev.includes(questionId);
      const updated = exists ? prev.filter((id) => id !== questionId) : [...prev, questionId];
      showToast(exists ? 'Question removed from bookmarks' : 'Question bookmarked for revision');
      return updated;
    });
  };

  // Plan upgrade handler via Payment Microservice & Idempotency Engine
  const handleUpgradePlan = async (
    plan: SubscriptionPlan,
    provider: PaymentProvider,
    amount: number
  ) => {
    const idempKey = `idemp-${currentUser.id}-${plan}-${Date.now().toString(36)}`;
    const gateway = provider === 'NAGAD' ? 'NAGAD' : 'BKASH';

    // 1. Dispatch to Payment Microservice
    const { transaction } = await paymentMicroservice.initiateCheckout({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      amount,
      plan,
      gateway,
      idempotencyKey: idempKey,
    });

    // 2. Complete verification & record double-entry ledger
    await paymentMicroservice.executeVerification(transaction.transactionId, true);

    const newPayment: PaymentRecord = {
      id: transaction.transactionId,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      currency: 'BDT',
      provider,
      transactionId: transaction.transactionId,
      plan,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Upgrade user profile
    setCurrentUser((prev) => ({
      ...prev,
      isPremium: true,
      subscriptionPlan: plan,
      subscriptionExpiresAt: '2027-03-31',
    }));

    showToast(`Payment verified! ${plan} activated via ${gateway} (Tx: ${transaction.transactionId}). Ledger updated.`);
  };

  // Admin CRUD Handlers with CDC and Elasticsearch propagation
  const handleAddQuiz = (newQuiz: Quiz) => {
    setQuizzes((prev) => [newQuiz, ...prev]);
    // Emit CDC mutation (automatically updates Kafka & Elasticsearch)
    cdcPipeline.captureMutation('Quiz', 'c', null, newQuiz);
    showToast(`Quiz "${newQuiz.title}" created. CDC captured & synced to Elasticsearch.`);
  };

  const handleDeleteQuiz = (quizId: string) => {
    const target = quizzes.find((q) => q.id === quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    if (target) {
      cdcPipeline.captureMutation('Quiz', 'd', target, null);
    }
    showToast('Quiz deleted. CDC propagated delete mutation to Elasticsearch.');
  };

  const handleAddQuestion = (quizId: string, newQ: Question) => {
    setQuestions((prev) => ({
      ...prev,
      [quizId]: [...(prev[quizId] || []), newQ],
    }));
    // update quiz total questions
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, totalQuestions: q.totalQuestions + 1 } : q))
    );
    showToast('Question successfully added to question bank.');
  };

  const handleBulkAddQuestions = (quizId: string, newQs: Question[]) => {
    setQuestions((prev) => ({
      ...prev,
      [quizId]: [...(prev[quizId] || []), ...newQs],
    }));
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, totalQuestions: q.totalQuestions + newQs.length } : q))
    );
    showToast(`Successfully imported ${newQs.length} questions into quiz.`);
  };

  const handleDeleteQuestion = (quizId: string, questionId: string) => {
    setQuestions((prev) => ({
      ...prev,
      [quizId]: (prev[quizId] || []).filter((q) => q.id !== questionId),
    }));
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId ? { ...q, totalQuestions: Math.max(0, q.totalQuestions - 1) } : q
      )
    );
    showToast('Question removed.');
  };

  const handleAddSubject = (s: Subject) => setSubjects((prev) => [...prev, s]);
  const handleAddCategory = (c: Category) => setCategories((prev) => [...prev, c]);
  const handleAddChapter = (ch: Chapter) => setChapters((prev) => [...prev, ch]);

  // Seed Synchronization
  const handlePrismaSeedReset = () => {
    setQuizzes([...INITIAL_QUIZZES]);
    setSubjects([...INITIAL_SUBJECTS]);
    setCategories([...INITIAL_CATEGORIES]);
    setChapters([...INITIAL_CHAPTERS]);
    setQuestions({ ...INITIAL_QUESTIONS });
    setLeaderboard([...INITIAL_LEADERBOARD]);
    setPayments([...INITIAL_PAYMENTS]);
    showToast('Prisma database successfully seeded! All 14 models synchronized.');
  };

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || quizzes[0];
  const activeQuizQuestions = (activeQuizId && questions[activeQuizId]) || questions['quiz-bcs-model-1'] || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-2xl border border-slate-800 dark:border-slate-200 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          showToast(`Switched active persona to ${user.name}`);
        }}
        bookmarkCount={bookmarkedQuizIds.length + bookmarkedQuestionIds.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSearch={(q) => {
          setSearchQuery(q);
          setCurrentView('quizzes');
        }}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <HomeView
            quizzes={quizzes}
            subjects={subjects}
            leaderboard={leaderboard}
            currentUser={currentUser}
            onStartQuiz={handleStartQuiz}
            onNavigate={setCurrentView}
            onSelectSubject={(subId) => {
              setSelectedSubjectFilter(subId);
              setCurrentView('quizzes');
            }}
          />
        )}

        {currentView === 'quizzes' && (
          <QuizList
            quizzes={quizzes}
            subjects={subjects}
            categories={categories}
            chapters={chapters}
            currentUser={currentUser}
            onStartQuiz={handleStartQuiz}
            onNavigate={setCurrentView}
            selectedSubjectId={selectedSubjectFilter}
            onSelectSubject={setSelectedSubjectFilter}
            bookmarks={bookmarkedQuizIds}
            onToggleBookmark={handleToggleQuizBookmark}
            initialSearchQuery={searchQuery}
          />
        )}

        {currentView === 'attempt' && activeQuiz && (
          <QuizAttemptView
            quiz={activeQuiz}
            questions={activeQuizQuestions}
            userId={currentUser.id}
            onFinishQuiz={handleFinishQuiz}
            onCancelQuiz={() => setCurrentView('quizzes')}
            onBookmarkQuestion={handleToggleQuestionBookmark}
            bookmarkedQuestionIds={bookmarkedQuestionIds}
          />
        )}

        {currentView === 'result' && activeQuiz && currentAttempt && (
          <QuizResultView
            quiz={activeQuiz}
            questions={activeQuizQuestions}
            attempt={currentAttempt}
            onRetakeQuiz={handleRetakeQuiz}
            onNavigate={setCurrentView}
            onBookmarkQuestion={handleToggleQuestionBookmark}
            bookmarkedQuestionIds={bookmarkedQuestionIds}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            entries={leaderboard}
            quizzes={quizzes}
            currentUserId={currentUser.id}
          />
        )}

        {currentView === 'dashboard' && (
          <StudentDashboard
            currentUser={currentUser}
            attempts={attempts}
            quizzes={quizzes}
            bookmarkedQuestionIds={bookmarkedQuestionIds}
            allQuestions={questions}
            onReviewAttempt={handleReviewAttempt}
            onNavigate={setCurrentView}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {currentView === 'pricing' && (
          <PricingView
            currentUser={currentUser}
            onUpgradePlan={handleUpgradePlan}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            quizzes={quizzes}
            subjects={subjects}
            categories={categories}
            chapters={chapters}
            questions={questions}
            payments={payments}
            onAddQuiz={handleAddQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onAddQuestion={handleAddQuestion}
            onBulkAddQuestions={handleBulkAddQuestions}
            onDeleteQuestion={handleDeleteQuestion}
            onAddSubject={handleAddSubject}
            onAddCategory={handleAddCategory}
            onAddChapter={handleAddChapter}
            onOpenPrismaStudio={() => setCurrentView('prisma_studio')}
          />
        )}

        {currentView === 'prisma_studio' && (
          <div className="fixed inset-0 z-50 bg-[#0F172A]">
            <PrismaStudioView
              onDataReset={handlePrismaSeedReset}
              onClose={() => setCurrentView('home')}
            />
          </div>
        )}

        {currentView === 'architecture' && (
          <ArchitectureHubView
            currentUser={currentUser}
            quizzes={quizzes}
            onSwitchUser={(user) => {
              setCurrentUser(user);
              showToast(`Switched active persona to ${user.name}`);
            }}
            onClose={() => setCurrentView('home')}
          />
        )}

        {currentView === 'mobbin' && (
          <MobbinDesignView
            onClose={() => setCurrentView('home')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">ExamPro</span>
            <span>• 47th BCS, Bank Recruitment & University Admission Testing Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('quizzes')} className="hover:underline">
              Model Tests
            </button>
            <button onClick={() => setCurrentView('leaderboard')} className="hover:underline">
              Merit Board
            </button>
            <button onClick={() => setCurrentView('pricing')} className="hover:underline">
              BCS Pro Pass
            </button>
            <button
              onClick={() => setCurrentView('mobbin')}
              className="hover:underline font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"
            >
              <span>Mobbin Design</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            </button>
            <button
              onClick={() => setCurrentView('architecture')}
              className="hover:underline font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>Architecture Hub</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            </button>
            <button
              onClick={() => setCurrentView('prisma_studio')}
              className="hover:underline font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1"
            >
              <span>Prisma Studio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </button>
            <button
              onClick={() => {
                setCurrentUser((prev) => ({
                  ...prev,
                  role: prev.role === 'ADMIN' ? 'STUDENT' : 'ADMIN',
                }));
                showToast('Toggled admin privileges');
              }}
              className="hover:underline font-semibold text-purple-600 dark:text-purple-400"
            >
              Toggle Admin Mode
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
