import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  Network,
  CalendarClock,
  BarChart3,
  Settings,
  Users,
  AlertCircle,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudyCompanion } from './StudyCompanion';
import { EdvantaLogo } from './brand/EdvantaBrand';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard Overview', to: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Learning Modules', to: '/student/modules', icon: Layers },
  { label: 'My Learning', to: '/student/learning', icon: BookOpen },
  { label: 'Diagnostic Test', to: '/student/diagnostic', icon: ClipboardCheck },
  { label: 'Adaptive Practice', to: '/student/practice', icon: Sparkles },
  { label: 'Concept Map', to: '/student/concept-map', icon: Network },
  { label: 'Revision Planner', to: '/student/revisions', icon: CalendarClock },
  { label: 'Achievements', to: '/student/achievements', icon: Award },
  { label: 'Performance Analytics', to: '/student/analytics', icon: BarChart3 },
  { label: 'Profile & Settings', to: '/student/settings', icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { label: 'Overview', to: '/teacher/overview', icon: LayoutDashboard },
  { label: 'Students', to: '/teacher/students', icon: Users },
  { label: 'Concept Analytics', to: '/teacher/concepts', icon: BarChart3 },
  { label: 'Misconceptions', to: '/teacher/misconceptions', icon: AlertCircle },
  { label: 'Reports', to: '/teacher/reports', icon: FileSpreadsheet },
];

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = user.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const roleLabel = user.role === 'teacher' ? 'Educator Workspace' : 'Student Workspace';

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#101827] text-slate-200">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
        <Link
          to="/"
          aria-label="EDVANTA home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526BFF] rounded-lg"
        >
          <EdvantaLogo variant="dark" size="md" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 pt-5 pb-2">
        <p className="text-xs font-medium text-slate-400">{roleLabel}</p>
        <p className="text-sm font-medium text-white truncate mt-0.5">{user.className || 'Class 10 Physics'}</p>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#526BFF] text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 space-y-3">
        <div className="px-2">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F7FC] text-[#101827]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[82vw] h-full">{sidebarContent}</aside>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#101827]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 whitespace-nowrap">
                {user.role === 'teacher' ? 'Teacher' : 'Class 10 Electricity'}
              </span>
              <ChevronRight className="hidden sm:inline h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-base sm:text-lg font-semibold text-[#101827] truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline text-xs text-slate-500 whitespace-nowrap">
              {user.name} · {user.role === 'teacher' ? 'Instructor' : `Streak ${user.streakDays}d`}
            </span>
            {user.role === 'student' ? (
              <Link
                to="/student/practice"
                className="px-4 py-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Practice Next
              </Link>
            ) : (
              <Link
                to="/teacher/reports"
                className="px-4 py-2 rounded-lg bg-[#101827] hover:bg-slate-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Export Report
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 pb-24 sm:pb-24 max-w-[1360px] w-full mx-auto">{children}</main>
      </div>
      {user.role === 'student' && <StudyCompanion />}
    </div>
  );
}
