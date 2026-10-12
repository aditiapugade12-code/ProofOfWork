import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  History,
  CheckCircle2,
  Calendar,
  Award,
  RefreshCw,
} from 'lucide-react';

export const EvaluatorHistory: React.FC = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/evaluator/history');
      setEvaluations(data.evaluations);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Evaluation Audit History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete archive of challenge reviews audited by you with scores and timestamps.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading audit history...</div>
        ) : evaluations.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No finalized evaluations yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Evaluations you finalize from your queue will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {evaluations.map((ev) => {
              const evId = ev._id || ev.id;

              return (
                <div key={evId} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          Submission ID: {ev.submissionId}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            ev.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ev.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {ev.evaluatedAt
                            ? new Date(ev.evaluatedAt).toLocaleString()
                            : new Date(ev.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-extrabold text-emerald-700 font-mono">
                        {ev.totalMarks} / {ev.maxPossibleMarks}
                      </div>
                      <div className="text-xs font-semibold text-emerald-800">
                        {ev.percentage}% Awarded
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 border">
                    <span className="font-semibold block mb-0.5">Written Feedback:</span>
                    <p className="italic">"{ev.feedback}"</p>
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
