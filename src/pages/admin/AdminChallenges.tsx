import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Code2,
  Database,
  Globe,
  Terminal,
  CheckCircle,
  Archive,
  Eye,
  RefreshCw,
  PlusCircle,
  X,
} from 'lucide-react';

export const AdminChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    title: '',
    category: 'Web Development',
    difficulty: 'Intermediate',
    submissionType: 'code',
    description: '',
    starterCode: '',
    maxMarks: 100,
    deadline: '',
    status: 'published',
    rubric: [
      { id: 'crit_1', criterion: 'Functionality & Correctness', maxMarks: 50, description: 'Meets primary prompt requirements.' },
      { id: 'crit_2', criterion: 'Architecture & Code Quality', maxMarks: 30, description: 'Clean abstraction and structure.' },
      { id: 'crit_3', criterion: 'Edge Cases & Resiliency', maxMarks: 20, description: 'Handles boundaries cleanly.' },
    ],
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/admin/challenges');
      setChallenges(data.challenges);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const openCreateModal = () => {
    setEditingChallenge(null);
    setFormData({
      title: '',
      category: 'Web Development',
      difficulty: 'Intermediate',
      submissionType: 'code',
      description: '### Problem Description\n\nExplain task clearly...\n\n### Requirements:\n1. First requirement\n2. Second requirement',
      starterCode: '',
      maxMarks: 100,
      deadline: '',
      status: 'published',
      rubric: [
        { id: 'crit_1', criterion: 'Implementation Correctness', maxMarks: 50, description: 'Core functional logic.' },
        { id: 'crit_2', criterion: 'Code Quality & Clean Architecture', maxMarks: 30, description: 'Maintainable, typed code.' },
        { id: 'crit_3', criterion: 'Error Boundaries & Robustness', maxMarks: 20, description: 'Edge case handling.' },
      ],
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (ch: any) => {
    setEditingChallenge(ch);
    setFormData({
      title: ch.title,
      category: ch.category,
      difficulty: ch.difficulty,
      submissionType: ch.submissionType,
      description: ch.description,
      starterCode: ch.starterCode || '',
      maxMarks: ch.maxMarks || 100,
      deadline: ch.deadline || '',
      status: ch.status,
      rubric: ch.rubric || [],
    });
    setIsEditorOpen(true);
  };

  const handleAddRubricItem = () => {
    setFormData((prev: any) => ({
      ...prev,
      rubric: [
        ...prev.rubric,
        {
          id: `crit_${Date.now()}`,
          criterion: 'New Rubric Criterion',
          maxMarks: 10,
          description: 'Description of expected proficiency.',
        },
      ],
    }));
  };

  const handleRemoveRubricItem = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      rubric: prev.rubric.filter((_: any, idx: number) => idx !== index),
    }));
  };

  const handleRubricChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const nextRubric = [...prev.rubric];
      nextRubric[index] = { ...nextRubric[index], [field]: value };
      return { ...prev, rubric: nextRubric };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Title and description are required.' });
      return;
    }

    if (!formData.rubric || formData.rubric.length === 0) {
      setMessage({ type: 'error', text: 'At least one rubric criterion is required.' });
      return;
    }

    // Auto-calculate sum of rubric max marks
    const totalRubricMarks = formData.rubric.reduce(
      (sum: number, r: any) => sum + (Number(r.maxMarks) || 0),
      0
    );

    const payload = {
      ...formData,
      maxMarks: totalRubricMarks > 0 ? totalRubricMarks : Number(formData.maxMarks),
    };

    setActionLoading(true);
    try {
      if (editingChallenge) {
        const chId = editingChallenge._id || editingChallenge.id;
        await apiRequest(`/api/admin/challenges/${chId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: 'Challenge updated successfully!' });
      } else {
        await apiRequest('/api/admin/challenges', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: 'Challenge created and published successfully!' });
      }
      setIsEditorOpen(false);
      fetchChallenges();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (chId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/challenges/${chId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage({ type: 'success', text: `Challenge status set to ${newStatus}.` });
      fetchChallenges();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Challenge Catalogue & Rubric Engineering
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Author practical skill assessments, configure starter code, and define granular evaluation rubrics.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Challenge</span>
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

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            Loading challenges catalogue...
          </div>
        ) : challenges.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No challenges authored yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click above to draft your first practical skill verification challenge.
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ch.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ch.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ch.status === 'draft'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ch.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    {ch.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="capitalize font-medium">{ch.difficulty}</span>
                    <span>•</span>
                    <span className="capitalize font-mono text-[11px]">{ch.submissionType}</span>
                    <span>•</span>
                    <span className="font-bold text-gray-700">{ch.maxMarks} Max Marks</span>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 line-clamp-3">
                    {ch.description.replace(/[#*`_]/g, '')}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Rubric Criteria ({ch.rubric?.length || 0})
                    </div>
                    <div className="space-y-1">
                      {ch.rubric?.slice(0, 3).map((r: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-gray-700"
                        >
                          <span className="truncate pr-2">{r.criterion}</span>
                          <span className="font-mono text-gray-500 shrink-0 font-medium">
                            {r.maxMarks} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          chId,
                          ch.status === 'published' ? 'draft' : 'published'
                        )
                      }
                      className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      {ch.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    {ch.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(chId, 'archived')}
                        className="text-xs px-2 py-1 rounded text-gray-400 hover:text-gray-700"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(ch)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Challenge</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Challenge Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl border border-gray-200 my-8 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">
                {editingChallenge ? 'Edit Challenge & Rubric' : 'Create New Challenge'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Consensus Engine or Postgres Index Optimizer"
                  className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Data & SQL">Data & SQL</option>
                    <option value="Backend Systems">Backend Systems</option>
                    <option value="Algorithms">Algorithms</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Submission Type</label>
                  <select
                    value={formData.submissionType}
                    onChange={(e) => setFormData({ ...formData, submissionType: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="code">Code Editor</option>
                    <option value="sql">SQL Query</option>
                    <option value="project_link">Project / GitHub URL</option>
                    <option value="written">Written / System Design</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Detailed Instructions & Problem Statement *
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide background, step-by-step requirements, input/output specifications..."
                  className="mt-1 block w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Boilerplate / Starter Code (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.starterCode}
                  onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                  placeholder="// Starting boilerplate for student..."
                  className="mt-1 block w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                />
              </div>

              {/* Rubric Builder Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Evaluation Rubric Criteria
                    </h3>
                    <p className="text-xs text-gray-500">
                      Evaluators will assign marks directly to each criterion below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRubricItem}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Criterion</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.rubric.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          required
                          value={item.criterion}
                          onChange={(e) => handleRubricChange(idx, 'criterion', e.target.value)}
                          placeholder="Criterion Name (e.g. Code Architecture)"
                          className="font-medium text-xs px-2.5 py-1.5 border rounded w-full outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="text-[11px] text-gray-500">Max Marks:</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            required
                            value={item.maxMarks}
                            onChange={(e) =>
                              handleRubricChange(idx, 'maxMarks', Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 text-xs border rounded font-mono font-bold"
                          />
                        </div>
                        {formData.rubric.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRubricItem(idx)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleRubricChange(idx, 'description', e.target.value)}
                        placeholder="Guideline for faculty evaluator on what qualifies for full marks..."
                        className="text-xs text-gray-600 px-2.5 py-1 border rounded w-full outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="text-right text-xs font-bold text-gray-800 pt-1">
                  Total Challenge Marks:{' '}
                  {formData.rubric.reduce((s: number, r: any) => s + (Number(r.maxMarks) || 0), 0)}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {editingChallenge ? 'Save Changes' : 'Create & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
