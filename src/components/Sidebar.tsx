import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Code2,
  FolderGit2,
  Trophy,
  UserSquare2,
  CheckCircle2,
  History,
  KeyRound,
  Shield,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, currentView, setCurrentView, setActiveEntityId } = useAuth();

  const handleNavigate = (view: string) => {
    setActiveEntityId(null);
    setCurrentView(view);
  };

  if (!user) return null;

  const adminNav = [
    { id: 'dashboard', label: 'Overview Metrics', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'evaluators', label: 'Evaluator Management', icon: UserCheck },
    { id: 'submissions', label: 'Submission Allocation', icon: FileText },
    { id: 'challenges', label: 'Challenge Catalogue', icon: Layers },
  ];

  const studentNav = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'challenges', label: 'Browse Challenges', icon: Code2 },
    { id: 'submissions', label: 'My Submissions', icon: FileText },
    { id: 'portfolio', label: 'Verified Portfolio', icon: FolderGit2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'profile', label: 'Academic Profile', icon: UserSquare2 },
  ];

  const evaluatorNav = [
    { id: 'dashboard', label: 'Assigned Submissions', icon: CheckCircle2 },
    { id: 'history', label: 'Evaluation History', icon: History },
    { id: 'account', label: 'Security & Password', icon: KeyRound },
  ];

  const navItems =
    user.role === 'admin'
      ? adminNav
      : user.role === 'evaluator'
      ? evaluatorNav
      : studentNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Active Workspace
        </div>
        <div className="flex items-center gap-2 font-medium text-white">
          {user.role === 'admin' && <Shield className="w-4 h-4 text-purple-400" />}
          {user.role === 'evaluator' && <UserCheck className="w-4 h-4 text-emerald-400" />}
          {user.role === 'student' && <Users className="w-4 h-4 text-blue-400" />}
          <span className="capitalize">{user.role} Portal</span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Account Info Pill */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="truncate font-medium text-slate-300">{user.email}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Role: <span className="capitalize">{user.role}</span>
        </div>
      </div>
    </aside>
  );
};
