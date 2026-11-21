import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import {
  ArrowRight,
  AlertCircle,
  Award,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Compass,
  Flame,
  FlipHorizontal2,
  Layers,
  MessageSquare,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { AppIcon } from '../../components/brand/EdvantaBrand';
import { MasteryStatusText, RevisionStatusText, masteryBarColor } from '../../components/StatusIndicator';
import { VoltMascotSvg } from '../../components/StudyCompanion';
import { ProgressBar, SurfaceCard, useChartTheme } from '../../components/ui/ThemePrimitives';
import { useCompanion } from '../../context/CompanionContext';
import { apiFetch } from '../../lib/api';
import {
  AchievementsPayload,
  FlashcardsPayload,
  LearningModuleItem,
  MockExamHistoryItem,
  StudentDashboardPayload,
} from '../../../shared/types';

export function StudentDashboard() {
  const navigate = useNavigate();
  const chartTheme = useChartTheme();
  const { setIsOpen, setIsHidden, setCompanionTier } = useCompanion();

  const [data, setData] = useState<StudentDashboardPayload | null>(null);
  const [achievements, setAchievements] = useState<AchievementsPayload | null>(null);
  const [modules, setModules] = useState<LearningModuleItem[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardsPayload | null>(null);
  const [mockHistory, setMockHistory] = useState<MockExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [dashRes, achRes, modRes, fcRes, mockRes] = await Promise.all([
          apiFetch<StudentDashboardPayload>('/api/student/dashboard'),
          apiFetch<AchievementsPayload>('/api/student/achievements'),
          apiFetch<{ modules: LearningModuleItem[] }>('/api/student/modules'),
          apiFetch<FlashcardsPayload>('/api/student/flashcards'),
          apiFetch<{ history: MockExamHistoryItem[] }>('/api/student/mock-exam/history'),
        ]);
        if (active) {
          setData(dashRes);
          setAchievements(achRes);
          setModules(modRes.modules);
          setFlashcards(fcRes);
          setMockHistory(mockRes.history);
          if (dashRes.gamification?.companionTier) {
            setCompanionTier(dashRes.gamification.companionTier);
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [setCompanionTier]);

  if (loading) {
    return (
      <AppShell title="Dashboard Overview">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm text-[#4E5674] dark:text-[#B4BDD9]">
            <AppIcon size={32} variant="auto" />
            <span>Syncing your EDVANTA learner model...</span>
          </div>
          <div className="h-32 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Dashboard Overview">
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Dashboard data could not be loaded.'}</span>
        </SurfaceCard>
      </AppShell>
    );
  }

  const gamification = data.gamification;
  const completedModulesCount = modules.filter((m) => m.completed).length;
  const totalModulesCount = modules.length || 8;
  const nextModule = modules.find((m) => !m.completed) ?? modules[0];
  const dueRevisionsCount = data.upcomingRevisions.filter((r) => r.status === 'due').length;

  const barData = data.conceptMasteries.map((c) => ({
    name: c.name.replace(' & Resistivity', '').replace(' & Heating', ''),
    mastery: c.attemptCount === 0 ? 0 : c.masteryScore,
    status: c.status,
  }));

  const firstName = data.user.name.split(' ')[0] || data.user.name;

  return (
    <AppShell title="Dashboard Overview">
      <div className="space-y-6">
        {/* Welcome Banner + Volt Greeting + Recommended Activity */}
        <SurfaceCard className="p-6 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-[#EEF1FA] dark:bg-[#212640] border border-[#E2E6F3] dark:border-[#2B3150] items-center justify-center shrink-0">
                <VoltMascotSvg
                  mood="welcome"
                  size={44}
                  tier={gamification?.companionTier.tier ?? 1}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                  {data.user.className} · {data.user.gradeLevel}
                  {gamification ? ` · Level ${gamification.level} ${gamification.levelTitle}` : ''}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  Welcome back, {firstName}
                </h2>
                <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1.5 max-w-2xl font-friendly">
                  {data.recommendedActivity.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!data.hasCompletedDiagnostic ? (
                <Link
                  to="/student/diagnostic"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shadow-xs"
                >
                  Start Diagnostic Assessment
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link
                    to={data.recommendedActivity.targetPath}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shadow-xs"
                  >
                    {data.recommendedActivity.title}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHidden(false);
                      setIsOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/70 dark:bg-[#212640] hover:bg-[#E2E6F3] dark:hover:bg-[#272D4B] px-4 py-2.5 text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors whitespace-nowrap"
                  >
                    <MessageSquare className="h-4 w-4 text-[#35C9D8]" aria-hidden="true" />
                    Ask Volt
                  </button>
                </>
              )}
            </div>
          </div>
        </SurfaceCard>

        {/* Gamified Learner Level, Streak & Daily Goal Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Learner Level & XP Progress */}
          <SurfaceCard className="lg:col-span-5 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  Learner Level &amp; XP
                </p>
                <div className="flex items-baseline gap-2.5 mt-1.5">
                  <span className="font-display text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                    Level {gamification?.level ?? 1}
                  </span>
                  <span className="text-sm font-medium text-[#4E5674] dark:text-[#B4BDD9]">
                    {gamification?.levelTitle ?? 'Spark Apprentice'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-lg font-bold tabular-nums text-[#F6B94A]">
                  {gamification?.totalXp ?? achievements?.totalXp ?? 0} XP
                </p>
                <p className="text-[11px] text-[#6E7696] dark:text-[#8892B5] tabular-nums">
                  {gamification ? `${gamification.xpRemaining} XP to Lv ${gamification.level + 1}` : 'Verified actions'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <ProgressBar
                value={gamification?.xpInLevel ?? 0}
                max={gamification?.xpForNextLevel ?? 200}
                tone="primary"
                label="XP progress to next learner level"
              />
              <div className="flex items-center justify-between text-xs text-[#6E7696] dark:text-[#8892B5] tabular-nums">
                <span>
                  {gamification?.xpInLevel ?? 0} / {gamification?.xpForNextLevel ?? 200} XP in level
                </span>
                <span>Volt Tier: {gamification?.companionTier.title ?? 'Scout Spark'}</span>
              </div>
            </div>
          </SurfaceCard>

          {/* Daily Streak, Longest Streak & Weekly Activity Calendar */}
          <SurfaceCard className="lg:col-span-4 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#B46E00] dark:text-[#F6B94A] flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  Study Streak
                </p>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <span className="font-display text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                    {gamification?.streakDays ?? data.user.streakDays} Days
                  </span>
                  <span className="text-xs text-[#6E7696] dark:text-[#8892B5] tabular-nums">
                    Best: {gamification?.longestStreakDays ?? data.user.streakDays}d
                  </span>
                </div>
              </div>
              <Link
                to="/student/achievements"
                className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
              >
                Badges
              </Link>
            </div>

            {/* Real 7-day SQLite UTC activity calendar */}
            <div className="grid grid-cols-7 gap-1.5" aria-label="Last 7 days learning activity">
              {(gamification?.weeklyActivity ?? []).map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} learning action(s)`}
                  className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 border transition-colors ${
                    day.active
                      ? 'border-[#27C991]/45 bg-[#27C991]/12 text-[#15996C] dark:text-[#27C991]'
                      : day.isToday
                      ? 'border-[#7055F7]/50 bg-[#7055F7]/8 text-[#7055F7] dark:text-[#A493FF]'
                      : 'border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/50 dark:bg-[#212640]/50 text-[#6E7696] dark:text-[#8892B5]'
                  }`}
                >
                  <span className="text-[10px] font-medium">{day.dayLabel}</span>
                  <span className="font-mono text-xs font-bold tabular-nums mt-0.5">
                    {day.count > 0 ? day.count : '·'}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          {/* Daily Learning Goal */}
          <SurfaceCard className="lg:col-span-3 p-5 flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#15996C] dark:text-[#27C991] flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Daily Learning Goal
              </p>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-display text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                  {gamification?.dailyGoalCompleted ?? 0}/{gamification?.dailyGoalTarget ?? 5}
                </span>
                <span className="text-xs text-[#6E7696] dark:text-[#8892B5]">actions today</span>
              </div>
            </div>
            <div className="space-y-2">
              <ProgressBar
                value={gamification?.dailyGoalCompleted ?? 0}
                max={gamification?.dailyGoalTarget ?? 5}
                tone="success"
                label="Daily learning goal progress"
              />
              <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] font-friendly">
                {(gamification?.dailyGoalCompleted ?? 0) >= (gamification?.dailyGoalTarget ?? 5)
                  ? 'Daily goal reached! Keep momentum going.'
                  : `${Math.max(0, (gamification?.dailyGoalTarget ?? 5) - (gamification?.dailyGoalCompleted ?? 0))} more action(s) to hit today’s goal.`}
              </p>
            </div>
          </SurfaceCard>
        </section>

        {/* Learning DNA KPI Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Learning DNA · Mastery</p>
            <p className="font-display text-3xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-2">
              {data.overallMastery}%
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">
              {data.conceptMasteries.filter((c) => c.status === 'mastered').length} of{' '}
              {data.conceptMasteries.length} concepts mastered
            </p>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Questions Attempted</p>
            <p className="font-display text-3xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-2">
              {data.totalAttempted}
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">Persisted across sessions</p>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Accuracy Rate</p>
            <p className="font-display text-3xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-2">
              {data.accuracyRate}%
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">Diagnostic &amp; adaptive practice</p>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Revisions Due</p>
            <p className="font-display text-3xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-2">
              {dueRevisionsCount}
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">
              {dueRevisionsCount > 0 ? 'Ready in Revision Planner' : 'Schedule up to date'}
            </p>
          </SurfaceCard>
        </section>

        {/* 4-Stage Exam-Prep Cycle Hub (Learn · Practice · Analyze · Excel) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link
            to="/student/modules?view=journey"
            className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] hover:border-[#7055F7]/60 p-5 transition-colors flex flex-col justify-between gap-3 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#6E7696] dark:text-[#8892B5]">
              <span>01. Learn</span>
              <Compass className="h-4 w-4 text-[#7055F7]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Journey &amp; Offline Notes
              </h3>
              <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                {completedModulesCount}/{totalModulesCount} lessons complete with simulators
              </p>
            </div>
          </Link>

          <Link
            to="/student/flashcards"
            className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] hover:border-[#477BFF]/60 p-5 transition-colors flex flex-col justify-between gap-3 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#6E7696] dark:text-[#8892B5]">
              <span>02. Practice</span>
              <FlipHorizontal2 className="h-4 w-4 text-[#477BFF]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Active-Recall Flashcards
              </h3>
              <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                {flashcards ? `${flashcards.stats.known}/${flashcards.stats.total} cards known` : '24 high-yield cards'}
              </p>
            </div>
          </Link>

          <Link
            to="/student/analytics"
            className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] hover:border-[#27C991]/60 p-5 transition-colors flex flex-col justify-between gap-3 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#6E7696] dark:text-[#8892B5]">
              <span>03. Analyze</span>
              <BarChart3 className="h-4 w-4 text-[#27C991]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Misconceptions &amp; Insights
              </h3>
              <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                {data.recentMisconceptions.filter((m) => !m.resolved).length} active misconception(s) tracked
              </p>
            </div>
          </Link>

          <Link
            to="/student/mock-exam"
            className="rounded-2xl border border-[#7055F7]/40 bg-[#14172B] dark:bg-[#212640] hover:bg-[#1D2138] dark:hover:bg-[#272D4B] p-5 transition-colors flex flex-col justify-between gap-3 text-white shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#35C9D8]">
              <span>04. Excel</span>
              <Timer className="h-4 w-4 text-[#F6B94A]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-white">Timed Mock Exams</h3>
              <p className="text-xs text-[#B4BDD9] mt-1">
                {mockHistory.length > 0
                  ? `Latest score: ${mockHistory[0].scorePercent}% · Coach AI ready`
                  : '15-min syllabus paper + Coach AI'}
              </p>
            </div>
          </Link>
        </section>

        {/* Concept Mastery Chart & Progress Trajectory */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfaceCard className="lg:col-span-7 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Concept Mastery Profile
                </h3>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Calculated deterministically from accuracy, difficulty, and reasoning quality
                </p>
              </div>
              <Link to="/student/concept-map" className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap">
                View Concept Map
              </Link>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: chartTheme.tickFill }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartTheme.tickFill }} />
                  <Tooltip
                    cursor={{ fill: chartTheme.isDark ? 'rgba(112, 85, 247, 0.14)' : 'rgba(112, 85, 247, 0.08)' }}
                    formatter={(value: unknown) => [`${value}%`, 'Mastery']}
                    contentStyle={{
                      borderRadius: 12,
                      backgroundColor: chartTheme.tooltipBg,
                      borderColor: chartTheme.tooltipBorder,
                      color: chartTheme.tooltipText,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="mastery" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {barData.map((entry, idx) => {
                      const fill =
                        entry.status === 'mastered'
                          ? chartTheme.success
                          : entry.status === 'developing'
                          ? chartTheme.gold
                          : entry.status === 'weak'
                          ? chartTheme.danger
                          : chartTheme.gridStroke;
                      return <Cell key={idx} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Learning Trajectory
                </h3>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Daily accuracy &amp; mastery progression
                </p>
              </div>
              <Link to="/student/analytics" className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap">
                Full Analytics
              </Link>
            </div>

            {data.progressHistory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center px-4">
                <Target className="h-8 w-8 text-[#6E7696] mb-2" />
                <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF]">No attempt history yet</p>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">
                  Complete the Electricity diagnostic to establish your baseline trajectory.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.progressHistory} margin={{ top: 8, right: 12, left: -18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.tickFill }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartTheme.tickFill }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        backgroundColor: chartTheme.tooltipBg,
                        borderColor: chartTheme.tooltipBorder,
                        color: chartTheme.tooltipText,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgMastery"
                      name="Avg Mastery %"
                      stroke={chartTheme.primary}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy %"
                      stroke={chartTheme.cyan}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SurfaceCard>
        </section>

        {/* Strongest, Weakest & Upcoming Revisions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfaceCard className="lg:col-span-4 p-6">
            <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Weakest Concepts
            </h3>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
              Prioritized by adaptive practice engine
            </p>

            {data.weakestConcepts.length === 0 ? (
              <p className="text-sm text-[#6E7696] dark:text-[#8892B5] mt-6">
                Complete your diagnostic to identify focus areas.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
                {data.weakestConcepts.map((c) => (
                  <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] truncate">{c.name}</p>
                      <div className="mt-1">
                        <MasteryStatusText status={c.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                        {c.masteryScore}%
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/student/practice?conceptId=${c.id}`)}
                        className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline"
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-4 p-6">
            <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Strongest Concepts
            </h3>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
              Scheduled on longer spaced intervals
            </p>

            {data.strongestConcepts.length === 0 ? (
              <p className="text-sm text-[#6E7696] dark:text-[#8892B5] mt-6">
                Your strongest concepts will appear after baseline testing.
              </p>
            ) : (
              <div className="mt-4 space-y-3.5">
                {data.strongestConcepts.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#14172B] dark:text-[#F4F6FF]">{c.name}</span>
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                        {c.masteryScore}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-[#EEF1FA] dark:bg-[#252B46] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${masteryBarColor(c.status)}`}
                        style={{ width: `${c.masteryScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Upcoming Revisions
              </h3>
              <Link to="/student/revisions" className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline">
                Planner
              </Link>
            </div>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">Stored spaced-repetition schedule</p>

            {data.upcomingRevisions.length === 0 ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-[#4E5674] dark:text-[#B4BDD9]">
                <CheckCircle2 className="h-4 w-4 text-[#27C991]" />
                <span>All scheduled revisions are up to date.</span>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
                {data.upcomingRevisions.slice(0, 4).map((rev) => (
                  <div key={rev.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] truncate">
                        {rev.conceptName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[#6E7696] dark:text-[#8892B5]">
                        <RevisionStatusText status={rev.status} />
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(rev.scheduledFor).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/student/practice?conceptId=${rev.conceptId}&revisionId=${rev.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/50 dark:bg-[#212640] hover:bg-[#E2E6F3] dark:hover:bg-[#272D4B] px-2.5 py-1.5 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] shrink-0 transition-colors"
                    >
                      <CalendarClock className="h-3.5 w-3.5 text-[#7055F7]" aria-hidden="true" />
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </section>

        {/* Continue Learning, Active Quests & Recent Achievements */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfaceCard className="lg:col-span-5 p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  <span>Continue Learning</span>
                </div>
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  Class 10 Electricity Lesson Path
                </h3>
                <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                  {completedModulesCount} of {totalModulesCount} interactive modules completed with simulators and worked examples.
                </p>
              </div>
              <span className="font-mono text-lg font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] shrink-0">
                {completedModulesCount}/{totalModulesCount}
              </span>
            </div>
            <ProgressBar
              value={completedModulesCount}
              max={totalModulesCount}
              tone="cyan"
              heightClass="h-2"
              label="Syllabus modules completed"
            />
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E6F3] dark:border-[#2B3150]">
              <span className="text-xs text-[#6E7696] dark:text-[#8892B5] truncate">
                Next up:{' '}
                <strong className="font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  {nextModule?.title || '01. Electric Current'}
                </strong>
              </span>
              <Link
                to={nextModule ? `/student/modules?conceptSlug=${nextModule.conceptSlug}` : '/student/modules'}
                className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
              >
                Continue Lesson
              </Link>
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-4 p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#35C9D8]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Learning Quests</span>
                </div>
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  Active Milestones
                </h3>
              </div>
              <Link to="/student/achievements" className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline">
                All Quests
              </Link>
            </div>
            <div className="space-y-3">
              {(gamification?.quests ?? []).slice(0, 2).map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#14172B] dark:text-[#F4F6FF] truncate">{q.title}</span>
                    <span className="font-mono tabular-nums text-[#6E7696] dark:text-[#8892B5] shrink-0">
                      {q.progress}/{q.target}
                    </span>
                  </div>
                  <ProgressBar
                    value={q.progress}
                    max={q.target}
                    tone={q.completed ? 'success' : 'secondary'}
                    heightClass="h-1.5"
                  />
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-3 p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#B46E00] dark:text-[#F6B94A]">
                  <Award className="h-4 w-4" aria-hidden="true" />
                  <span>Achievements</span>
                </div>
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  {achievements ? `${achievements.unlockedCount}/${achievements.totalCount}` : '0/10'} Badges
                </h3>
              </div>
              <Trophy className="h-5 w-5 text-[#F6B94A] shrink-0" aria-hidden="true" />
            </div>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed">
              {achievements?.badges
                .filter((b) => b.unlocked)
                .slice(0, 3)
                .map((b) => b.title)
                .join(' · ') || 'Complete a diagnostic or module to unlock your first badge.'}
            </p>
            <div className="pt-2 border-t border-[#E2E6F3] dark:border-[#2B3150]">
              <Link
                to="/student/achievements"
                className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
              >
                Open Achievements Hub →
              </Link>
            </div>
          </SurfaceCard>
        </section>
      </div>
    </AppShell>
  );
}
