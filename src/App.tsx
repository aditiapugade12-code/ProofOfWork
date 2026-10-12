import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminStudents } from './pages/admin/AdminStudents.tsx';
import { AdminEvaluators } from './pages/admin/AdminEvaluators.tsx';
import { AdminSubmissions } from './pages/admin/AdminSubmissions.tsx';
import { AdminChallenges } from './pages/admin/AdminChallenges.tsx';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { StudentChallenges } from './pages/student/StudentChallenges.tsx';
import { StudentSubmit } from './pages/student/StudentSubmit.tsx';
import { StudentSubmissions } from './pages/student/StudentSubmissions.tsx';
import { StudentPortfolio } from './pages/student/StudentPortfolio.tsx';
import { StudentLeaderboard } from './pages/student/StudentLeaderboard.tsx';
import { StudentProfile } from './pages/student/StudentProfile.tsx';

// Evaluator Pages
import { EvaluatorDashboard } from './pages/evaluator/EvaluatorDashboard.tsx';
import { EvaluatorReview } from './pages/evaluator/EvaluatorReview.tsx';
import { EvaluatorHistory } from './pages/evaluator/EvaluatorHistory.tsx';
import { EvaluatorAccount } from './pages/evaluator/EvaluatorAccount.tsx';

function MainApp() {
  const { user, isLoading, currentView, setCurrentView } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Sub-navigation state for drill-down views
  const [selectedChallengeForSubmit, setSelectedChallengeForSubmit] = useState<any | null>(null);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Loading ProofOfWork...</p>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    if (authView === 'register') {
      return <Register onGoToLogin={() => setAuthView('login')} />;
    }
    return <Login onGoToRegister={() => setAuthView('register')} />;
  }

  // Authenticated Layout
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)] bg-slate-50">
          {/* Admin Routes */}
          {user.role === 'admin' && (
            <>
              {currentView === 'dashboard' && <AdminDashboard />}
              {currentView === 'students' && <AdminStudents />}
              {currentView === 'evaluators' && <AdminEvaluators />}
              {currentView === 'submissions' && <AdminSubmissions />}
              {currentView === 'challenges' && <AdminChallenges />}
            </>
          )}

          {/* Student Routes */}
          {user.role === 'student' && (
            <>
              {currentView === 'dashboard' && <StudentDashboard />}
              {currentView === 'challenges' && (
                <StudentChallenges
                  onStartSubmit={(challenge) => {
                    setSelectedChallengeForSubmit(challenge);
                    setCurrentView('submit');
                  }}
                />
              )}
              {currentView === 'submit' && selectedChallengeForSubmit && (
                <StudentSubmit
                  challenge={selectedChallengeForSubmit}
                  onBack={() => {
                    setSelectedChallengeForSubmit(null);
                    setCurrentView('challenges');
                  }}
                  onSubmitted={() => {
                    setSelectedChallengeForSubmit(null);
                    setCurrentView('submissions');
                  }}
                />
              )}
              {currentView === 'submissions' && <StudentSubmissions />}
              {currentView === 'portfolio' && <StudentPortfolio />}
              {currentView === 'leaderboard' && <StudentLeaderboard />}
              {currentView === 'profile' && <StudentProfile />}
            </>
          )}

          {/* Evaluator Routes */}
          {user.role === 'evaluator' && (
            <>
              {currentView === 'dashboard' && (
                <EvaluatorDashboard
                  onStartReview={(submissionId) => {
                    setReviewingSubmissionId(submissionId);
                    setCurrentView('review');
                  }}
                />
              )}
              {currentView === 'review' && reviewingSubmissionId && (
                <EvaluatorReview
                  submissionId={reviewingSubmissionId}
                  onBack={() => {
                    setReviewingSubmissionId(null);
                    setCurrentView('dashboard');
                  }}
                  onFinished={() => {
                    setReviewingSubmissionId(null);
                    setCurrentView('dashboard');
                  }}
                />
              )}
              {currentView === 'history' && <EvaluatorHistory />}
              {currentView === 'account' && <EvaluatorAccount />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
