import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Trophy,
  Medal,
  Award,
  Search,
  Users,
  GraduationCap,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const StudentLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/student/leaderboard');
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filtered = leaderboard.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q) ||
      item.rollNumber?.toLowerCase().includes(q)
    );
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-extrabold flex items-center justify-center text-xs shadow-xs">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-extrabold flex items-center justify-center text-xs shadow-xs">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Institutional Practical Skills Leaderboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Top candidates ranked by cumulative marks verified across rubric-evaluated engineering challenges.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLeaderboard}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Rankings</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, department, or roll number..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-xs"
        />
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Calculating rankings...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No candidates found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Complete challenge evaluations will populate the leaderboard rankings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 w-16 text-center">Rank</th>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5 text-center">Verified Completed</th>
                  <th className="px-5 py-3.5 text-right">Cumulative Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((item) => {
                  const isCurrentUser =
                    String(item.id) === String(user?._id || user?.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCurrentUser ? 'bg-indigo-50/50 font-medium' : ''
                      }`}
                    >
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">{getRankBadge(item.rank)}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                            alt={item.name}
                            className="w-9 h-9 rounded-full bg-slate-100 border border-gray-200"
                          />
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              Roll: {item.rollNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="text-gray-900 font-medium">{item.department}</div>
                        <div className="text-gray-500">{item.year}</div>
                      </td>

                      <td className="px-5 py-4 text-center text-xs">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-gray-700">
                          {item.completedCount} Challenges
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="text-base font-extrabold text-indigo-600 font-mono">
                          {item.totalMarks} pts
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
