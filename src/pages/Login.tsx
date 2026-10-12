import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Award, Lock, Mail, ShieldAlert, ArrowRight, UserCheck, Shield, GraduationCap } from 'lucide-react';

interface LoginProps {
  onGoToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGoToRegister }) => {
  const { login } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) {
      setError('Please provide your email/username and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(loginInput.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (emailVal: string, passVal: string) => {
    setLoginInput(emailVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 items-center justify-center text-white shadow-md mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          ProofOfWork
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Practical Skill Verification & Rubric-Based Assessment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 sm:rounded-xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address or Username
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="admin@proofofwork.edu / student"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Test Drive (Pre-configured Seed Roles)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@proofofwork.edu', 'AdminPassword123!')}
                className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-900">Admin</span>
                  <span className="text-purple-600 text-[11px] font-mono">admin@proofofwork.edu</span>
                </div>
                <span className="text-[10px] font-medium text-purple-700 bg-purple-200 px-1.5 py-0.5 rounded">
                  Use Creds
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('evaluator@proofofwork.edu', 'EvalPassword123!')}
                className="w-full text-left px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Evaluator</span>
                  <span className="text-emerald-600 text-[11px] font-mono">evaluator@proofofwork.edu</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded">
                  Use Creds
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('student@proofofwork.edu', 'StudentPassword123!')}
                className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Student</span>
                  <span className="text-blue-600 text-[11px] font-mono">student@proofofwork.edu</span>
                </div>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-200 px-1.5 py-0.5 rounded">
                  Use Creds
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">New student? </span>
            <button
              type="button"
              onClick={onGoToRegister}
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Create a Student Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
