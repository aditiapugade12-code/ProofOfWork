import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import {
  UserCheck,
  Plus,
  KeyRound,
  ShieldAlert,
  UserX,
  RefreshCw,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const AdminEvaluators: React.FC = () => {
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetModalEval, setResetModalEval] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    staffId: '',
    department: 'Computer Science & Engineering',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvaluators = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/admin/evaluators');
      setEvaluators(data.evaluators);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluators();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('/api/admin/evaluators', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setMessage({ type: 'success', text: 'Faculty Evaluator account created successfully!' });
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        staffId: '',
        department: 'Computer Science & Engineering',
      });
      fetchEvaluators();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (evaluatorId: string, currentStatus: string) => {
    setActionLoading(true);
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      await apiRequest(`/api/admin/evaluators/${evaluatorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage({
        type: 'success',
        text: `Evaluator account ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
      fetchEvaluators();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalEval || !newPassword) return;
    setActionLoading(true);
    try {
      const eId = resetModalEval._id || resetModalEval.id;
      await apiRequest(`/api/admin/evaluators/${eId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      setMessage({
        type: 'success',
        text: `Temporary password set for ${resetModalEval.name}. Evaluator must change it upon next login.`,
      });
      setResetModalEval(null);
      setNewPassword('');
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
            <UserCheck className="w-6 h-6 text-emerald-600" />
            Faculty Evaluator Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Provision verified faculty accounts, monitor evaluation workloads, and manage credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchEvaluators}
            className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Evaluator Account</span>
          </button>
        </div>
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

      {/* Evaluator Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading evaluators...</div>
        ) : evaluators.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No evaluators yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Create an evaluator account above to begin assigning student submissions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Evaluator</th>
                  <th className="px-5 py-3.5">Department & Staff ID</th>
                  <th className="px-5 py-3.5">Assigned Workload</th>
                  <th className="px-5 py-3.5">Completed Audits</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {evaluators.map((ev) => {
                  const evId = ev._id || ev.id;
                  const isActive = ev.status === 'active';

                  return (
                    <tr key={evId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={ev.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${ev.username}`}
                            alt={ev.name}
                            className="w-10 h-10 rounded-full bg-slate-100 border border-gray-200"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{ev.name}</div>
                            <div className="text-xs text-gray-500">{ev.email}</div>
                            <div className="text-[11px] text-gray-400 font-mono">@{ev.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="font-medium text-gray-900">{ev.department}</div>
                        <div className="text-gray-500 font-mono text-[11px]">Staff ID: {ev.staffId || 'N/A'}</div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="inline-flex items-center gap-1.5 font-bold text-gray-800 px-2.5 py-1 bg-slate-100 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{ev.assignedCount || 0} Submissions</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="inline-flex items-center gap-1.5 font-bold text-emerald-800 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{ev.completedCount || 0} Evaluated</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalEval(ev);
                              setNewPassword('');
                            }}
                            className="px-2.5 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-1"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                            <span>Reset Pass</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(evId, ev.status)}
                            className={`p-1.5 rounded transition-colors ${
                              isActive
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      {/* Create Evaluator Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-gray-200 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Create Faculty Evaluator Account
            </h2>
            <p className="text-xs text-gray-500">
              Evaluators can review student submissions assigned to them and score them using custom rubrics.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Alan Turing"
                  className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="aturing"
                    className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Staff / Faculty ID</label>
                  <input
                    type="text"
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    placeholder="STAFF-2041"
                    className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="faculty@university.edu"
                  className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Initial Password / Setup Credential *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Share securely with evaluator"
                  className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Reset Password for {resetModalEval.name}
            </h3>
            <p className="text-xs text-gray-600">
              Enter a temporary password. The evaluator will be asked to update their password after logging in.
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new temporary password"
              className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResetModalEval(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !newPassword}
                onClick={handleResetPassword}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
