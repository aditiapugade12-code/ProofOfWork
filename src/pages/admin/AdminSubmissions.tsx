import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import {
  FileText,
  UserCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Code2,
  Calendar,
  Award,
  RefreshCw,
  User,
} from 'lucide-react';

export const AdminSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [challengeFilter, setChallengeFilter] = useState('all');
  const [evaluatorFilter, setEvaluatorFilter] = useState('all');

  // Modals
  const [assigningSub, setAssigningSub] = useState<any | null>(null);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');
  const [viewingSub, setViewingSub] = useState<any | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (challengeFilter !== 'all') queryParams.set('challengeId', challengeFilter);
      if (evaluatorFilter !== 'all') queryParams.set('evaluatorId', evaluatorFilter);

      const [subData, evData, chData] = await Promise.all([
        apiRequest(`/api/admin/submissions?${queryParams.toString()}`),
        apiRequest('/api/admin/evaluators'),
        apiRequest('/api/admin/challenges'),
      ]);

      setSubmissions(subData.submissions);
      setEvaluators(evData.evaluators);
      setChallenges(chData.challenges);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, challengeFilter, evaluatorFilter]);

  const handleAssign = async () => {
    if (!assigningSub || !selectedEvaluatorId) return;
    setActionLoading(true);
    try {
      const subId = assigningSub._id || assigningSub.id;
      const res = await apiRequest(`/api/admin/submissions/${subId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ evaluatorId: selectedEvaluatorId }),
      });
      setMessage({ type: 'success', text: res.message });
      setAssigningSub(null);
      setSelectedEvaluatorId('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = async (sub: any) => {
    const sId = sub._id || sub.id;
    try {
      const data = await apiRequest(`/api/admin/submissions/${sId}`);
      setViewingSub(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            Submitted (Unassigned)
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <UserCheck className="w-3 h-3 text-purple-500" />
            Assigned to Faculty
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            Under Review (Draft)
          </span>
        );
      case 'evaluated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Evaluated
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Needs Improvement
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Submission Allocation & Audit
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Delegate candidate challenge submissions to active evaluators and inspect finalized scores.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Submissions
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-semibold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-gray-600">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Unassigned (Submitted)</option>
            <option value="assigned">Assigned</option>
            <option value="under_review">Under Review</option>
            <option value="evaluated">Evaluated</option>
            <option value="rejected">Needs Improvement</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-500">Challenge:</span>
          <select
            value={challengeFilter}
            onChange={(e) => setChallengeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs max-w-xs truncate"
          >
            <option value="all">All Challenges</option>
            {challenges.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-500">Evaluator:</span>
          <select
            value={evaluatorFilter}
            onChange={(e) => setEvaluatorFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs"
          >
            <option value="all">All Evaluators</option>
            {evaluators.map((ev) => (
              <option key={ev._id || ev.id} value={ev._id || ev.id}>
                {ev.name} ({ev.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No submissions found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Registered students can submit solutions once approved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Challenge & Type</th>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Assigned Evaluator</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Score / Result</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((sub) => {
                  const subId = sub._id || sub.id;

                  return (
                    <tr key={subId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{sub.challengeTitle}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="capitalize font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px]">
                            {sub.submissionType}
                          </span>
                          <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900">{sub.studentName}</div>
                          <div className="text-gray-500">{sub.studentEmail}</div>
                          <div className="text-gray-400 font-mono text-[11px]">
                            Roll: {sub.studentRollNumber || 'N/A'}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {sub.assignedEvaluatorName ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-medium text-gray-900">{sub.assignedEvaluatorName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(sub.status)}
                      </td>

                      <td className="px-5 py-4">
                        {sub.evaluation ? (
                          <div className="text-xs">
                            <span className="font-bold text-gray-900">
                              {sub.evaluation.totalMarks} / {sub.evaluation.maxPossibleMarks}
                            </span>
                            <span className="text-emerald-700 font-semibold ml-1.5">
                              ({sub.evaluation.percentage}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Pending Evaluation</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetailModal(sub)}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Inspect Submission & Evaluation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAssigningSub(sub);
                              setSelectedEvaluatorId(sub.assignedEvaluatorId || '');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                          >
                            {sub.assignedEvaluatorId ? 'Reassign' : 'Assign'}
                          </button>
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

      {/* Assign Modal */}
      {assigningSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Assign Submission to Faculty Evaluator
            </h3>
            <p className="text-xs text-gray-600">
              Select an active evaluator for: <br />
              <strong className="text-gray-900">{assigningSub.challengeTitle}</strong> by{' '}
              <strong className="text-gray-900">{assigningSub.studentName}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Choose Evaluator
              </label>
              <select
                value={selectedEvaluatorId}
                onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">-- Select an active evaluator --</option>
                {evaluators
                  .filter((ev) => ev.status === 'active')
                  .filter((ev) => (ev._id || ev.id) !== assigningSub.studentId) // Disallow evaluating self
                  .map((ev) => (
                    <option key={ev._id || ev.id} value={ev._id || ev.id}>
                      {ev.name} ({ev.department} - {ev.assignedCount || 0} currently assigned)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAssigningSub(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedEvaluatorId}
                onClick={handleAssign}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {viewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl border border-gray-200 my-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Submission Details & Evaluation Audit
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {viewingSub.challenge?.title}
                </h2>
                <div className="text-xs text-gray-500 mt-0.5">
                  Candidate: <strong>{viewingSub.submission.studentName}</strong> ({viewingSub.submission.studentEmail}) • Roll: {viewingSub.submission.studentRollNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingSub(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Submitted Content Box */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-500" />
                Submitted Solution Content
              </h3>

              {viewingSub.submission.content.code && (
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-60">
                  <pre>{viewingSub.submission.content.code}</pre>
                </div>
              )}

              {viewingSub.submission.content.sqlQuery && (
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-60">
                  <pre>{viewingSub.submission.content.sqlQuery}</pre>
                </div>
              )}

              {viewingSub.submission.content.repositoryUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                  <span className="font-semibold text-blue-900 block mb-1">GitHub / Project Repository:</span>
                  <a
                    href={viewingSub.submission.content.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline font-mono flex items-center gap-1"
                  >
                    {viewingSub.submission.content.repositoryUrl}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {viewingSub.submission.content.writtenAnswer && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs whitespace-pre-wrap">
                  {viewingSub.submission.content.writtenAnswer}
                </div>
              )}

              {viewingSub.submission.content.notes && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border">
                  <strong>Candidate Notes:</strong> {viewingSub.submission.content.notes}
                </div>
              )}
            </div>

            {/* Evaluation and Rubric Results */}
            {viewingSub.evaluation ? (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Faculty Rubric Assessment
                    </span>
                    <div className="text-sm font-semibold text-emerald-950 mt-0.5">
                      Audited by {viewingSub.evaluation.evaluatorName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-emerald-900">
                      {viewingSub.evaluation.totalMarks} / {viewingSub.evaluation.maxPossibleMarks}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700">
                      Score: {viewingSub.evaluation.percentage}%
                    </div>
                  </div>
                </div>

                {/* Rubric Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Rubric Criteria Breakdown:</div>
                  {viewingSub.evaluation.rubricScores.map((score: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-emerald-100 flex items-start justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{score.criterionName}</div>
                        {score.comment && (
                          <div className="text-gray-500 italic mt-0.5">"{score.comment}"</div>
                        )}
                      </div>
                      <div className="font-bold text-gray-900 text-right shrink-0 ml-4">
                        {score.awardedMarks} / {score.maxMarks} pts
                      </div>
                    </div>
                  ))}
                </div>

                {/* Written Feedback */}
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">Evaluator Feedback:</div>
                  <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-emerald-100">
                    {viewingSub.evaluation.feedback}
                  </p>
                </div>

                {viewingSub.evaluation.improvementSuggestions && (
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      Improvement Recommendations:
                    </div>
                    <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-emerald-100">
                      {viewingSub.evaluation.improvementSuggestions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  This submission has not yet been finalized by the assigned evaluator.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
