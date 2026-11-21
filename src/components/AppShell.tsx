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
  FlipHorizontal2,
  Timer,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompanion } from '../context/CompanionContext';
import { StudyCompanion } from './StudyCompanion';
import { EdvantaLogo, EdvantaSymbol } from './brand/EdvantaBrand';
import { ThemeSegmentedControl } from './ui/ThemePrimitives';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard Overview', to: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Learning & Journey', to: '/student/modules', icon: Layers },
  { label: 'Flashcards', to: '/student/flashcards', icon: FlipHorizontal2 },
  { label: 'Timed Mock Exams', to: '/student/mock-exam', icon: Timer },
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
  const { isHidden, setIsHidden, setIsOpen } = useCompanion();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = user.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const roleLabel = user.role === 'teacher' ? 'Educator Workspace' : 'Student Workspace';

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const renderSidebar = (isMobileDrawer = false) => {
    const compact = collapsed && !isMobileDrawer;
    return (
      <div className="flex h-full flex-col bg-white dark:bg-[#15182B] text-[#14172B] dark:text-[#F4F6FF] transition-colors">
        <div
          className={`flex items-center ${
            compact ? 'justify-center px-3' : 'justify-between px-5'
          } h-16 border-b border-[#E2E6F3] dark:border-[#2B3150] shrink-0`}
        >
          <Link
            to="/"
            aria-label="EDVANTA home"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7055F7] rounded-lg"
          >
            {compact ? <EdvantaSymbol size={28} variant="auto" /> : <EdvantaLogo variant="auto" size="md" />}
          </Link>
          {isMobileDrawer && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="lg:hidden p-1.5 rounded-lg text-[#6E7696] hover:text-[#14172B] dark:hover:text-white hover:bg-[#EEF1FA] dark:hover:bg-[#212640]"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {!compact && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6E7696] dark:text-[#8892B5]">
              {roleLabel}
            </p>
            <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] truncate mt-0.5">
              {user.className || 'Java DSA Cohort'}
            </p>
          </div>
        )}

        <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={compact ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center ${
                  compact ? 'justify-center px-2.5' : 'gap-3 px-3.5'
                } rounded-xl py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#7055F7] text-white shadow-xs'
                    : 'text-[#4E5674] dark:text-[#B4BDD9] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] hover:text-[#14172B] dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!compact && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[#E2E6F3] dark:border-[#2B3150] p-3 space-y-2.5">
          {!compact && (
            <div className="px-2 py-1">
              <p className="text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF] truncate">{user.name}</p>
              <p className="text-xs text-[#6E7696] dark:text-[#8892B5] truncate">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={compact ? 'Sign out' : undefined}
            className={`w-full flex items-center ${
              compact ? 'justify-center px-2' : 'gap-2.5 px-3'
            } rounded-xl py-2 text-sm font-medium text-[#4E5674] dark:text-[#B4BDD9] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] hover:text-[#14172B] dark:hover:text-white transition-colors`}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!compact && <span>Sign out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F6F7FC] dark:bg-[#111322] text-[#14172B] dark:text-[#F4F6FF] transition-colors">
      {/* Desktop collapsible sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-[#E2E6F3] dark:border-[#2B3150] sticky top-0 h-screen transition-[width] duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {renderSidebar(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#111322]/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[82vw] h-full shadow-2xl">{renderSidebar(true)}</aside>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-3 bg-white/90 dark:bg-[#181B2E]/90 backdrop-blur border-b border-[#E2E6F3] dark:border-[#2B3150] px-3.5 sm:px-8 h-16 transition-colors">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 -ml-1.5 rounded-xl text-[#4E5674] dark:text-[#B4BDD9] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] hover:text-[#14172B] dark:hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex p-2 -ml-2 rounded-xl text-[#6E7696] dark:text-[#8892B5] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] hover:text-[#14172B] dark:hover:text-white transition-colors"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden xl:inline text-[#6E7696] dark:text-[#8892B5] whitespace-nowrap">
                {user.role === 'teacher' ? 'Teacher' : 'Java DSA'}
              </span>
              <ChevronRight className="hidden xl:inline h-4 w-4 text-[#6E7696] shrink-0" aria-hidden="true" />
              <h1 className="font-display text-sm sm:text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF] truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeSegmentedControl compact />

            {user.role === 'student' && isHidden && (
              <button
                type="button"
                aria-label="Show Byte study companion"
                onClick={() => {
                  setIsHidden(false);
                  setIsOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/70 dark:bg-[#212640] hover:bg-[#E2E6F3] dark:hover:bg-[#272D4B] px-2.5 py-1.5 text-xs font-medium text-[#7055F7] dark:text-[#A493FF] whitespace-nowrap transition-colors"
              >
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Show Byte</span>
              </button>
            )}

            {user.role === 'student' && (
              <Link
                to="/student/achievements"
                title="Active daily streak"
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-[#F6B94A]/40 bg-[#F6B94A]/10 px-2.5 py-1.5 text-xs font-semibold text-[#B46E00] dark:text-[#F6B94A] whitespace-nowrap"
              >
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-mono tabular-nums">{user.streakDays}d</span>
              </Link>
            )}

            {user.role === 'student' ? (
              <Link
                to="/student/practice"
                className="px-2.5 sm:px-4 py-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <span className="sm:hidden">Practice</span>
                <span className="hidden sm:inline">Practice Next</span>
              </Link>
            ) : (
              <Link
                to="/teacher/reports"
                className="px-2.5 sm:px-4 py-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <span className="sm:hidden">Export</span>
                <span className="hidden sm:inline">Export Report</span>
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
