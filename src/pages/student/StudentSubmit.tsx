import React, { useState } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Code2,
  Database,
  Globe,
  FileText,
  AlertCircle,
  ArrowLeft,
  Send,
  Info,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface StudentSubmitProps {
  challenge: any;
  onBack: () => void;
  onSubmitted: () => void;
}

export const StudentSubmit: React.FC<StudentSubmitProps> = ({
  challenge,
  onBack,
  onSubmitted,
}) => {
  const { user } = useAuth();
  const [submissionType, setSubmissionType] = useState<string>(
    challenge.submissionType || 'code'
  );

  const [code, setCode] = useState(challenge.starterCode || '');
  const [sqlQuery, setSqlQuery] = useState(challenge.starterCode || '');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const content: any = { notes: notes.trim() };
    if (submissionType === 'code') {
      if (!code.trim()) {
        setError('Please provide your code solution.');
        return;
      }
      content.code = code;
    } else if (submissionType === 'sql') {
      if (!sqlQuery.trim()) {
        setError('Please provide your SQL query.');
        return;
      }
      content.sqlQuery = sqlQuery;
    } else if (submissionType === 'project_link') {
      if (!repositoryUrl.trim()) {
        setError('Please provide your repository / GitHub URL.');
        return;
      }
      content.repositoryUrl = repositoryUrl.trim();
      content.liveUrl = liveUrl.trim();
    } else if (submissionType === 'written') {
      if (!writtenAnswer.trim()) {
        setError('Please provide your written answer or system design.');
        return;
      }
      content.writtenAnswer = writtenAnswer;
    }

    setIsLoading(true);
    try {
      const chId = challenge._id || challenge.id;
      await apiRequest(`/api/student/challenges/${chId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          submissionType,
          content,
        }),
      });
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challenge Catalogue</span>
        </button>
      </div>

      {/* Challenge Title Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {challenge.category}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {challenge.difficulty} Difficulty
            </span>
            <span className="text-xs font-bold text-gray-800">
              • {challenge.maxMarks} Max Marks
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
        </div>

        <div className="text-xs text-gray-500 bg-slate-50 p-3 rounded-lg border border-slate-200 max-w-xs">
          <strong>Candidate:</strong> {user?.name} (Roll: {user?.rollNumber || 'N/A'})
        </div>
      </div>

      {/* IMPORTANT Manual Evaluation Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Faculty Evaluation Protocol:</span>
          Code and SQL submissions are manually inspected, validated, and scored by a designated faculty evaluator against the published rubric. Automated black-box scoring is not used, ensuring your engineering reasoning and code architecture are thoroughly reviewed.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              Solution Editor ({submissionType.toUpperCase()})
            </h3>
            <span className="text-xs text-gray-500">
              Type: <strong className="capitalize">{submissionType}</strong>
            </span>
          </div>

          {/* Conditional Editor Input */}
          {submissionType === 'code' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                TypeScript / JavaScript / Python Solution:
              </label>
              <textarea
                rows={14}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Write or paste your verified implementation here..."
                className="w-full font-mono text-xs p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {submissionType === 'sql' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                PostgreSQL / MySQL Query Solution:
              </label>
              <textarea
                rows={12}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="-- Write your SQL query with appropriate CTEs and aggregations..."
                className="w-full font-mono text-xs p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {submissionType === 'project_link' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GitHub / Public Repository URL *
                </label>
                <input
                  type="url"
                  required
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Live Preview / Demo URL (Optional)
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://my-project.vercel.app"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {submissionType === 'written' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Written Technical Answer / System Design:
              </label>
              <textarea
                rows={10}
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                placeholder="Provide detailed breakdown and design considerations..."
                className="w-full p-4 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Notes for Evaluator */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Candidate Notes & Execution Verification Instructions:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tested locally with Node 20. Edge cases handled for empty buckets and boundary timestamps."
              className="w-full p-3 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Challenge Rubric Reference */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Evaluation Rubric Criteria (Checked by Faculty)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {challenge.rubric?.map((r: any, idx: number) => (
              <div key={idx} className="bg-white p-3 rounded-lg border text-xs">
                <div className="font-bold text-gray-900">{r.criterion}</div>
                <div className="text-gray-500 text-[11px] mt-0.5">{r.description}</div>
                <div className="text-indigo-600 font-bold mt-1 text-right">{r.maxMarks} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Solution for Evaluation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
