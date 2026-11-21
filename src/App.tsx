import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CompanionProvider } from './context/CompanionContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentLearning } from './pages/student/StudentLearning';
import { LearningModulesPage } from './pages/student/LearningModulesPage';
import { AchievementsPage } from './pages/student/AchievementsPage';
import { DiagnosticPage } from './pages/student/DiagnosticPage';
import { PracticePage } from './pages/student/PracticePage';
import { ConceptMapPage } from './pages/student/ConceptMapPage';
import { RevisionPlannerPage } from './pages/student/RevisionPlannerPage';
import { AnalyticsPage } from './pages/student/AnalyticsPage';
import { ProfileSettingsPage } from './pages/student/ProfileSettingsPage';
import { TeacherOverview } from './pages/teacher/TeacherOverview';
import { TeacherStudents } from './pages/teacher/TeacherStudents';
import { TeacherConcepts } from './pages/teacher/TeacherConcepts';
import { TeacherMisconceptions } from './pages/teacher/TeacherMisconceptions';
import { TeacherReports } from './pages/teacher/TeacherReports';
import { UserRole } from '../shared/types';

function ProtectedRoute({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FC] text-sm text-slate-500">
        Loading workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher/overview' : '/student/dashboard'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CompanionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute role="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/modules"
                element={
                  <ProtectedRoute role="student">
                    <LearningModulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/learning"
                element={
                  <ProtectedRoute role="student">
                    <StudentLearning />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/achievements"
                element={
                  <ProtectedRoute role="student">
                    <AchievementsPage />
                  </ProtectedRoute>
                }
              />
            <Route
              path="/student/diagnostic"
              element={
                <ProtectedRoute role="student">
                  <DiagnosticPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/practice"
              element={
                <ProtectedRoute role="student">
                  <PracticePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/concept-map"
              element={
                <ProtectedRoute role="student">
                  <ConceptMapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/revisions"
              element={
                <ProtectedRoute role="student">
                  <RevisionPlannerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/analytics"
              element={
                <ProtectedRoute role="student">
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute role="student">
                  <ProfileSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher/overview"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/concepts"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherConcepts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/misconceptions"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherMisconceptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/reports"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherReports />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CompanionProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
