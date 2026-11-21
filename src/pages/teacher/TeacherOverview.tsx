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
import { apiFetch } from '../../lib/api';
import { TeacherOverviewPayload } from '../../../shared/types';

export function TeacherOverview() {
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
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <AppIcon size={32} variant="dark" />
            <span>Loading EDVANTA classroom analytics...</span>
          </div>
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
      <AppShell title="Classroom Overview">
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Overview unavailable.'}</span>
        </div>
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
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Total Students</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827] mt-2">
              {data.totalStudents}
            </p>
            <p className="text-xs text-slate-500 mt-1">{data.className}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Average Class Mastery</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#526BFF] mt-2">
              {data.averageClassMastery}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Across 8 Electricity concepts</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Average Accuracy</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827] mt-2">
              {data.averageAccuracy}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {data.totalAttemptsLogged} total responses logged
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Top Focus Concept</p>
            <p className="font-display text-lg font-bold text-[#DC2626] mt-2 truncate">
              {data.difficultConcepts[0]?.conceptName ?? '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {data.difficultConcepts[0]
                ? `${data.difficultConcepts[0].averageMastery}% avg mastery`
                : 'No data'}
            </p>
          </div>
        </section>

        {/* Class Concept Chart & Trend */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#101827]">
                  Concept-Wise Class Mastery
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identify syllabus concepts requiring additional classroom instruction
                </p>
              </div>
              <Link to="/teacher/concepts" className="text-xs font-medium text-[#526BFF] hover:underline">
                Detailed Breakdown
              </Link>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="averageMastery" name="Class Avg Mastery %" fill="#526BFF" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#101827]">
              Class Improvement Over Time
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Daily cohort mastery &amp; response accuracy
            </p>

            {data.recentTrend.length === 0 ? (
              <p className="text-sm text-slate-500 mt-10">No trend points recorded yet.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.recentTrend} margin={{ top: 8, right: 12, left: -18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="classMastery"
                      name="Class Mastery %"
                      stroke="#526BFF"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy %"
                      stroke="#16A34A"
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

        {/* Difficult Concepts & Common Misconceptions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#101827]">
              Most Difficult Concepts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ranked lowest to highest class average</p>

            <div className="mt-4 divide-y divide-slate-100">
              {data.difficultConcepts.slice(0, 5).map((c) => (
                <div key={c.conceptId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#101827]">{c.conceptName}</p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {c.weakStudentCount} weak students · {c.accuracyRate}% accuracy
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      c.averageMastery < 50 ? 'text-[#DC2626]' : 'text-[#D97706]'
                    }`}
                  >
                    {c.averageMastery}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#101827]">
                  Most Common Misconceptions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted from student written explanations
                </p>
              </div>
              <Link to="/teacher/misconceptions" className="text-xs font-medium text-[#526BFF] hover:underline">
                View All
              </Link>
            </div>

            {data.commonMisconceptions.length === 0 ? (
              <p className="text-sm text-slate-500 mt-4">No class-wide misconceptions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.commonMisconceptions.slice(0, 4).map((m, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#526BFF]">{m.conceptName}</span>
                      <span className="font-mono tabular-nums text-[#DC2626] font-medium">
                        {m.occurrences} {m.occurrences === 1 ? 'occurrence' : 'occurrences'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#101827]">{m.misconceptionTitle}</p>
                    <p className="text-xs text-slate-600 italic">
                      Sample reasoning: &ldquo;{m.exampleReasoning}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Link to Student Progress */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#101827]">Inspect Individual Student Histories</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Drill into any student&apos;s concept mastery, written reasoning, and scheduled revisions.
            </p>
          </div>
          <Link
            to="/teacher/students"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#101827] hover:bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap"
          >
            Open Student Roster
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
