import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Code2,
  Search,
  Filter,
  Layers,
  ChevronRight,
  BookOpen,
  CheckCircle,
  AlertCircle,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface StudentChallengesProps {
  onStartSubmit: (challenge: any) => void;
}

export const StudentChallenges: React.FC<StudentChallengesProps> = ({ onStartSubmit }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Selected challenge modal for instructions & rubric preview
  const [inspectChallenge, setInspectChallenge] = useState<any | null>(null);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (categoryFilter !== 'All') queryParams.set('category', categoryFilter);
      if (difficultyFilter !== 'All') queryParams.set('difficulty', difficultyFilter);
      if (search.trim()) queryParams.set('search', search.trim());

      const data = await apiRequest(`/api/student/challenges?${queryParams.toString()}`);
      setChallenges(data.challenges);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [categoryFilter, difficultyFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChallenges();
  };

  const isApproved = user?.approvalStatus === 'approved';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Code2 className="w-6 h-6 text-indigo-600" />
          Practical Skill Verification Challenges
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select real-world challenges to demonstrate hands-on proficiency. All submissions are audited against rigorous rubrics.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges by title, keywords, or topics..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-gray-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['All', 'Web Development', 'Data & SQL', 'Backend Systems', 'Algorithms'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-gray-500">Difficulty:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            Loading challenge catalogue...
          </div>
        ) : challenges.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border">
            <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No challenges match your filters</h3>
            <p className="text-xs text-gray-500 mt-1">
              Try clearing filters to see all available practical assessments.
            </p>
          </div>
        ) : (
          challenges.map((ch) => {
            const chId = ch._id || ch.id;

            return (
              <div
                key={chId}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ch.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {ch.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    {ch.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="capitalize font-mono text-[11px] px-1.5 py-0.5 rounded bg-gray-100">
                      {ch.submissionType}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-gray-800">{ch.maxMarks} Max Marks</span>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 line-clamp-3">
                    {ch.description.replace(/[#*`_]/g, '')}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Graded on {ch.rubric?.length || 0} Rubric Criteria
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ch.rubric?.slice(0, 2).map((r: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600"
                        >
                          {r.criterion} ({r.maxMarks}p)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectChallenge(ch)}
                    className="text-xs font-semibold text-gray-600 hover:text-indigo-600"
                  >
                    View Details & Rubric
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isApproved) {
                        alert(
                          'Your profile is currently pending Administrator approval. You will be able to submit solutions as soon as an Admin approves your profile.'
                        );
                        return;
                      }
                      onStartSubmit(ch);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      isApproved
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{isApproved ? 'Start Challenge' : 'Pending Approval'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Challenge Modal */}
      {inspectChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl border border-gray-200 my-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {inspectChallenge.category} • {inspectChallenge.difficulty}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-2">
                  {inspectChallenge.title}
                </h2>
                <div className="text-xs text-gray-500 mt-1">
                  Submission format: <strong className="capitalize">{inspectChallenge.submissionType}</strong> • Maximum: <strong>{inspectChallenge.maxMarks} marks</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectChallenge(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Markdown description view */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Problem Statement & Instructions
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl text-xs text-gray-800 space-y-2 whitespace-pre-wrap font-sans border border-slate-200">
                {inspectChallenge.description}
              </div>
            </div>

            {/* Test Cases / Examples if available */}
            {inspectChallenge.testCasesOrExamples?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Example Scenarios & Test Expectations
                </h4>
                <div className="space-y-2">
                  {inspectChallenge.testCasesOrExamples.map((ex: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-gray-200 rounded-lg text-xs space-y-1"
                    >
                      <span className="font-bold text-gray-900 block">{ex.title}</span>
                      <div className="text-gray-600">
                        <strong>Input:</strong> {ex.input}
                      </div>
                      <div className="text-gray-800">
                        <strong>Expected:</strong> {ex.expectedOutput}
                      </div>
                      {ex.explanation && (
                        <div className="text-gray-500 italic">{ex.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluation Rubric preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Evaluation Rubric Breakdown
              </h4>
              <p className="text-xs text-gray-500">
                A designated faculty evaluator will manually grade your work against these specific criteria:
              </p>
              <div className="space-y-2">
                {inspectChallenge.rubric?.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-indigo-950">{r.criterion}</div>
                      <div className="text-gray-600 mt-0.5">{r.description}</div>
                    </div>
                    <div className="font-bold text-indigo-900 shrink-0 ml-4 font-mono">
                      {r.maxMarks} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInspectChallenge(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectChallenge(null);
                  if (!isApproved) {
                    alert(
                      'Your profile is currently pending Administrator approval. Submissions unlock once approved.'
                    );
                    return;
                  }
                  onStartSubmit(inspectChallenge);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors ${
                  isApproved ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isApproved ? 'Proceed to Solution Submission' : 'Awaiting Admin Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
