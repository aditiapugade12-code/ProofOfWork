import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Code2,
  Trophy,
  ArrowRight,
  ExternalLink,
  BookOpen,
  FolderGit2,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, setCurrentView, setActiveEntityId } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, portData] = await Promise.all([
          apiRequest('/api/student/submissions'),
          apiRequest('/api/student/portfolio'),
        ]);
        setSubmissions(subData.submissions);
        setPortfolio(portData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const isPending = user?.approvalStatus === 'pending';
  const isRejected = user?.approvalStatus === 'rejected';
  const isApproved = user?.approvalStatus === 'approved';

  const completedCount = submissions.filter((s) => s.status === 'evaluated').length;
  const inProgressCount = submissions.filter((s) => s.status !== 'evaluated').length;
  const totalScore = portfolio?.totalScore || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Approval Status Announcement Banner */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900">
              Profile Verification in Progress
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Your student profile has been submitted and is currently pending review by the Administrator. You can explore the challenge catalogue and inspect rubrics, but submissions will unlock once your academic credentials are approved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('profile')}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-200/80 hover:bg-amber-200 text-amber-900 rounded-lg shrink-0 transition-colors"
          >
            Review Profile
          </button>
        </div>
      )}

      {isRejected && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900">
              Profile Revision Requested by Administrator
            </h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Reason: <strong>{user?.rejectionReason || 'Details need correction.'}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('profile')}
            className="text-xs font-semibold px-3 py-1.5 bg-rose-600 text-white rounded-lg shrink-0 hover:bg-rose-700 transition-colors"
          >
            Update Profile Details
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Candidate Skill Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            {user?.department} • {user?.college}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-300">
            <span>Roll Number: <strong>{user?.rollNumber || 'N/A'}</strong></span>
            <span>•</span>
            <span className="capitalize font-semibold text-emerald-400">
              Status: {user?.approvalStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentView('challenges')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span>Browse Challenges</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('portfolio')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>My Verified Portfolio</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{completedCount}</div>
            <div className="text-xs font-medium text-gray-500">Evaluated Challenges</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{totalScore} pts</div>
            <div className="text-xs font-medium text-gray-500">Earned Verification Marks</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{inProgressCount}</div>
            <div className="text-xs font-medium text-gray-500">Active Submissions</div>
          </div>
        </div>
      </div>

      {/* Submissions in progress / Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Recent Challenge Submissions
          </h2>
          <button
            type="button"
            onClick={() => setCurrentView('submissions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All Submissions →
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs text-gray-500">Loading your submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg">
            <Code2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">No submissions yet.</p>
            <p className="text-xs text-gray-500 mt-1">
              Select a challenge from the catalogue to submit code, SQL, or project solutions.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('challenges')}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold"
            >
              Browse Catalogue
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.slice(0, 4).map((sub) => {
              const subId = sub._id || sub.id;
              return (
                <div key={subId} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-900 block">
                      {sub.challengeTitle}
                    </span>
                    <span className="text-gray-500">
                      Submitted on {new Date(sub.submittedAt).toLocaleDateString()} • Type: {sub.submissionType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        sub.status === 'evaluated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'under_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveEntityId(subId);
                        setCurrentView('submissions');
                      }}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
