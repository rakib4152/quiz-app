import React, { useState } from 'react';
import {
  Database,
  Terminal,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Code2,
  Table,
  Eye,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Server,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  SEED_USERS,
  SEED_SUBJECTS,
  SEED_CATEGORIES,
  SEED_CHAPTERS,
  SEED_QUIZZES,
  SEED_QUESTIONS,
  SEED_SUBSCRIPTIONS,
  SEED_PAYMENTS,
  SEED_ATTEMPTS,
  SEED_LEADERBOARD,
  SEED_BOOKMARKS,
  SEED_NOTIFICATIONS,
} from '../../prisma/seedData';

type ModelKey =
  | 'User'
  | 'Subject'
  | 'Category'
  | 'Chapter'
  | 'Quiz'
  | 'Question'
  | 'Option'
  | 'QuizAttempt'
  | 'QuizAnswer'
  | 'Bookmark'
  | 'Subscription'
  | 'Payment'
  | 'Leaderboard'
  | 'Notification';

interface PrismaStudioViewProps {
  onDataReset?: () => void;
  onClose?: () => void;
}

export const PrismaStudioView: React.FC<PrismaStudioViewProps> = ({ onDataReset, onClose }) => {
  // Current active model
  const [activeModel, setActiveModel] = useState<ModelKey>('Quiz');

  // Flatten options for Option model
  const initialOptions = SEED_QUESTIONS.flatMap((q) =>
    q.options.map((opt) => ({
      id: opt.id,
      questionId: q.id,
      optionLetter: opt.optionLetter,
      text: opt.text,
      isCorrect: opt.isCorrect,
    }))
  );

  // Flatten answers for QuizAnswer model
  const initialAnswers = [
    {
      id: 'ans-001',
      attemptId: 'att-001',
      questionId: 'q-bcs-01',
      selectedOptionId: 'opt-bcs-01-b',
      isCorrect: true,
      marksAwarded: 1.0,
      isMarkedForReview: false,
    },
    {
      id: 'ans-002',
      attemptId: 'att-001',
      questionId: 'q-bcs-02',
      selectedOptionId: 'opt-bcs-02-c',
      isCorrect: true,
      marksAwarded: 1.0,
      isMarkedForReview: false,
    },
    {
      id: 'ans-003',
      attemptId: 'att-002',
      questionId: 'q-bcs-01',
      selectedOptionId: 'opt-bcs-01-a',
      isCorrect: false,
      marksAwarded: -0.25,
      isMarkedForReview: true,
    },
  ];

  // In-memory relational database state for Prisma Studio
  const [dbData, setDbData] = useState<{
    User: any[];
    Subject: any[];
    Category: any[];
    Chapter: any[];
    Quiz: any[];
    Question: any[];
    Option: any[];
    QuizAttempt: any[];
    QuizAnswer: any[];
    Bookmark: any[];
    Subscription: any[];
    Payment: any[];
    Leaderboard: any[];
    Notification: any[];
  }>({
    User: [...SEED_USERS],
    Subject: [...SEED_SUBJECTS],
    Category: [...SEED_CATEGORIES],
    Chapter: [...SEED_CHAPTERS],
    Quiz: [...SEED_QUIZZES],
    Question: [...SEED_QUESTIONS],
    Option: initialOptions,
    QuizAttempt: [...SEED_ATTEMPTS],
    QuizAnswer: initialAnswers,
    Bookmark: [...SEED_BOOKMARKS],
    Subscription: [...SEED_SUBSCRIPTIONS],
    Payment: [...SEED_PAYMENTS],
    Leaderboard: [...SEED_LEADERBOARD],
    Notification: [...SEED_NOTIFICATIONS],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedLogs, setSeedLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCliGuideModal, setShowCliGuideModal] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  // Model definitions with their Prisma schema field types
  const MODEL_DEFINITIONS: Record<
    ModelKey,
    {
      columns: { key: string; type: string; isId?: boolean; isRelation?: boolean }[];
      description: string;
    }
  > = {
    User: {
      description: 'System accounts for Students, Instructors, and Administrators',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'name', type: 'String' },
        { key: 'email', type: 'String @unique' },
        { key: 'role', type: 'Role (Enum)' },
        { key: 'isPremium', type: 'Boolean' },
        { key: 'phone', type: 'String?' },
        { key: 'createdAt', type: 'DateTime' },
      ],
    },
    Subject: {
      description: 'Major curriculum tracks (Bangla, English, Bangladesh Affairs, etc.)',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'name', type: 'String @unique' },
        { key: 'code', type: 'String @unique' },
        { key: 'icon', type: 'String?' },
        { key: 'description', type: 'String?' },
      ],
    },
    Category: {
      description: 'Exam categories (47th BCS, Bank Recruitment, DU Admission)',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'name', type: 'String' },
        { key: 'slug', type: 'String @unique' },
        { key: 'subjectId', type: 'String (FK -> Subject)', isRelation: true },
        { key: 'description', type: 'String?' },
      ],
    },
    Chapter: {
      description: 'Topic chapters under categories',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'name', type: 'String' },
        { key: 'order', type: 'Int' },
        { key: 'categoryId', type: 'String (FK -> Category)', isRelation: true },
      ],
    },
    Quiz: {
      description: 'MCQ model tests with duration, pass marks, and negative marking',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'title', type: 'String' },
        { key: 'slug', type: 'String @unique' },
        { key: 'isPaid', type: 'Boolean' },
        { key: 'price', type: 'Float' },
        { key: 'durationMinutes', type: 'Int' },
        { key: 'totalMarks', type: 'Float' },
        { key: 'negativeMarkRate', type: 'Float' },
        { key: 'difficulty', type: 'Difficulty (Enum)' },
        { key: 'subjectId', type: 'String (FK -> Subject)', isRelation: true },
      ],
    },
    Question: {
      description: 'High-yield multiple choice questions with explanations',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'text', type: 'String' },
        { key: 'quizId', type: 'String (FK -> Quiz)', isRelation: true },
        { key: 'marks', type: 'Float' },
        { key: 'negativeMarks', type: 'Float' },
        { key: 'difficulty', type: 'Difficulty (Enum)' },
        { key: 'explanation', type: 'String?' },
      ],
    },
    Option: {
      description: 'Four answer choices per question (A, B, C, D)',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'questionId', type: 'String (FK -> Question)', isRelation: true },
        { key: 'optionLetter', type: 'String (A|B|C|D)' },
        { key: 'text', type: 'String' },
        { key: 'isCorrect', type: 'Boolean' },
      ],
    },
    QuizAttempt: {
      description: 'Student exam attempts with scores, time spent, and status',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'userId', type: 'String (FK -> User)', isRelation: true },
        { key: 'quizId', type: 'String (FK -> Quiz)', isRelation: true },
        { key: 'score', type: 'Float' },
        { key: 'totalMarks', type: 'Float' },
        { key: 'accuracyPercentage', type: 'Float' },
        { key: 'timeSpentSeconds', type: 'Int' },
        { key: 'passed', type: 'Boolean' },
        { key: 'status', type: 'AttemptStatus' },
      ],
    },
    QuizAnswer: {
      description: 'Student selected options and marking audit trail',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'attemptId', type: 'String (FK -> QuizAttempt)', isRelation: true },
        { key: 'questionId', type: 'String (FK -> Question)', isRelation: true },
        { key: 'selectedOptionId', type: 'String?' },
        { key: 'isCorrect', type: 'Boolean' },
        { key: 'marksAwarded', type: 'Float' },
        { key: 'isMarkedForReview', type: 'Boolean' },
      ],
    },
    Subscription: {
      description: 'Student paid premium plan passes (Annual BCS Master, Monthly Pro)',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'userId', type: 'String (FK -> User)', isRelation: true },
        { key: 'planType', type: 'SubscriptionPlan' },
        { key: 'price', type: 'Float' },
        { key: 'status', type: 'SubscriptionStatus' },
        { key: 'startDate', type: 'DateTime' },
        { key: 'endDate', type: 'DateTime' },
      ],
    },
    Payment: {
      description: 'Financial transactions (bKash, Nagad, Upay, SSLCommerz)',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'transactionId', type: 'String @unique' },
        { key: 'userId', type: 'String (FK -> User)', isRelation: true },
        { key: 'amount', type: 'Float' },
        { key: 'currency', type: 'String' },
        { key: 'provider', type: 'PaymentProvider' },
        { key: 'status', type: 'PaymentStatus' },
      ],
    },
    Leaderboard: {
      description: 'Top competitive rankings per quiz',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'rank', type: 'Int' },
        { key: 'score', type: 'Float' },
        { key: 'accuracy', type: 'Float' },
        { key: 'quizId', type: 'String (FK -> Quiz)', isRelation: true },
        { key: 'userId', type: 'String (FK -> User)', isRelation: true },
      ],
    },
    Bookmark: {
      description: 'Saved quizzes and high-yield questions for revision',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'userId', type: 'String (FK -> User)', isRelation: true },
        { key: 'quizId', type: 'String?' },
        { key: 'questionId', type: 'String?' },
      ],
    },
    Notification: {
      description: 'System alerts, result notices, and payment receipts',
      columns: [
        { key: 'id', type: 'String @id', isId: true },
        { key: 'title', type: 'String' },
        { key: 'message', type: 'String' },
        { key: 'type', type: 'NotificationType' },
        { key: 'userId', type: 'String (FK -> User)', isRelation: true },
        { key: 'isRead', type: 'Boolean' },
      ],
    },
  };

  // Run Seed Action
  const handleRunPrismaSeed = () => {
    setIsSeeding(true);
    setShowTerminal(true);
    setSeedLogs([
      '$ npx prisma db seed',
      '🌱 Starting Prisma Database Seed: ExamPro BCS Platform',
      '📡 Target Database: postgresql://localhost:5432/exampro_quiz',
      '⏳ Connecting to database client...',
    ]);

    setTimeout(() => {
      setSeedLogs((prev) => [
        ...prev,
        '✔ Connected to PostgreSQL datasource [prisma/schema.prisma]',
        `📚 Upserting ${SEED_SUBJECTS.length} Subjects...`,
        `📂 Upserting ${SEED_CATEGORIES.length} Categories...`,
        `📑 Upserting ${SEED_CHAPTERS.length} Chapters...`,
      ]);
    }, 400);

    setTimeout(() => {
      setSeedLogs((prev) => [
        ...prev,
        `📝 Upserting ${SEED_QUIZZES.length} Quizzes & Model Tests...`,
        `❓ Upserting ${SEED_QUESTIONS.length} Questions with 4 Options each...`,
        `👥 Upserting ${SEED_USERS.length} Users (Admin, Instructors, Aspirants)...`,
        `💎 Upserting ${SEED_SUBSCRIPTIONS.length} Subscriptions...`,
        `💳 Upserting ${SEED_PAYMENTS.length} Transactions (bKash, Nagad)...`,
        `📊 Upserting Quiz Attempts & Leaderboard records...`,
      ]);
    }, 900);

    setTimeout(() => {
      // Reload fresh seed data in Studio
      setDbData({
        User: [...SEED_USERS],
        Subject: [...SEED_SUBJECTS],
        Category: [...SEED_CATEGORIES],
        Chapter: [...SEED_CHAPTERS],
        Quiz: [...SEED_QUIZZES],
        Question: [...SEED_QUESTIONS],
        Option: initialOptions,
        QuizAttempt: [...SEED_ATTEMPTS],
        QuizAnswer: initialAnswers,
        Bookmark: [...SEED_BOOKMARKS],
        Subscription: [...SEED_SUBSCRIPTIONS],
        Payment: [...SEED_PAYMENTS],
        Leaderboard: [...SEED_LEADERBOARD],
        Notification: [...SEED_NOTIFICATIONS],
      });

      setSeedLogs((prev) => [
        ...prev,
        '======================================================',
        '🎉 Prisma Seed Completed Successfully in 482ms!',
        '======================================================',
        '✔ All 14 models synchronized with fresh high-yield test data.',
      ]);
      setIsSeeding(false);

      if (onDataReset) {
        onDataReset();
      }
    }, 1500);
  };

  // Filter rows based on search
  const rows = dbData[activeModel] || [];
  const filteredRows = rows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some((val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(query);
      return String(val).toLowerCase().includes(query);
    });
  });

  // Delete row
  const handleDeleteRow = (id: string) => {
    setDbData((prev) => ({
      ...prev,
      [activeModel]: prev[activeModel].filter((item) => item.id !== id),
    }));
  };

  // Add Row
  const handleSaveNewRow = () => {
    const id = newRowData.id || `rec-${Date.now()}`;
    const completeRow = { id, ...newRowData };
    setDbData((prev) => ({
      ...prev,
      [activeModel]: [completeRow, ...prev[activeModel]],
    }));
    setShowAddRowModal(false);
    setNewRowData({});
  };

  // Sample Prisma Query Generator for current model
  const getPrismaQuerySnippet = () => {
    const lower = activeModel.charAt(0).toLowerCase() + activeModel.slice(1);
    switch (activeModel) {
      case 'Quiz':
        return `const quizzes = await prisma.quiz.findMany({
  where: { isPublished: true },
  include: {
    subject: true,
    questions: { include: { options: true } },
    leaderboard: { orderBy: { score: 'desc' }, take: 10 }
  }
});`;
      case 'User':
        return `const user = await prisma.user.findUnique({
  where: { email: 'rakib.edu.bd@gmail.com' },
  include: { subscriptions: true, attempts: true, bookmarks: true }
});`;
      case 'Question':
        return `const questions = await prisma.question.findMany({
  where: { quizId: 'quiz-bcs-model-1' },
  include: { options: true }
});`;
      default:
        return `const data = await prisma.${lower}.findMany({
  take: 20
});`;
    }
  };

  // Copy query
  const handleCopyQuery = () => {
    navigator.clipboard.writeText(getPrismaQuerySnippet());
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  // Copy local instructions
  const localCliSnippet = `# 1. Push schema to database
npx prisma db push

# 2. Run the Prisma seed script
npm run db:seed

# 3. Launch Prisma Studio on port 5555
npm run prisma:studio`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(localCliSnippet);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      {/* Top Prisma Studio Header */}
      <header className="h-14 bg-[#0B132B] border-b border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Prisma Studio Logo */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#162544] border border-cyan-500/30">
            <svg
              className="w-5 h-5 text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 22 22 22" fill="currentColor" fillOpacity="0.2" />
            </svg>
            <span className="font-bold text-white text-sm tracking-wide">Prisma Studio</span>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
              v6.19.3
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="text-slate-500">exampro_quiz</span>
            <span>/</span>
            <span className="text-slate-500">public</span>
            <span>/</span>
            <span className="text-cyan-400 font-semibold">{activeModel}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Seed Button */}
          <button
            onClick={handleRunPrismaSeed}
            disabled={isSeeding}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              isSeeding
                ? 'bg-emerald-800 text-emerald-200 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/50'
            }`}
            title="Execute npx prisma db seed to populate all tables"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding Data...' : 'Run Prisma Seed'}</span>
          </button>

          {/* Toggle Terminal Button */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border font-medium transition-colors ${
              showTerminal
                ? 'bg-slate-800 border-cyan-500 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Terminal</span>
          </button>

          {/* Copy Prisma Query */}
          <button
            onClick={handleCopyQuery}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Copy TypeScript Prisma Query for this model"
          >
            {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedQuery ? 'Copied!' : 'Prisma Query'}</span>
          </button>

          {/* Local CLI Guide Modal Trigger */}
          <button
            onClick={() => setShowCliGuideModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Local Setup</span>
          </button>

          {/* Close Studio View */}
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors"
            >
              Exit Studio
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body: Sidebar + Table View */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Models List */}
        <aside className="w-56 bg-[#0E1726] border-r border-slate-800 flex flex-col shrink-0 select-none">
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Models ({Object.keys(MODEL_DEFINITIONS).length})
            </span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/60 px-1 rounded">
              PostgreSQL
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            {(Object.keys(MODEL_DEFINITIONS) as ModelKey[]).map((modelName) => {
              const count = (dbData[modelName] || []).length;
              const isActive = activeModel === modelName;
              return (
                <button
                  key={modelName}
                  onClick={() => {
                    setActiveModel(modelName);
                    setSelectedRow(null);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Table className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{modelName}</span>
                  </div>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Stats in Sidebar Footer */}
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Total Records:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {Object.values(dbData).reduce((acc, curr) => acc + curr.length, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Datasource:</span>
              <span className="font-mono text-slate-300">schema.prisma</span>
            </div>
          </div>
        </aside>

        {/* Center / Right Content: Data Table & Toolbar */}
        <main className="flex-1 flex flex-col bg-[#0B1120] overflow-hidden">
          {/* Table Toolbar */}
          <div className="h-12 bg-[#0F172A] border-b border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0">
            {/* Model Info & Search */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search in ${activeModel} (${filteredRows.length} records)...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewRowData({});
                  setShowAddRowModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>

              <button
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredRows, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute('download', `${activeModel.toLowerCase()}-data.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors"
                title="Export current model data as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Model Description Banner */}
          <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-semibold">{activeModel}</span>
              <span className="text-slate-600">•</span>
              <span>{MODEL_DEFINITIONS[activeModel]?.description}</span>
            </div>
            <span className="font-mono text-slate-500">
              Showing {filteredRows.length} of {rows.length} records
            </span>
          </div>

          {/* Table Grid View */}
          <div className="flex-1 overflow-auto">
            {filteredRows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <AlertCircle className="w-10 h-10 text-slate-500 mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No records found for {activeModel}</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Click "Run Prisma Seed" above to populate all tables with complete BCS questions, subjects, and mock data.
                </p>
                <button
                  onClick={handleRunPrismaSeed}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Seed {activeModel} Now
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs font-mono select-text">
                <thead className="sticky top-0 bg-[#0E1726] border-b border-slate-800 text-slate-300 z-10 shadow-sm">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center font-medium text-slate-500 border-r border-slate-800">
                      #
                    </th>
                    {MODEL_DEFINITIONS[activeModel]?.columns.map((col) => (
                      <th
                        key={col.key}
                        className="py-2.5 px-3 font-semibold border-r border-slate-800/80 whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={col.isId ? 'text-amber-400' : 'text-slate-200'}>{col.key}</span>
                          <span className="text-[10px] text-slate-500 font-normal">[{col.type}]</span>
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 w-16 text-center text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0B1120]">
                  {filteredRows.map((row, index) => (
                    <tr
                      key={row.id || index}
                      onClick={() => setSelectedRow(row)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        selectedRow?.id === row.id ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-700/50' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-800/60 text-[11px]">
                        {index + 1}
                      </td>
                      {MODEL_DEFINITIONS[activeModel]?.columns.map((col) => {
                        const val = row[col.key];
                        let renderedVal: React.ReactNode = String(val ?? '');

                        if (val === null || val === undefined) {
                          renderedVal = <span className="text-slate-600 italic">null</span>;
                        } else if (typeof val === 'boolean') {
                          renderedVal = (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                val
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {val ? 'TRUE' : 'FALSE'}
                            </span>
                          );
                        } else if (val instanceof Date || (typeof val === 'string' && val.includes('T') && val.endsWith('Z'))) {
                          renderedVal = (
                            <span className="text-slate-400 text-[11px]">
                              {new Date(val).toLocaleString()}
                            </span>
                          );
                        } else if (col.isId) {
                          renderedVal = <span className="text-amber-400 font-mono">{String(val)}</span>;
                        } else if (col.isRelation) {
                          renderedVal = (
                            <span className="text-cyan-400 underline decoration-cyan-800 cursor-pointer">
                              {String(val)}
                            </span>
                          );
                        } else if (typeof val === 'object') {
                          renderedVal = (
                            <span className="text-purple-300 text-[10px] truncate max-w-xs block">
                              {JSON.stringify(val)}
                            </span>
                          );
                        }

                        return (
                          <td
                            key={col.key}
                            className="py-2 px-3 border-r border-slate-800/60 max-w-xs truncate text-slate-300"
                            title={String(val ?? '')}
                          >
                            {renderedVal}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                          title="Delete row from database view"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Terminal Drawer (Toggled by Terminal button or seeding) */}
          {showTerminal && (
            <div className="h-44 bg-[#070D18] border-t border-slate-800 flex flex-col shrink-0 font-mono text-xs">
              <div className="h-8 bg-[#0B132B] px-3 border-b border-slate-800 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-200 font-semibold text-[11px]">Prisma CLI Output Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSeedLogs([])}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 text-slate-300 select-text">
                {seedLogs.length === 0 ? (
                  <div className="text-slate-600 italic">No command output. Click "Run Prisma Seed" to trigger seed.</div>
                ) : (
                  seedLogs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.startsWith('$')
                          ? 'text-cyan-400 font-bold'
                          : log.startsWith('🎉') || log.startsWith('✔')
                          ? 'text-emerald-400'
                          : log.startsWith('⚠️')
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>

        {/* Selected Row Detail Inspector Sidebar (When a row is clicked) */}
        {selectedRow && (
          <aside className="w-80 bg-[#0E1726] border-l border-slate-800 flex flex-col shrink-0 p-4 overflow-y-auto z-10 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Record Inspector</h4>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              {Object.entries(selectedRow).map(([key, val]) => (
                <div key={key} className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    {key}
                  </div>
                  <div className="text-slate-200 break-words text-xs">
                    {val === null || val === undefined ? (
                      <span className="text-slate-600 italic">null</span>
                    ) : typeof val === 'object' ? (
                      <pre className="text-[11px] overflow-x-auto text-purple-300">
                        {JSON.stringify(val, null, 2)}
                      </pre>
                    ) : (
                      String(val)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Local CLI Instructions Modal */}
      {showCliGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowCliGuideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Server className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Running Prisma Studio on your Machine</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              In this Cloud Preview environment, only port 3000 is open through the proxy (which is why Prisma Studio on port 5555 is blocked here, and why this in-app Studio was created for you!).
              <br />
              <br />
              To open the native Prisma Studio desktop app on your own computer with full PostgreSQL connectivity:
            </p>

            <div className="bg-black/60 rounded-lg p-3 border border-slate-800 relative font-mono text-xs text-emerald-400 space-y-1 mb-4">
              <div className="text-slate-500"># 1. Set your PostgreSQL URL in .env</div>
              <div className="text-slate-300">DATABASE_URL="postgresql://user:pass@localhost:5432/exampro"</div>
              <div className="text-slate-500 mt-2"># 2. Push schema & run seed</div>
              <div className="text-cyan-300">npx prisma db push</div>
              <div className="text-cyan-300">npm run db:seed</div>
              <div className="text-slate-500 mt-2"># 3. Launch native Studio (port 5555)</div>
              <div className="text-emerald-300 font-bold">npm run prisma:studio</div>

              <button
                onClick={handleCopyCli}
                className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 border border-slate-700"
              >
                {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCli ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowCliGuideModal(false)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddRowModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-xl max-w-md w-full p-5 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Add Record to {activeModel}
              </h3>
              <button onClick={() => setShowAddRowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              {MODEL_DEFINITIONS[activeModel]?.columns.map((col) => (
                <div key={col.key}>
                  <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                    {col.key} <span className="text-slate-600">({col.type})</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`Enter ${col.key}...`}
                    value={newRowData[col.key] || ''}
                    onChange={(e) =>
                      setNewRowData({
                        ...newRowData,
                        [col.key]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddRowModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewRow}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
              >
                Insert Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
