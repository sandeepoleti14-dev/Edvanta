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
import { ArrowRight, AlertCircle, Award, CalendarClock, Flame, Layers, Target, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { AppIcon } from '../../components/brand/EdvantaBrand';
import { MasteryStatusText, RevisionStatusText, masteryBarColor } from '../../components/StatusIndicator';
import { apiFetch } from '../../lib/api';
import { AchievementsPayload, LearningModuleItem, StudentDashboardPayload } from '../../../shared/types';

export function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDashboardPayload | null>(null);
  const [achievements, setAchievements] = useState<AchievementsPayload | null>(null);
  const [modules, setModules] = useState<LearningModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [dashRes, achRes, modRes] = await Promise.all([
          apiFetch<StudentDashboardPayload>('/api/student/dashboard'),
          apiFetch<AchievementsPayload>('/api/student/achievements'),
          apiFetch<{ modules: LearningModuleItem[] }>('/api/student/modules'),
        ]);
        if (active) {
          setData(dashRes);
          setAchievements(achRes);
          setModules(modRes.modules);
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
  }, []);

  if (loading) {
    return (
      <AppShell title="Dashboard Overview">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <AppIcon size={32} variant="dark" />
            <span>Syncing your EDVANTA learner model...</span>
          </div>
          <div className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 rounded-xl bg-white border border-slate-200" />
            ))}
          </div>
          <div className="h-72 rounded-xl bg-white border border-slate-200 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Dashboard Overview">
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Dashboard data could not be loaded.'}</span>
        </div>
      </AppShell>
    );
  }

  const barData = data.conceptMasteries.map((c) => ({
    name: c.name.replace(' & Resistivity', '').replace(' & Heating', ''),
    mastery: c.attemptCount === 0 ? 0 : c.masteryScore,
    status: c.status,
  }));

  return (
    <AppShell title="Dashboard Overview">
      <div className="space-y-6">
        {/* Welcome & Recommended Next Activity */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {data.user.className} · {data.user.gradeLevel}
            </p>
            <h2 className="font-display text-2xl font-bold text-[#101827] mt-1">
              Welcome back, {data.user.name}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              {data.recommendedActivity.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!data.hasCompletedDiagnostic ? (
              <Link
                to="/student/diagnostic"
                className="inline-flex items-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-5 py-2.5 text-sm font-medium text-white transition-colors whitespace-nowrap"
              >
                Start Diagnostic Assessment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to={data.recommendedActivity.targetPath}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-5 py-2.5 text-sm font-medium text-white transition-colors whitespace-nowrap"
                >
                  {data.recommendedActivity.title}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/student/diagnostic"
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-medium text-[#101827] transition-colors whitespace-nowrap"
                >
                  Retake Diagnostic
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Primary KPI Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Overall Mastery</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827] mt-2">
              {data.overallMastery}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {data.conceptMasteries.filter((c) => c.status === 'mastered').length} of{' '}
              {data.conceptMasteries.length} concepts mastered
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Questions Attempted</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827] mt-2">
              {data.totalAttempted}
            </p>
            <p className="text-xs text-slate-500 mt-1">Persisted across sessions</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Accuracy Rate</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827] mt-2">
              {data.accuracyRate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Across diagnostic &amp; practice</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Learning Streak</p>
            <div className="flex items-center gap-2 mt-2">
              <Flame className="h-6 w-6 text-[#D97706]" aria-hidden="true" />
              <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827]">
                {data.user.streakDays}d
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data.upcomingRevisions.filter((r) => r.status === 'due').length} revisions due today
            </p>
          </div>
        </section>

        {/* Concept Mastery Chart & Progress Trajectory */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#101827]">
                  Concept Mastery Profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated deterministically from accuracy, difficulty, and reasoning quality
                </p>
              </div>
              <Link to="/student/concept-map" className="text-xs font-medium text-[#526BFF] hover:underline">
                View Concept Map
              </Link>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(value: unknown) => [`${value}%`, 'Mastery']}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: '#E2E8F0',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="mastery" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {barData.map((entry, idx) => {
                      const fill =
                        entry.status === 'mastered'
                          ? '#16A34A'
                          : entry.status === 'developing'
                          ? '#D97706'
                          : entry.status === 'weak'
                          ? '#DC2626'
                          : '#CBD5E1';
                      return <Cell key={idx} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#101827]">
                  Learning Trajectory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily accuracy &amp; mastery progression
                </p>
              </div>
              <Link to="/student/analytics" className="text-xs font-medium text-[#526BFF] hover:underline">
                Full Analytics
              </Link>
            </div>

            {data.progressHistory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center px-4">
                <Target className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">No attempt history yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Complete the Electricity diagnostic to establish your baseline trajectory.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.progressHistory} margin={{ top: 8, right: 12, left: -18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: '#E2E8F0',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgMastery"
                      name="Avg Mastery %"
                      stroke="#526BFF"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy %"
                      stroke="#8B6CFF"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Strongest, Weakest & Upcoming Revisions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-base font-semibold text-[#101827]">Weakest Concepts</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prioritized by adaptive practice engine</p>

            {data.weakestConcepts.length === 0 ? (
              <p className="text-sm text-slate-500 mt-6">Complete your diagnostic to identify focus areas.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {data.weakestConcepts.map((c) => (
                  <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#101827] truncate">{c.name}</p>
                      <div className="mt-1">
                        <MasteryStatusText status={c.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-semibold tabular-nums text-[#101827]">
                        {c.masteryScore}%
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/student/practice?conceptId=${c.id}`)}
                        className="text-xs font-medium text-[#526BFF] hover:underline"
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-base font-semibold text-[#101827]">Strongest Concepts</h3>
            <p className="text-xs text-slate-500 mt-0.5">Scheduled on longer spaced intervals</p>

            {data.strongestConcepts.length === 0 ? (
              <p className="text-sm text-slate-500 mt-6">Your strongest concepts will appear after baseline testing.</p>
            ) : (
              <div className="mt-4 space-y-3.5">
                {data.strongestConcepts.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#101827]">{c.name}</span>
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#101827]">
                        {c.masteryScore}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${masteryBarColor(c.status)}`}
                        style={{ width: `${c.masteryScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#101827]">Upcoming Revisions</h3>
              <Link to="/student/revisions" className="text-xs font-medium text-[#526BFF] hover:underline">
                Planner
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Stored spaced-repetition schedule</p>

            {data.upcomingRevisions.length === 0 ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                <span>All scheduled revisions are up to date.</span>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {data.upcomingRevisions.slice(0, 4).map((rev) => (
                  <div key={rev.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#101827] truncate">{rev.conceptName}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <RevisionStatusText status={rev.status} />
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(rev.scheduledFor).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/student/practice?conceptId=${rev.conceptId}&revisionId=${rev.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-[#101827] hover:bg-slate-50 shrink-0"
                    >
                      <CalendarClock className="h-3.5 w-3.5 text-[#526BFF]" aria-hidden="true" />
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        {/* Syllabus Modules & Achievements Quick Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#526BFF]">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  <span>Structured Syllabus Modules</span>
                </div>
                <h3 className="font-display text-base font-semibold text-[#101827] mt-1">
                  Class 10 Electricity Lesson Path
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {modules.filter((m) => m.completed).length} of {modules.length || 8} interactive modules completed
                  with simulators and worked examples.
                </p>
              </div>
              <span className="font-mono text-lg font-bold tabular-nums text-[#101827] shrink-0">
                {modules.filter((m) => m.completed).length}/{modules.length || 8}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Next up:{' '}
                <strong className="font-medium text-[#101827]">
                  {(modules.find((m) => !m.completed) ?? modules[0])?.title || '01. Electric Current'}
                </strong>
              </span>
              <Link
                to="/student/modules"
                className="text-xs font-medium text-[#526BFF] hover:underline whitespace-nowrap"
              >
                Open Modules
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#D97706]">
                  <Award className="h-4 w-4" aria-hidden="true" />
                  <span>Streaks &amp; Achievements</span>
                </div>
                <h3 className="font-display text-base font-semibold text-[#101827] mt-1">
                  Milestones &amp; XP Earned
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {achievements
                    ? `${achievements.unlockedCount} of ${achievements.totalCount} badges unlocked · ${achievements.totalXp} XP total`
                    : 'Earn badges for daily streaks and concept mastery.'}
                </p>
              </div>
              <span className="font-mono text-lg font-bold tabular-nums text-[#526BFF] shrink-0">
                {achievements ? `${achievements.totalXp} XP` : '0 XP'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 truncate">
                {achievements?.badges
                  .filter((b) => b.unlocked)
                  .slice(0, 3)
                  .map((b) => b.title)
                  .join(' · ') || 'Complete your first diagnostic or module to earn a badge'}
              </span>
              <Link
                to="/student/achievements"
                className="text-xs font-medium text-[#526BFF] hover:underline whitespace-nowrap"
              >
                View All Badges
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
