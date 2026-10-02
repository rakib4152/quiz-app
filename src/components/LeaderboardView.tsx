import React, { useState } from 'react';
import { Trophy, Search, Filter } from 'lucide-react';
import { LeaderboardEntry, Quiz } from '../types';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  quizzes: Quiz[];
  currentUserId: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  quizzes,
  currentUserId,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter((entry) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!entry.userName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const top1 = filteredEntries[0];
  const top2 = filteredEntries[1];
  const top3 = filteredEntries[2];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Merit Leaderboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time competitive merit standing based on net scores, accuracy %, and completion speed
          </p>
        </div>
      </div>

      {/* Top 3 Podium Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {/* 2nd Place */}
        {top2 && (
          <div className="order-2 sm:order-1 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center text-center relative shadow-sm">
            <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-300 text-slate-800 text-[10px] font-black uppercase tracking-wider">
              2nd Place
            </div>
            <img
              src={top2.userAvatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop'}
              alt={top2.userName}
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 mb-2 mt-2"
            />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{top2.userName}</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{top2.quizTitle}</p>
            <div className="mt-3 flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="text-xl font-black">{top2.score}</span>
              <span className="text-xs font-semibold text-slate-400">/ {top2.totalMarks}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{top2.accuracy}% Acc • {top2.timeSpentSeconds}s</p>
          </div>
        )}

        {/* 1st Place Champion */}
        {top1 && (
          <div className="order-1 sm:order-2 p-6 rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/10 via-white to-white dark:via-slate-900 dark:to-slate-900 flex flex-col items-center text-center relative shadow-md scale-105 z-10">
            <div className="absolute -top-3 px-3.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Trophy className="w-3.5 h-3.5" /> 1st Rank
            </div>
            <img
              src={top1.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
              alt={top1.userName}
              className="w-16 h-16 rounded-full object-cover border-4 border-amber-400 mb-2 mt-2"
            />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1">{top1.userName}</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{top1.quizTitle}</p>
            <div className="mt-3 flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl font-black">{top1.score}</span>
              <span className="text-xs font-semibold text-slate-400">/ {top1.totalMarks}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{top1.accuracy}% Accuracy • {top1.timeSpentSeconds}s</p>
          </div>
        )}

        {/* 3rd Place */}
        {top3 && (
          <div className="order-3 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center text-center relative shadow-sm">
            <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider">
              3rd Place
            </div>
            <img
              src={top3.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}
              alt={top3.userName}
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-700 mb-2 mt-2"
            />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{top3.userName}</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{top3.quizTitle}</p>
            <div className="mt-3 flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="text-xl font-black">{top3.score}</span>
              <span className="text-xs font-semibold text-slate-400">/ {top3.totalMarks}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{top3.accuracy}% Acc • {top3.timeSpentSeconds}s</p>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Exam Set</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Accuracy</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.map((entry) => {
                const isUser = entry.userId === currentUserId;
                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isUser ? 'bg-emerald-50/50 dark:bg-emerald-950/30 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-amber-950'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={entry.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                          alt={entry.userName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            {entry.userName}
                            {isUser && (
                              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(entry.recordedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {entry.quizTitle}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {entry.score.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/{entry.totalMarks}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {entry.accuracy}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {entry.timeSpentSeconds}s
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
