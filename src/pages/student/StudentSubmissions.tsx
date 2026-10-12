import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  ExternalLink,
  Code2,
  Award,
  UserCheck,
  X,
} from 'lucide-react';

export const StudentSubmissions: React.FC = () => {
  const { activeEntityId, setActiveEntityId } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/student/submissions');
      setSubmissions(data.submissions);

      // If activeEntityId is set, open modal for that submission
      if (activeEntityId) {
        const found = data.submissions.find(
          (s: any) => (s._id || s.id) === activeEntityId
        );
        if (found) {
          openDetail(found);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openDetail = async (sub: any) => {
    const sId = sub._id || sub.id;
    try {
      const data = await apiRequest(`/api/student/submissions/${sId}`);
      setSelectedSub(data);
    } catch (err: any) {
      alert('Could not load submission details: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            Submitted
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
            <Clock className="w-3 h-3 text-amber-500" />
            Under Review
          </span>
        );
      case 'evaluated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Evaluated & Verified
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
            My Challenge Submissions & Marks History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track evaluation statuses, inspect rubric marks, and read feedback provided by faculty evaluators.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSubmissions}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No submissions yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Select a challenge from the catalogue and submit your solution.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Challenge</th>
                  <th className="px-5 py-3.5">Submission Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Faculty Evaluator</th>
                  <th className="px-5 py-3.5">Score Awarded</th>
                  <th className="px-5 py-3.5 text-right">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((sub) => {
                  const subId = sub._id || sub.id;

                  return (
                    <tr key={subId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{sub.challengeTitle}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono capitalize">
                        {sub.submissionType}
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(sub.status)}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {sub.assignedEvaluatorName ? (
                          <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{sub.assignedEvaluatorName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Awaiting allocation</span>
                        )}
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
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(sub)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Rubric & Marks</span>
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

      {/* Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl border border-gray-200 my-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Submission Assessment Report
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {selectedSub.challenge?.title}
                </h2>
                <div className="text-xs text-gray-500 mt-0.5">
                  Category: {selectedSub.challenge?.category} • Submitted on{' '}
                  {new Date(selectedSub.submission.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSub(null);
                  setActiveEntityId(null);
                }}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Evaluator Rubric Results Box */}
            {selectedSub.evaluation ? (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Official Faculty Assessment
                    </span>
                    <div className="text-sm font-bold text-emerald-950 mt-0.5">
                      Audited by {selectedSub.evaluation.evaluatorName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-emerald-900">
                      {selectedSub.evaluation.totalMarks} / {selectedSub.evaluation.maxPossibleMarks}
                    </div>
                    <div className="text-xs font-bold text-emerald-700">
                      Score: {selectedSub.evaluation.percentage}%
                    </div>
                  </div>
                </div>

                {/* Rubric Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-800">
                    Criterion Marks Breakdown:
                  </div>
                  {selectedSub.evaluation.rubricScores.map((score: any, idx: number) => (
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
                      <div className="font-bold text-gray-900 text-right shrink-0 ml-4 font-mono">
                        {score.awardedMarks} / {score.maxMarks} pts
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                <div>
                  <div className="text-xs font-bold text-gray-800 mb-1">
                    Faculty Written Feedback:
                  </div>
                  <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-emerald-100">
                    {selectedSub.evaluation.feedback}
                  </p>
                </div>

                {selectedSub.evaluation.improvementSuggestions && (
                  <div>
                    <div className="text-xs font-bold text-gray-800 mb-1">
                      Improvement Recommendations:
                    </div>
                    <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-emerald-100">
                      {selectedSub.evaluation.improvementSuggestions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  This submission has been received and is currently under review by the assigned evaluator. Your marks and rubric breakdown will appear here once finalized.
                </span>
              </div>
            )}

            {/* Candidate Solution Content */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-500" />
                Your Submitted Solution Content
              </h3>

              {selectedSub.submission.content?.code && (
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-60">
                  <pre>{selectedSub.submission.content.code}</pre>
                </div>
              )}

              {selectedSub.submission.content?.sqlQuery && (
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-60">
                  <pre>{selectedSub.submission.content.sqlQuery}</pre>
                </div>
              )}

              {selectedSub.submission.content?.repositoryUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                  <span className="font-semibold text-blue-900 block mb-1">GitHub / Project Repository:</span>
                  <a
                    href={selectedSub.submission.content.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline font-mono flex items-center gap-1"
                  >
                    {selectedSub.submission.content.repositoryUrl}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {selectedSub.submission.content?.writtenAnswer && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs whitespace-pre-wrap">
                  {selectedSub.submission.content.writtenAnswer}
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedSub(null);
                  setActiveEntityId(null);
                }}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
