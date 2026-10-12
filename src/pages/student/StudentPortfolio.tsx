import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  FolderGit2,
  Award,
  CheckCircle2,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';

export const StudentPortfolio: React.FC = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await apiRequest('/api/student/portfolio');
        setPortfolio(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading verified candidate portfolio...
      </div>
    );
  }

  const items = portfolio?.portfolioItems || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Portfolio Header Certificate Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
              alt={user?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-indigo-400 bg-slate-800 p-1 shadow-lg"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Institutional Candidate
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.name}
              </h1>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                <span>{user?.college || 'National Institute of Technology'}</span>
                <span>•</span>
                <span>{user?.department}</span>
                <span>•</span>
                <span className="font-mono text-indigo-300">Roll: {user?.rollNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center sm:text-right shrink-0">
            <div className="text-3xl font-extrabold text-emerald-400">
              {portfolio?.totalScore || 0} pts
            </div>
            <div className="text-xs font-medium text-slate-300 mt-0.5">
              Verified Practical Score
            </div>
            <div className="text-[11px] text-indigo-200 mt-1">
              {items.length} Evaluated Assessments
            </div>
          </div>
        </div>

        {/* Skills Tag Cloud */}
        {user?.skills && user.skills.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Verified Core Competencies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-indigo-200 text-xs rounded-md font-medium border border-white/10 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verified Practical Achievements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Verified Challenges Proof of Work ({items.length})
          </h2>
          <span className="text-xs text-gray-500">
            Each credential is backed by faculty rubric evaluations
          </span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">
              No verified evaluations completed yet
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Once faculty evaluators grade and finalize your challenge submissions, your verified credentials and rubric scores will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item: any, idx: number) => {
              const sub = item.submission;
              const ev = item.evaluation;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs hover:border-indigo-300 transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                          {sub.challengeCategory}
                        </span>
                        <span className="text-xs text-gray-400">
                          Verified on {ev?.evaluatedAt ? new Date(ev.evaluatedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mt-1">
                        {sub.challengeTitle}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-emerald-600">
                        {ev?.totalMarks} / {ev?.maxPossibleMarks} pts
                      </div>
                      <div className="text-xs font-semibold text-emerald-800">
                        Grade: {ev?.percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Rubric Breakdown Grid */}
                  {ev?.rubricScores && (
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-gray-700">
                        Audited Rubric Breakdown:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {ev.rubricScores.map((score: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-800 truncate pr-2">
                              {score.criterionName}
                            </span>
                            <span className="font-bold text-emerald-700 shrink-0 font-mono">
                              {score.awardedMarks}/{score.maxMarks}p
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evaluator Feedback Quote */}
                  {ev?.feedback && (
                    <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-xs">
                      <span className="font-semibold text-emerald-950 block mb-0.5">
                        Faculty Endorsement by {ev.evaluatorName}:
                      </span>
                      <p className="text-emerald-900 italic">"{ev.feedback}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
