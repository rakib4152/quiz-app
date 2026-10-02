import React, { useState } from 'react';
import {
  Sparkles,
  Smartphone,
  Layout,
  Layers,
  Palette,
  ExternalLink,
  Search,
  CheckCircle2,
  Copy,
  Sliders,
  Check,
  Code2,
} from 'lucide-react';
import { mobbinApiClient, MobbinScreen } from '../services/mobbin/mobbinApiClient';

interface MobbinDesignViewProps {
  onClose: () => void;
  onSelectPattern?: (screen: MobbinScreen) => void;
}

export const MobbinDesignView: React.FC<MobbinDesignViewProps> = ({ onClose, onSelectPattern }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeScreen, setActiveScreen] = useState<MobbinScreen>(mobbinApiClient.getAllScreens()[0]);
  const [activeTab, setActiveTab] = useState<'patterns' | 'tokens' | 'api'>('patterns');
  const [copiedCode, setCopiedCode] = useState(false);

  const screens = mobbinApiClient.searchPatterns(searchQuery, selectedCategory);
  const categories = mobbinApiClient.getCategories();

  const handleCopyTokens = () => {
    navigator.clipboard.writeText(JSON.stringify(activeScreen.designTokens, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/20">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide">
                Mobbin UI/UX Design System & Pattern Library
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                MOBBIN API V1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Curated UI reference flows from Duolingo, Brilliant, Quizlet & Khan Academy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-lg bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'patterns' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Design Patterns
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'tokens' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Design Tokens
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'api' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              API Spec
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            Exit Library
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: DESIGN PATTERNS */}
        {/* ============================================================== */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Mobbin patterns (e.g. Assessment, Paywall, Leaderboard)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Cards & Detail Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Screen Cards */}
              <div className="lg:col-span-7 space-y-4">
                {screens.map((screen) => {
                  const isSelected = activeScreen.id === screen.id;
                  return (
                    <div
                      key={screen.id}
                      onClick={() => setActiveScreen(screen)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row gap-4 ${
                        isSelected
                          ? 'bg-slate-900/90 border-rose-500 shadow-lg shadow-rose-950/20'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={screen.thumbnailUrl}
                        alt={screen.title}
                        className="w-full sm:w-44 h-32 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div className="flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="font-semibold text-rose-400">{screen.app}</span>
                            <span className="font-mono">{screen.platform}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white">{screen.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {screen.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                          <span>Pattern: {screen.pattern}</span>
                          <span className="text-rose-400 font-semibold">Inspect Tokens →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Detail Inspector Panel */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24 h-fit space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="text-rose-400 font-bold uppercase tracking-wider">
                      {activeScreen.app} • {activeScreen.platform}
                    </span>
                    <span className="font-mono text-slate-500">{activeScreen.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{activeScreen.title}</h2>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {activeScreen.description}
                  </p>
                </div>

                {/* Key Features List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    UX Design Highlights
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activeScreen.keyFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Design Tokens Box */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Design System Tokens
                    </h4>
                    <button
                      onClick={handleCopyTokens}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 leading-relaxed overflow-x-auto">
                    {JSON.stringify(activeScreen.designTokens, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DESIGN TOKENS MATRIX */}
        {/* ============================================================== */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-rose-400" />
                  Mobbin-Grade EdTech Design System Guidelines
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces zero-pill metadata discipline, 60-30-10 color math, and rapid 200ms settling curves
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-rose-400 uppercase">1. Zero-Pill Typography</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No pill enclosures around static metadata (subject, questions, duration). Render clean, unboxed text separated by subtle middots (<code className="text-rose-300 font-mono">·</code>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase">2. 60-30-10 Color Budget</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    60% neutral canvas, 30% structural cards and hairline dividers, 10% high-intent accent for primary CTAs and active states.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-cyan-400 uppercase">3. Optical & Spatial Math</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Card padding is 16px–24px. Inner gap never exceeds outer padding. Button horizontal padding is ~2x vertical padding (<code className="text-cyan-300 font-mono">py-2 px-4</code>).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: API SPECIFICATION */}
        {/* ============================================================== */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    Mobbin REST API & MCP Server Specification
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct endpoints for querying screen flows, design tokens, and UI patterns
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  STATUS: LIVE
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                    <span className="text-white">/api/v1/mobbin/screens</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 font-sans">
                    Fetch curated screen library filtered by category, platform (iOS, Android, Web), and pattern.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                    <span className="text-white">/api/v1/mobbin/patterns/quiz-assessment</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 font-sans">
                    Retrieve high-stakes MCQ quiz patterns with timer bars, option card focus states, and review drawers.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">GET</span>
                    <span className="text-white">/api/v1/mobbin/design-tokens</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 font-sans">
                    Extract design system tokens: color palettes, typography scales, border radius, and spacing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
