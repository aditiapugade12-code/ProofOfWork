import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Users,
  UserCheck,
  Clock,
  FileCheck2,
  FileText,
  AlertCircle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { setCurrentView } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(false);
      const data = await apiRequest('/api/admin/metrics');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
        Loading administrative metrics...
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: metrics?.totalStudents ?? 0,
      icon: Users,
      color: 'blue',
      actionText: 'Manage Students',
      target: 'students',
    },
    {
      title: 'Pending Student Approvals',
      value: metrics?.pendingStudentApprovals ?? 0,
      icon: AlertCircle,
      color: 'amber',
      badge: metrics?.pendingStudentApprovals > 0 ? 'Requires Action' : 'All Clear',
      actionText: 'Review Approvals',
      target: 'students',
    },
    {
      title: 'Active Evaluators',
      value: metrics?.activeEvaluators ?? 0,
      icon: UserCheck,
      color: 'emerald',
      actionText: 'Faculty Directory',
      target: 'evaluators',
    },
    {
      title: 'Total Submissions',
      value: metrics?.totalSubmissions ?? 0,
      icon: FileText,
      color: 'indigo',
      actionText: 'View All',
      target: 'submissions',
    },
    {
      title: 'Unassigned Submissions',
      value: metrics?.unassignedSubmissions ?? 0,
      icon: Clock,
      color: 'rose',
      badge: metrics?.unassignedSubmissions > 0 ? 'Needs Allocations' : 'All Allocated',
      actionText: 'Assign Submissions',
      target: 'submissions',
    },
    {
      title: 'Completed Evaluations',
      value: metrics?.completedEvaluations ?? 0,
      icon: FileCheck2,
      color: 'teal',
      actionText: 'Audit Evaluations',
      target: 'submissions',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Administrator Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Verification Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-2xl">
            Monitor real-time student registrations, faculty allocations, and rubric-driven practical skill evaluations across all engineering departments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentView('students')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span>Approve Students</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('evaluators')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
          >
            Manage Faculty
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-slate-100 text-slate-700`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {card.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        card.badge === 'Requires Action' || card.badge === 'Needs Allocations'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {card.value}
                </div>
                <div className="text-sm font-medium text-gray-600 mt-1">
                  {card.title}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentView(card.target)}
                  className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between group"
                >
                  <span>{card.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Workflow Summary Box */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          Standard 5-Step Verification Lifecycle
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-800 block mb-1">1. Student Registers</span>
            <p className="text-slate-600">
              Student creates account without email verification. Account marked pending approval.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
            <span className="font-bold text-amber-900 block mb-1">2. Admin Approves</span>
            <p className="text-amber-800">
              Admin verifies roll number and department, then approves profile.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
            <span className="font-bold text-blue-900 block mb-1">3. Challenge Submitted</span>
            <p className="text-blue-800">
              Approved student submits Code, SQL, or Project link.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200 text-xs">
            <span className="font-bold text-purple-900 block mb-1">4. Admin Assigns</span>
            <p className="text-purple-800">
              Admin delegates submission to an active Faculty Evaluator.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <span className="font-bold text-emerald-900 block mb-1">5. Rubric Evaluation</span>
            <p className="text-emerald-800">
              Faculty scores rubric criteria, provides feedback, and finalizes score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
