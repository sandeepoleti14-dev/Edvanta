import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CompanionProvider } from './context/CompanionContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentLearning } from './pages/student/StudentLearning';
import { LearningModulesPage } from './pages/student/LearningModulesPage';
import { FlashcardsPage } from './pages/student/FlashcardsPage';
import { MockExamPage } from './pages/student/MockExamPage';
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
import { AppIcon } from './components/brand/EdvantaBrand';
import { BrandIntro } from './components/brand/BrandIntro';
import {
  markIntroSeenFlag,
  readIntroSeenFlag,
  shouldPlayBrandIntro,
} from './utils/brandIntroLogic';

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F6F7FC] dark:bg-[#111322] text-sm text-[#4E5674] dark:text-[#B4BDD9]">
        <AppIcon size={44} variant="dark" />
        <span>Loading EDVANTA workspace...</span>
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

function BrandIntroGate() {
  const location = useLocation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return shouldPlayBrandIntro({
      pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
      search: typeof window !== 'undefined' ? window.location.search : '',
      hasSeenInSession: readIntroSeenFlag(),
      prefersReducedMotion: reduced,
    });
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const onReplayRequest = () => {
      setShowIntro(true);
    };
    window.addEventListener('edvanta:replay-intro', onReplayRequest);
    return () => window.removeEventListener('edvanta:replay-intro', onReplayRequest);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('intro') === '1') {
      setShowIntro(true);
    }
  }, [location.search]);

  const handleComplete = useCallback(() => {
    markIntroSeenFlag();
    setShowIntro(false);
  }, []);

  if (!showIntro) return null;

  return <BrandIntro onComplete={handleComplete} reducedMotion={prefersReducedMotion} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CompanionProvider>
            <BrowserRouter>
              <BrandIntroGate />
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
                  path="/student/flashcards"
                  element={
                    <ProtectedRoute role="student">
                      <FlashcardsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/mock-exam"
                  element={
                    <ProtectedRoute role="student">
                      <MockExamPage />
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
    </ThemeProvider>
  );
}
