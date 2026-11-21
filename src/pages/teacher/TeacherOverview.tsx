import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'recharts';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { AppIcon } from '../../components/brand/EdvantaBrand';
import { SurfaceCard, useChartTheme } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { TeacherOverviewPayload } from '../../../shared/types';

export function TeacherOverview() {
  const chartTheme = useChartTheme();
  const [data, setData] = useState<TeacherOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<TeacherOverviewPayload>('/api/teacher/overview');
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load teacher overview.');
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
      <AppShell title="Classroom Overview">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm text-[#4E5674] dark:text-[#B4BDD9]">
            <AppIcon size={32} variant="auto" />
            <span>Loading EDVANTA classroom analytics...</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-24 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]"
              />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Classroom Overview">
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Overview unavailable.'}</span>
        </SurfaceCard>
      </AppShell>
    );
  }

  const chartData = data.conceptPerformance.map((c) => ({
    name: c.conceptName.replace(' & Resistivity', '').replace(' & Heating', ''),
    averageMastery: c.averageMastery,
  }));

  return (
    <AppShell title="Classroom Overview">
      <div className="space-y-6">
        {/* Top Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Total Students</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-2">
              {data.totalStudents}
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">{data.className}</p>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Average Class Mastery</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#7055F7] dark:text-[#A493FF] mt-2">
              {data.averageClassMastery}%
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">Across 8 Java DSA topics</p>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Average Accuracy</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-2">
              {data.averageAccuracy}%
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1">
              {data.totalAttemptsLogged} total responses logged
            </p>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Top Focus Concept</p>
            <p className="font-display text-lg font-bold text-[#E5484D] dark:text-[#F87171] mt-2 truncate">
              {data.difficultConcepts[0]?.conceptName ?? '—'}
            </p>
            <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1 tabular-nums">
              {data.difficultConcepts[0]
                ? `${data.difficultConcepts[0].averageMastery}% avg mastery`
                : 'No data'}
            </p>
          </SurfaceCard>
        </section>

        {/* Class Concept Chart & Trend */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfaceCard className="lg:col-span-7 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Concept-Wise Class Mastery
                </h2>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Identify syllabus concepts requiring additional classroom instruction
                </p>
              </div>
              <Link
                to="/teacher/concepts"
                className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
              >
                Detailed Breakdown
              </Link>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: chartTheme.tickFill }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartTheme.tickFill }} />
                  <Tooltip
                    cursor={{ fill: chartTheme.isDark ? 'rgba(112, 85, 247, 0.14)' : 'rgba(112, 85, 247, 0.08)' }}
                    contentStyle={{
                      borderRadius: 12,
                      backgroundColor: chartTheme.tooltipBg,
                      borderColor: chartTheme.tooltipBorder,
                      color: chartTheme.tooltipText,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="averageMastery"
                    name="Class Avg Mastery %"
                    fill={chartTheme.primary}
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-5 p-6">
            <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Class Improvement Over Time
            </h2>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5 mb-4">
              Daily cohort mastery &amp; response accuracy
            </p>

            {data.recentTrend.length === 0 ? (
              <p className="text-sm text-[#6E7696] dark:text-[#8892B5] mt-10">No trend points recorded yet.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.recentTrend} margin={{ top: 8, right: 12, left: -18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.tickFill }} />
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
                      dataKey="classMastery"
                      name="Class Mastery %"
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

        {/* Difficult Concepts & Common Misconceptions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfaceCard className="lg:col-span-5 p-6">
            <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Most Difficult Concepts
            </h2>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
              Ranked lowest to highest class average
            </p>

            <div className="mt-4 divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
              {data.difficultConcepts.slice(0, 5).map((c) => (
                <div key={c.conceptId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF]">{c.conceptName}</p>
                    <p className="text-xs text-[#6E7696] dark:text-[#8892B5] tabular-nums">
                      {c.weakStudentCount} weak students · {c.accuracyRate}% accuracy
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      c.averageMastery < 50
                        ? 'text-[#E5484D] dark:text-[#F87171]'
                        : 'text-[#B46E00] dark:text-[#F6B94A]'
                    }`}
                  >
                    {c.averageMastery}%
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-7 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Most Common Misconceptions
                </h2>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Extracted from student written explanations
                </p>
              </div>
              <Link
                to="/teacher/misconceptions"
                className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
              >
                View All
              </Link>
            </div>

            {data.commonMisconceptions.length === 0 ? (
              <p className="text-sm text-[#6E7696] dark:text-[#8892B5] mt-4">
                No class-wide misconceptions recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
                {data.commonMisconceptions.slice(0, 4).map((m, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#7055F7] dark:text-[#A493FF]">{m.conceptName}</span>
                      <span className="font-mono tabular-nums text-[#E5484D] dark:text-[#F87171] font-semibold">
                        {m.occurrences} {m.occurrences === 1 ? 'occurrence' : 'occurrences'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      {m.misconceptionTitle}
                    </p>
                    <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] italic">
                      Sample reasoning: &ldquo;{m.exampleReasoning}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </section>

        {/* Quick Link to Student Progress */}
        <SurfaceCard className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Inspect Individual Student Histories
            </p>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
              Drill into any student&apos;s concept mastery, written reasoning, and scheduled revisions.
            </p>
          </div>
          <Link
            to="/teacher/students"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
          >
            Open Student Roster
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
