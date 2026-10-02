import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  CreditCard,
  LayoutDashboard,
  ShieldAlert,
  Moon,
  Sun,
  Bookmark,
  Search,
  Bell,
  CheckCircle,
  Zap,
  ChevronDown,
  Database,
  Cpu,
  Layout,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  bookmarkCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onSwitchUser,
  bookmarkCount,
  darkMode,
  onToggleDarkMode,
  onSearch,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const demoUsers: User[] = [
    {
      id: 'usr-student-free',
      name: 'Rakibul Islam (Student - Free)',
      email: 'rakibul@student.edu.bd',
      role: 'STUDENT',
      isPremium: false,
      subscriptionPlan: 'FREE',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'usr-student-pro',
      name: 'Dr. Nusrat Jahan (PRO Member)',
      email: 'nusrat@bcs-prep.com',
      role: 'STUDENT',
      isPremium: true,
      subscriptionPlan: 'SIX_MONTH_PASS',
      subscriptionExpiresAt: '2026-09-15',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      createdAt: '2026-01-05T08:00:00Z',
    },
    {
      id: 'usr-admin-1',
      name: 'Prof. Anisuzzaman (Admin & Head Examiner)',
      email: 'admin@exampro.edu.bd',
      role: 'ADMIN',
      isPremium: true,
      subscriptionPlan: 'ANNUAL_BCS_MASTER',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      createdAt: '2025-11-01T12:00:00Z',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    if (currentView !== 'quizzes') {
      onNavigate('quizzes');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                    Exam<span className="text-emerald-600 dark:text-emerald-400">Pro</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    BCS & GOVT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Competitive Exam MCQ Engine
                </p>
              </div>
            </button>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-home-btn"
                onClick={() => onNavigate('home')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentView === 'home'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Home
              </button>
              <button
                id="nav-quizzes-btn"
                onClick={() => onNavigate('quizzes')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentView === 'quizzes'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Model Tests
              </button>
              <button
                id="nav-leaderboard-btn"
                onClick={() => onNavigate('leaderboard')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  currentView === 'leaderboard'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4 text-amber-500" />
                Leaderboard
              </button>
              <button
                id="nav-pricing-btn"
                onClick={() => onNavigate('pricing')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  currentView === 'pricing'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-600" />
                Pro Pass
              </button>
              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-500" />
                My Learning
              </button>

              {currentUser.role === 'ADMIN' && (
                <button
                  id="nav-admin-btn"
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors border ${
                    currentView === 'admin'
                      ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900 hover:bg-purple-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Admin Hub
                </button>
              )}

              {/* Mobbin UI/UX Design System */}
              <button
                id="nav-mobbin-btn"
                onClick={() => onNavigate('mobbin')}
                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors border ${
                  currentView === 'mobbin'
                    ? 'bg-rose-900 text-rose-200 border-rose-400 shadow-sm shadow-rose-900/40'
                    : 'bg-slate-900 text-rose-300 border-rose-900 hover:bg-rose-950 hover:border-rose-600'
                }`}
                title="Inspect Mobbin UI flows, design patterns, and tokens"
              >
                <Layout className="w-4 h-4 text-rose-400" />
                <span>Mobbin Design</span>
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              </button>

              {/* Architecture & Enterprise Console */}
              <button
                id="nav-architecture-btn"
                onClick={() => onNavigate('architecture')}
                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors border ${
                  currentView === 'architecture'
                    ? 'bg-indigo-900 text-indigo-200 border-indigo-400 shadow-sm shadow-indigo-900/40'
                    : 'bg-slate-900 text-indigo-300 border-indigo-900 hover:bg-indigo-950 hover:border-indigo-600'
                }`}
                title="Auth0, Kafka, CDC, Flink, Elasticsearch, Payment Microservice Console"
              >
                <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Architecture Hub</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              </button>

              {/* Prisma Studio Live Database Explorer */}
              <button
                id="nav-prisma-studio-btn"
                onClick={() => onNavigate('prisma_studio')}
                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors border ${
                  currentView === 'prisma_studio'
                    ? 'bg-cyan-900 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-900/40'
                    : 'bg-[#0E1B2E] text-cyan-300 border-cyan-800 hover:bg-cyan-950 hover:border-cyan-600'
                }`}
                title="Inspect database tables and run Prisma Seed"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Prisma Studio</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            </nav>
          </div>

          {/* Right controls: Search, Bookmarks, DarkMode, Role switcher, User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex relative items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search BCS, Bank, English..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-60 pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </form>

            {/* Bookmarks */}
            <button
              id="bookmarks-btn"
              onClick={() => onNavigate('dashboard')}
              title="Saved Questions & Quizzes"
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Notifications toggle */}
            <div className="relative">
              <button
                id="notifications-toggle-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alerts & Notices</span>
                    <span className="text-[10px] font-semibold text-emerald-600">2 New</span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-xs">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                        47th BCS Prelims Live Mock Test Announced!
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Test starts tomorrow at 8:00 PM. Full 200 marks preliminary syllabus.
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Question Bank Updated
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Added 150 new questions on Bangladesh Constitution & Economy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Role / Account Switcher */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                />
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[110px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    {currentUser.isPremium && (
                      <span className="text-[9px] font-black bg-amber-500 text-white px-1 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Switch Active Persona
                    </p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Test Student vs Pro vs Admin
                    </p>
                  </div>
                  <div className="space-y-1">
                    {demoUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currentUser.id === u.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{u.name.split(' (')[0]}</span>
                            {u.isPremium && (
                              <span className="text-[9px] bg-amber-500 text-white px-1 rounded font-bold">
                                PRO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">{u.role}</span>
                        </div>
                        {currentUser.id === u.id && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onNavigate('admin');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-md font-semibold flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Open Admin Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onNavigate('mobbin');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md font-semibold flex items-center gap-1.5"
                    >
                      <Layout className="w-3.5 h-3.5 text-rose-500" />
                      Open Mobbin Design System
                    </button>
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onNavigate('architecture');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md font-semibold flex items-center gap-1.5"
                    >
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                      Open Architecture & Streaming Hub
                    </button>
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onNavigate('prisma_studio');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-md font-semibold flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5 text-cyan-500" />
                      Open Prisma Studio & Database
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
