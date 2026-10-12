import React, { useState } from 'react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const EvaluatorAccount: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setMessage({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Password update failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-emerald-600" />
          Faculty Credentials & Security Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your access credentials. Evaluators assigned temporary credentials should update their password after first login.
        </p>
      </div>

      {user?.mustChangePassword && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>First-Time Setup Notice:</strong> You are currently using a temporary administrator-assigned setup password. Please set a secure permanent password below.
          </span>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700">
            Current Password
          </label>
          <div className="mt-1 relative rounded-md">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">
            New Password (at least 6 characters)
          </label>
          <div className="mt-1 relative rounded-md">
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">
            Confirm New Password
          </label>
          <div className="mt-1 relative rounded-md">
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
