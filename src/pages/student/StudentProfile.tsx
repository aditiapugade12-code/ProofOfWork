import React, { useState } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  UserSquare2,
  Building,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    college: user?.college || 'National Institute of Technology',
    department: user?.department || 'Computer Science & Engineering',
    branch: user?.branch || 'B.Tech CSE',
    year: user?.year || '3rd Year',
    rollNumber: user?.rollNumber || '',
    skills: user?.skills?.join(', ') || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await apiRequest('/api/student/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Academic profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <UserSquare2 className="w-6 h-6 text-indigo-600" />
          Academic Profile & Verification Credentials
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Keep your institutional affiliation, degree branch, and roll number up to date for official evaluator audits.
        </p>
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

      {/* Verification status reminder */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administrator Verification Status
            </div>
            <div className="text-sm font-bold capitalize text-gray-900">
              {user?.approvalStatus === 'approved' && '✅ Approved by Administrator'}
              {user?.approvalStatus === 'pending' && '⏳ Pending Administrator Approval'}
              {user?.approvalStatus === 'rejected' && '❌ Revision Required by Administrator'}
            </div>
          </div>
        </div>
        {user?.rejectionReason && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg max-w-xs">
            Reason: {user.rejectionReason}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Roll / Registration Number *</label>
            <input
              type="text"
              required
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">College / Institution</label>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Branch / Major</label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Year of Study</label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">
            Skills (comma-separated tags)
          </label>
          <input
            type="text"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="TypeScript, React, Python, PostgreSQL, Redis"
            className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">
            Candidate Bio & Technical Focus
          </label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell evaluators about your engineering focus..."
            className="mt-1 block w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="pt-3 flex justify-end border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving Changes...' : 'Save Profile Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
