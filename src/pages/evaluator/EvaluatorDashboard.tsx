import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  RefreshCw,
  Award,
  AlertCircle,
  Code2,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';

interface EvaluatorDashboardProps {
  onStartReview: (submissionId: string) => void;
}

export const EvaluatorDashboard: React.FC<EvaluatorDashboardProps> = ({ onStartReview }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);

      const data = await apiRequest(`/api/evaluator/submissions?${queryParams.toString()}`);
      setSubmissions(data.submissions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const pendingCount = submissions.filter((s) => s.status === 'assigned' || s.status === 'submitted').length;
  const inProgressCount = submissions.filter((s) => s.status === 'under_review').length;
  const completedCount = submissions.filter((s) => s.status === 'evaluated').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Faculty Evaluator Workstation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            {user?.department} • Staff ID: {user?.staffId || 'STAFF-1042'}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSubmissions}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{pendingCount}</div>
            <div className="text-xs font-medium text-gray-500">Pending Evaluation Queue</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{inProgressCount}</div>
            <div className="text-xs font-medium text-gray-500">Draft Evaluations in Progress</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">{completedCount}</div>
            <div className="text-xs font-medium text-gray-500">Finalized Assessments</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-600">Filter Queue:</span>
          <div className="flex gap-1.5 ml-2">
            {[
              { id: 'all', label: 'All Submissions' },
              { id: 'pending', label: 'Pending' },
              { id: 'in_progress', label: 'In Progress (Drafts)' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Submissions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading assigned submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No submissions in queue</h3>
            <p className="text-xs text-gray-500 mt-1">
              Submissions assigned to you by the Institution Administrator will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Challenge & Type</th>
                  <th className="px-5 py-3.5">Candidate Details</th>
                  <th className="px-5 py-3.5">Assigned On</th>
                  <th className="px-5 py-3.5">Review Status</th>
                  <th className="px-5 py-3.5">Current Score</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((sub) => {
                  const subId = sub._id || sub.id;
                  const isCompleted = sub.status === 'evaluated';

                  return (
                    <tr key={subId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{sub.challengeTitle}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="capitalize font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 text-[10px]">
                            {sub.submissionType}
                          </span>
                          <span>{sub.challengeCategory}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="font-semibold text-gray-900">{sub.studentName}</div>
                        <div className="text-gray-500">{sub.studentEmail}</div>
                        <div className="text-gray-400 font-mono text-[11px]">Roll: {sub.studentRollNumber || 'N/A'}</div>
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        {sub.assignedAt ? new Date(sub.assignedAt).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            sub.status === 'evaluated'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'under_review'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {sub.status === 'under_review' ? 'Draft Saved' : sub.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {sub.evaluation ? (
                          <div>
                            <span className="font-bold text-gray-900">
                              {sub.evaluation.totalMarks} / {sub.evaluation.maxPossibleMarks}
                            </span>
                            <span className="text-emerald-700 font-semibold ml-1.5">
                              ({sub.evaluation.percentage}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not evaluated</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onStartReview(subId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                        >
                          <span>{isCompleted ? 'View / Re-evaluate' : 'Evaluate Rubric'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
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
