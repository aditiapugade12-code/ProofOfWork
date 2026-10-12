import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  AlertCircle,
  ExternalLink,
  Code2,
  FileText,
  User,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';

interface EvaluatorReviewProps {
  submissionId: string;
  onBack: () => void;
  onFinished: () => void;
}

export const EvaluatorReview: React.FC<EvaluatorReviewProps> = ({
  submissionId,
  onBack,
  onFinished,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rubric Scores State
  const [rubricScores, setRubricScores] = useState<any[]>([]);
  const [feedback, setFeedback] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [activeTab, setActiveTab] = useState<'solution' | 'instructions'>('solution');

  useEffect(() => {
    const fetchSubmission = async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest(`/api/evaluator/submissions/${submissionId}`);
        setData(res);

        const ch = res.challenge;
        const existingEval = res.evaluation;

        // Initialize rubric scores from challenge criteria or pre-fill existing evaluation
        if (existingEval && existingEval.rubricScores) {
          setRubricScores(existingEval.rubricScores);
          setFeedback(existingEval.feedback || '');
          setImprovementSuggestions(existingEval.improvementSuggestions || '');
        } else if (ch && ch.rubric) {
          const initial = ch.rubric.map((r: any) => ({
            criterionId: r.id,
            criterionName: r.criterion,
            maxMarks: r.maxMarks,
            awardedMarks: Math.floor(r.maxMarks * 0.8), // pre-fill reasonable baseline
            comment: '',
          }));
          setRubricScores(initial);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmission();
  }, [submissionId]);

  const handleScoreChange = (index: number, val: number) => {
    setRubricScores((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], awardedMarks: val };
      return next;
    });
  };

  const handleCommentChange = (index: number, comment: string) => {
    setRubricScores((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], comment };
      return next;
    });
  };

  const currentTotal = rubricScores.reduce(
    (acc, item) => acc + (Number(item.awardedMarks) || 0),
    0
  );
  const maxPossible = rubricScores.reduce(
    (acc, item) => acc + (Number(item.maxMarks) || 0),
    0
  );

  const handleSaveEvaluation = async (isDraft: boolean) => {
    setError(null);

    // Validate boundaries
    for (const item of rubricScores) {
      const score = Number(item.awardedMarks);
      if (isNaN(score) || score < 0) {
        setError(`Marks for "${item.criterionName}" cannot be negative.`);
        return;
      }
      if (score > item.maxMarks) {
        setError(
          `Awarded marks (${score}) for "${item.criterionName}" cannot exceed criterion maximum (${item.maxMarks}).`
        );
        return;
      }
    }

    if (!isDraft && (!feedback || !feedback.trim())) {
      setError('Constructive written feedback is required before finalizing an evaluation.');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest(`/api/evaluator/submissions/${submissionId}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({
          rubricScores,
          feedback,
          improvementSuggestions,
          isDraft,
        }),
      });

      alert(
        isDraft
          ? 'Draft evaluation saved successfully.'
          : 'Evaluation finalized! The student can now see their score and feedback.'
      );
      onFinished();
    } catch (err: any) {
      setError(err.message || 'Evaluation submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-gray-500">
        Loading candidate submission and rubric...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-xl mx-auto space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded-lg text-xs font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { submission, challenge, student, evaluation } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => handleSaveEvaluation(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => handleSaveEvaluation(false)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalize & Publish Evaluation</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Main Studio 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidate Submission & Brief (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Candidate Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={student?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${student?.username}`}
                alt={student?.name}
                className="w-10 h-10 rounded-full bg-slate-100 border border-gray-200"
              />
              <div className="text-xs">
                <div className="font-bold text-gray-900 text-sm">{student?.name}</div>
                <div className="text-gray-500">
                  {student?.department} ({student?.year}) • Roll: {student?.rollNumber || 'N/A'}
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-gray-500">
              <span className="capitalize font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                {submission.submissionType}
              </span>
            </div>
          </div>

          {/* Toggle between Student Solution vs Challenge Brief */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50/70 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('solution')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'solution'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Candidate's Submitted Answer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('instructions')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'instructions'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Challenge Problem & Criteria</span>
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'solution' ? (
                <div className="space-y-4">
                  {submission.content?.code && (
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">
                        Code Implementation:
                      </div>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[480px]">
                        <pre>{submission.content.code}</pre>
                      </div>
                    </div>
                  )}

                  {submission.content?.sqlQuery && (
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">
                        SQL Query Solution:
                      </div>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[480px]">
                        <pre>{submission.content.sqlQuery}</pre>
                      </div>
                    </div>
                  )}

                  {submission.content?.repositoryUrl && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2">
                      <div className="font-bold text-blue-950">Project Repository:</div>
                      <a
                        href={submission.content.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline font-mono flex items-center gap-1.5"
                      >
                        {submission.content.repositoryUrl}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {submission.content.liveUrl && (
                        <div>
                          <span className="font-semibold text-blue-900">Live Demo: </span>
                          <a
                            href={submission.content.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 underline font-mono"
                          >
                            {submission.content.liveUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {submission.content?.writtenAnswer && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs whitespace-pre-wrap">
                      {submission.content.writtenAnswer}
                    </div>
                  )}

                  {submission.content?.notes && (
                    <div className="text-xs text-gray-600 bg-slate-50 p-3 rounded-lg border">
                      <strong>Candidate Execution Notes:</strong> {submission.content.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-base">{challenge?.title}</h3>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-gray-800 space-y-2 whitespace-pre-wrap border border-slate-200">
                    {challenge?.description}
                  </div>
                  {challenge?.testCasesOrExamples?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-700">Reference Examples:</div>
                      {challenge.testCasesOrExamples.map((ex: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white border rounded text-xs space-y-1">
                          <div className="font-bold text-gray-900">{ex.title}</div>
                          <div className="text-gray-600">Input: {ex.input}</div>
                          <div className="text-gray-800 font-mono">Expected: {ex.expectedOutput}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Rubric Scoring Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-5 sticky top-20">
            {/* Rubric Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Rubric Assessment Studio
                </h3>
                <p className="text-xs text-gray-500">Assign marks per criterion</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {currentTotal} / {maxPossible}
                </div>
                <div className="text-[11px] font-semibold text-gray-500">
                  {maxPossible > 0 ? Math.round((currentTotal / maxPossible) * 100) : 0}% Total
                </div>
              </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {rubricScores.map((scoreItem, idx) => (
                <div
                  key={scoreItem.criterionId}
                  className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-xs">
                        {scoreItem.criterionName}
                      </div>
                      <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        Max marks: <strong>{scoreItem.maxMarks}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max={scoreItem.maxMarks}
                        value={scoreItem.awardedMarks}
                        onChange={(e) => handleScoreChange(idx, Number(e.target.value))}
                        className={`w-16 px-2 py-1 text-xs border rounded font-mono font-bold text-center outline-none ${
                          scoreItem.awardedMarks > scoreItem.maxMarks || scoreItem.awardedMarks < 0
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 focus:ring-1 focus:ring-emerald-500 bg-white'
                        }`}
                      />
                      <span className="text-xs text-gray-500 font-mono">/{scoreItem.maxMarks}</span>
                    </div>
                  </div>

                  {/* Criterion specific note */}
                  <input
                    type="text"
                    value={scoreItem.comment || ''}
                    onChange={(e) => handleCommentChange(idx, e.target.value)}
                    placeholder="Specific criterion feedback (optional)..."
                    className="w-full text-xs px-2.5 py-1 bg-white border border-gray-200 rounded text-gray-700 outline-none"
                  />
                </div>
              ))}
            </div>

            {/* General Written Feedback */}
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Comprehensive Written Feedback *
              </label>
              <textarea
                rows={3}
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain the candidate's strengths, accuracy of results, and code quality..."
                className="w-full p-2.5 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Improvement Suggestions */}
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Recommendations for Technical Improvement
              </label>
              <textarea
                rows={2}
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                placeholder="What could the student optimize or study next?"
                className="w-full p-2.5 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleSaveEvaluation(true)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Save Draft
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleSaveEvaluation(false)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Finalize & Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
