import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Award, LogOut, ShieldCheck, UserCheck, GraduationCap, ChevronRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();

  const handleQuickSwitch = async (roleType: 'admin' | 'evaluator' | 'student') => {
    try {
      if (roleType === 'admin') {
        await login('admin@proofofwork.edu', 'AdminPassword123!');
      } else if (roleType === 'evaluator') {
        await login('evaluator@proofofwork.edu', 'EvalPassword123!');
      } else if (roleType === 'student') {
        await login('student@proofofwork.edu', 'StudentPassword123!');
      }
    } catch (e: any) {
      alert(`Could not switch to demo ${roleType}: ${e.message}`);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </span>
        );
      case 'evaluator':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5" />
            Faculty Evaluator
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <GraduationCap className="w-3.5 h-3.5" />
            Student
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-gray-900">ProofOfWork</span>
                <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  Verification Platform
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden md:block">
                Rigorous, Rubric-Based Practical Skill Assessment
              </p>
            </div>
          </div>

          {/* Quick Demo Switcher & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Demo Quick Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200 text-xs">
              <span className="px-2 font-medium text-gray-500">Quick Switch:</span>
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin')}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${
                  user?.role === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('evaluator')}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${
                  user?.role === 'evaluator'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Evaluator
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('student')}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${
                  user?.role === 'student'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Student
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 object-cover"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {user.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
