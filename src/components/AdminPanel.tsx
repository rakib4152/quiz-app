import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Upload,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Layers,
  FolderTree,
  DollarSign,
  Smartphone,
  ShieldCheck,
  Search,
  Check,
  Download,
  Flame,
  Database,
} from 'lucide-react';
import {
  Quiz,
  Question,
  Subject,
  Category,
  Chapter,
  User,
  PaymentRecord,
  Difficulty,
} from '../types';
import { MOBILE_API_ENDPOINTS } from '../api/mobileApi';

interface AdminPanelProps {
  quizzes: Quiz[];
  subjects: Subject[];
  categories: Category[];
  chapters: Chapter[];
  questions: Record<string, Question[]>;
  payments: PaymentRecord[];
  onAddQuiz: (newQuiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  onAddQuestion: (quizId: string, newQ: Question) => void;
  onBulkAddQuestions: (quizId: string, newQuestions: Question[]) => void;
  onDeleteQuestion: (quizId: string, questionId: string) => void;
  onAddSubject: (subject: Subject) => void;
  onAddCategory: (category: Category) => void;
  onAddChapter: (chapter: Chapter) => void;
  onOpenPrismaStudio?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  quizzes,
  subjects,
  categories,
  chapters,
  questions,
  payments,
  onAddQuiz,
  onDeleteQuiz,
  onAddQuestion,
  onBulkAddQuestions,
  onDeleteQuestion,
  onAddSubject,
  onAddCategory,
  onAddChapter,
  onOpenPrismaStudio,
}) => {
  const [adminTab, setAdminTab] = useState<
    'OVERVIEW' | 'QUIZZES' | 'QUESTIONS' | 'HIERARCHY' | 'USERS_PAYMENTS' | 'MOBILE_API'
  >('OVERVIEW');

  // New Quiz Form State
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizDuration, setQuizDuration] = useState(15);
  const [quizTotalMarks, setQuizTotalMarks] = useState(10);
  const [quizPassMarks, setQuizPassMarks] = useState(6);
  const [quizNegativeMark, setQuizNegativeMark] = useState(0.25);
  const [quizIsPaid, setQuizIsPaid] = useState(false);
  const [quizPrice, setQuizPrice] = useState(49);
  const [quizSubjectId, setQuizSubjectId] = useState(subjects[0]?.id || '');
  const [quizCategoryId, setQuizCategoryId] = useState(categories[0]?.id || '');
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty>('MEDIUM');

  // Single Question Form State
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [targetQuizId, setTargetQuizId] = useState(quizzes[0]?.id || '');
  const [qText, setQText] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qMarks, setQMarks] = useState(1.0);
  const [qNegativeMarks, setQNegativeMarks] = useState(0.25);
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctLetter, setCorrectLetter] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // CSV Bulk Upload State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedCsvRows, setParsedCsvRows] = useState<any[]>([]);

  // Sample CSV content generator
  const sampleCsvContent = `Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Explanation
চর্যাপদ কোন ছন্দে রচিত?,মাত্রাবৃত্ত,অক্ষরবৃত্ত,স্বরবৃত্ত,মুক্তক,A,চর্যাপদের অধিকাংশ পদই মাত্রাবৃত্ত ছন্দে রচিত।
What is the synonym of 'Competent'?,Incapable,Capable,Careless,Sluggish,B,'Competent' means having necessary ability or skills.
বাংলাদেশের জাতীয় সংসদের অধিবেশন কে আহ্বান করেন?,প্রধানমন্ত্রী,স্পিকার,রাষ্ট্রপতি,প্রধান বিচারপতি,C,সংবিধানের ৭২(১) অনুচ্ছেদ অনুযায়ী রাষ্ট্রপতি সংসদ অধিবেশন আহ্বান করেন।`;

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    const newQuiz: Quiz = {
      id: 'quiz-' + Date.now(),
      title: quizTitle,
      slug: quizTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: quizDesc,
      durationMinutes: Number(quizDuration),
      totalMarks: Number(quizTotalMarks),
      passMarks: Number(quizPassMarks),
      negativeMarkRate: Number(quizNegativeMark),
      isPaid: quizIsPaid,
      price: quizIsPaid ? Number(quizPrice) : 0,
      difficulty: quizDifficulty,
      subjectId: quizSubjectId,
      categoryId: quizCategoryId,
      isPublished: true,
      totalQuestions: 0,
      attemptCount: 0,
      createdAt: new Date().toISOString(),
    };

    onAddQuiz(newQuiz);
    setShowNewQuizModal(false);
    setQuizTitle('');
    setQuizDesc('');
  };

  const handleCreateSingleQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !optA.trim() || !optB.trim()) return;

    const qId = 'q-' + Date.now();
    const newQuestion: Question = {
      id: qId,
      quizId: targetQuizId,
      text: qText,
      explanation: qExplanation,
      marks: Number(qMarks),
      negativeMarks: Number(qNegativeMarks),
      difficulty: 'MEDIUM',
      options: [
        { id: qId + '-a', questionId: qId, optionLetter: 'A', text: optA, isCorrect: correctLetter === 'A' },
        { id: qId + '-b', questionId: qId, optionLetter: 'B', text: optB, isCorrect: correctLetter === 'B' },
        { id: qId + '-c', questionId: qId, optionLetter: 'C', text: optC, isCorrect: correctLetter === 'C' },
        { id: qId + '-d', questionId: qId, optionLetter: 'D', text: optD, isCorrect: correctLetter === 'D' },
      ],
    };

    onAddQuestion(targetQuizId, newQuestion);
    setShowAddQuestionModal(false);
    setQText('');
    setQExplanation('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
  };

  const handleParseCsv = (textToParse: string) => {
    setCsvRawText(textToParse);
    const lines = textToParse.trim().split('\n');
    if (lines.length < 2) {
      setParsedCsvRows([]);
      return;
    }

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      if (cols.length >= 6) {
        rows.push({
          text: cols[0]?.trim(),
          optA: cols[1]?.trim(),
          optB: cols[2]?.trim(),
          optC: cols[3]?.trim(),
          optD: cols[4]?.trim(),
          correct: cols[5]?.trim()?.toUpperCase(),
          explanation: cols[6]?.trim() || '',
        });
      }
    }
    setParsedCsvRows(rows);
  };

  const handleImportCsvQuestions = () => {
    if (parsedCsvRows.length === 0) return;

    const newQuestions: Question[] = parsedCsvRows.map((r, idx) => {
      const qId = 'q-csv-' + Date.now() + '-' + idx;
      return {
        id: qId,
        quizId: targetQuizId,
        text: r.text,
        explanation: r.explanation,
        marks: 1.0,
        negativeMarks: 0.25,
        difficulty: 'MEDIUM',
        options: [
          { id: qId + '-a', questionId: qId, optionLetter: 'A', text: r.optA, isCorrect: r.correct === 'A' },
          { id: qId + '-b', questionId: qId, optionLetter: 'B', text: r.optB, isCorrect: r.correct === 'B' },
          { id: qId + '-c', questionId: qId, optionLetter: 'C', text: r.optC, isCorrect: r.correct === 'C' },
          { id: qId + '-d', questionId: qId, optionLetter: 'D', text: r.optD, isCorrect: r.correct === 'D' },
        ],
      };
    });

    onBulkAddQuestions(targetQuizId, newQuestions);
    setShowCsvModal(false);
    setCsvRawText('');
    setParsedCsvRows([]);
  };

  // Aggregated Stats
  const totalStudents = 1420;
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalQuestionsCount = Object.values(questions).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs font-black">
              ADMIN CONTROL CENTER
            </span>
            <span className="text-xs text-slate-400">Shadcn Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            ExamPro Management Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure quizzes, questions, pricing rules, subject taxonomies, and view mobile endpoints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-create-quiz-btn"
            onClick={() => setShowNewQuizModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create New Quiz
          </button>
          <button
            id="admin-csv-upload-btn"
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> CSV Bulk Upload
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAdminTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              adminTab === 'OVERVIEW'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Analytics Overview
          </button>
          <button
            onClick={() => setAdminTab('QUIZZES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              adminTab === 'QUIZZES'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Quizzes & Pricing ({quizzes.length})
          </button>
          <button
            onClick={() => setAdminTab('QUESTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              adminTab === 'QUESTIONS'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Question Bank ({totalQuestionsCount})
          </button>
          <button
            onClick={() => setAdminTab('HIERARCHY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              adminTab === 'HIERARCHY'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" /> Subject Hierarchy
          </button>
          <button
            onClick={() => setAdminTab('USERS_PAYMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              adminTab === 'USERS_PAYMENTS'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Payments & Subscriptions
          </button>
          <button
            onClick={() => setAdminTab('MOBILE_API')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              adminTab === 'MOBILE_API'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Mobile REST API Spec
          </button>
        </div>

        {onOpenPrismaStudio && (
          <button
            onClick={onOpenPrismaStudio}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all bg-[#0F1E36] hover:bg-[#162B4D] text-cyan-300 border border-cyan-700/80 shadow-sm shadow-cyan-950"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Prisma Studio</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        )}
      </div>

      {/* Tab 1: Overview Analytics */}
      {adminTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Revenue</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                ৳{totalRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">+18.4% this month</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Enrolled Students</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {totalStudents}
              </p>
              <span className="text-[10px] text-slate-400">Across Bangladesh</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Questions</span>
              <p className="text-2xl sm:text-3xl font-black text-blue-600">
                {totalQuestionsCount}
              </p>
              <span className="text-[10px] text-slate-400">Curated & Verified</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Model Tests Active</span>
              <p className="text-2xl sm:text-3xl font-black text-purple-600">
                {quizzes.length}
              </p>
              <span className="text-[10px] text-slate-400">BCS, Bank & Varsity</span>
            </div>
          </div>

          {/* Quick Shortcuts & Performance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Recent Model Test Participation
              </h3>
              <div className="space-y-2">
                {quizzes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{q.title}</p>
                      <span className="text-[10px] text-slate-400">
                        Pass: {q.passMarks}/{q.totalMarks} • -{q.negativeMarkRate} Wrong Penalty
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600">{q.attemptCount} attempts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Exam Platform System Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">PostgreSQL Database (Prisma)</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">Negative Marking Scoring Engine</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Active (0.25 / 0.50)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">bKash & Nagad Webhook Simulator</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">Mobile REST API Gateway</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready for Expo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Quizzes & Pricing Management */}
      {adminTab === 'QUIZZES' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Title & Slug</th>
                    <th className="py-3 px-4">Pricing</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Pass / Negative</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{quiz.title}</div>
                        <span className="text-[10px] text-slate-400">/{quiz.slug}</span>
                      </td>
                      <td className="py-3 px-4">
                        {quiz.isPaid ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-extrabold text-[10px] border border-amber-500/20">
                            PAID • ৳{quiz.price}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-extrabold text-[10px] border border-emerald-500/20">
                            FREE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {quiz.durationMinutes} mins
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span>{quiz.passMarks}/{quiz.totalMarks}</span>
                        <span className="text-rose-500 font-bold ml-1.5">(-{quiz.negativeMarkRate})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-bold">
                        {questions[quiz.id]?.length || quiz.totalQuestions} MCQs
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setTargetQuizId(quiz.id);
                            setShowAddQuestionModal(true);
                          }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          title="Add Question to this Quiz"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteQuiz(quiz.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Question Bank & Question Editor */}
      {adminTab === 'QUESTIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Filter by Model Test:
              </label>
              <select
                value={targetQuizId}
                onChange={(e) => setTargetQuizId(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
              <button
                onClick={() => setShowCsvModal(true)}
                className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Bulk CSV
              </button>
            </div>
          </div>

          {/* List of questions for the selected quiz */}
          <div className="space-y-3">
            {(questions[targetQuizId] || []).length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                No questions yet in this quiz. Click "Add Question" or "Bulk CSV" above to populate it.
              </div>
            ) : (
              (questions[targetQuizId] || []).map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        Q{idx + 1}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (+{q.marks} / -{q.negativeMarks})
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{q.text}</p>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-1.5 rounded-lg ${
                            opt.isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                              : ''
                          }`}
                        >
                          {opt.optionLetter}. {opt.text} {opt.isCorrect && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteQuestion(targetQuizId, q.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Hierarchy (Subjects, Categories, Chapters) */}
      {adminTab === 'HIERARCHY' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subjects */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Subjects ({subjects.length})</h3>
            <div className="space-y-2">
              {subjects.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{s.name}</div>
                  <span className="text-[10px] text-slate-400">{s.code} • {s.questionCount} Questions</span>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Exam Categories ({categories.length})</h3>
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                  <span className="text-[10px] text-slate-400">/{c.slug}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chapters */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">High-Yield Chapters ({chapters.length})</h3>
            <div className="space-y-2">
              {chapters.map((ch) => (
                <div key={ch.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{ch.name}</div>
                  <span className="text-[10px] text-slate-400">Order #{ch.order}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Users & Payments */}
      {adminTab === 'USERS_PAYMENTS' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Recent Subscription Payments & Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.transactionId}
                      </td>
                      <td className="py-2.5 px-3">{p.userName}</td>
                      <td className="py-2.5 px-3">{p.plan}</td>
                      <td className="py-2.5 px-3 font-bold text-pink-600">{p.provider}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">৳{p.amount}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                        {p.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Mobile REST API Spec (For Expo / React Native) */}
      {adminTab === 'MOBILE_API' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                Mobile REST API & React Native / Expo Architecture
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All backend endpoints are built to be shared directly between web clients and the mobile app.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              Base: /api/v1
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {MOBILE_API_ENDPOINTS.map((ep, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-black text-[10px] px-2 py-0.5 rounded ${
                        ep.method === 'POST'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {ep.path}
                    </span>
                    {ep.authRequired && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        JWT Bearer
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{ep.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create New Quiz */}
      {showNewQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateQuiz}
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-black text-base text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Create New Model Test
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Quiz Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 47th BCS Preliminary Bangla Model Test - 02"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Brief syllabus and focus areas..."
                value={quizDesc}
                onChange={(e) => setQuizDesc(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold block mb-1">Duration (Min)</label>
                <input
                  type="number"
                  min={1}
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1">Pass Marks</label>
                <input
                  type="number"
                  min={1}
                  value={quizPassMarks}
                  onChange={(e) => setQuizPassMarks(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1 text-rose-500">Negative Rate</label>
                <select
                  value={quizNegativeMark}
                  onChange={(e) => setQuizNegativeMark(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value={0.25}>-0.25 (BCS Standard)</option>
                  <option value={0.5}>-0.50 (Strict)</option>
                  <option value={0}>0.00 (No penalty)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1">Difficulty</label>
                <select
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {/* Paid / Free config */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quizIsPaid}
                  onChange={(e) => setQuizIsPaid(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Paid Quiz (Requires Pro Pass or Individual Purchase)
                </span>
              </label>

              {quizIsPaid && (
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Individual Price (BDT)</label>
                  <input
                    type="number"
                    min={10}
                    value={quizPrice}
                    onChange={(e) => setQuizPrice(Number(e.target.value))}
                    className="w-32 text-xs p-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewQuizModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Save & Publish Quiz
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Single Question Add */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateSingleQuestion}
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-black text-base text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Add Question to Bank
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Question Text (Bengali or English)
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. চর্যাপদের সবচেয়ে বেশি পদ কে রচনা করেছেন?"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold block mb-1">Option A</label>
                <input
                  required
                  type="text"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1">Option B</label>
                <input
                  required
                  type="text"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1">Option C</label>
                <input
                  required
                  type="text"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1">Option D</label>
                <input
                  required
                  type="text"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-emerald-600 block mb-1">
                  Designate Correct Option
                </label>
                <select
                  value={correctLetter}
                  onChange={(e) => setCorrectLetter(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-emerald-500 font-bold"
                >
                  <option value="A">Option A is Correct</option>
                  <option value="B">Option B is Correct</option>
                  <option value="C">Option C is Correct</option>
                  <option value="D">Option D is Correct</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Negative Penalty
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={qNegativeMarks}
                  onChange={(e) => setQNegativeMarks(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Detailed Explanation & Citation
              </label>
              <textarea
                rows={2}
                placeholder="Background references, BPSC question year, or grammatical rule..."
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Save Question
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: CSV Bulk Uploader */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Bulk Upload Questions via CSV
                </h3>
                <p className="text-xs text-slate-500">
                  Target Quiz: <strong>{quizzes.find((q) => q.id === targetQuizId)?.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Paste CSV text below or click "Load Sample Data":
              </span>
              <button
                onClick={() => handleParseCsv(sampleCsvContent)}
                className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                Load Sample BCS CSV
              </button>
            </div>

            <textarea
              rows={6}
              value={csvRawText}
              onChange={(e) => handleParseCsv(e.target.value)}
              placeholder="Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Explanation"
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />

            {parsedCsvRows.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600">
                  ✓ Parsed {parsedCsvRows.length} Valid Questions for Import:
                </span>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {parsedCsvRows.map((r, i) => (
                    <div key={i} className="p-2 flex items-center justify-between">
                      <span className="font-bold truncate max-w-md">{r.text}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
                        Correct: {r.correct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                disabled={parsedCsvRows.length === 0}
                onClick={handleImportCsvQuestions}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Import {parsedCsvRows.length} Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
