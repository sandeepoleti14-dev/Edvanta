import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ProgressBar, SurfaceCard, useChartTheme } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import {
  AttemptHistoryItem,
  Difficulty,
  LearnerConceptMastery,
  MisconceptionRecord,
} from '../../../shared/types';

interface AnalyticsResponse {
  conceptMasteries: LearnerConceptMastery[];
  recentAttempts: AttemptHistoryItem[];
  misconceptions: MisconceptionRecord[];
  difficultyBreakdown: Array<{
    difficulty: Difficulty;
    attempts: number;
    correct: number;
    accuracy: number;
  }>;
}

export function AnalyticsPage() {
  const chartTheme = useChartTheme();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<AnalyticsResponse>('/api/student/analytics');
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load analytics.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="Performance Analytics">
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]" />
          <div className="h-64 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]" />
        </div>
      ) : error || !data ? (
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Analytics unavailable.'}</span>
        </SurfaceCard>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SurfaceCard className="lg:col-span-7 p-6">
              <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Concept Mastery Breakdown
              </h2>
              <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5 mb-4">
                Persisted mastery percentage across all 8 Java DSA topics
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.conceptMasteries.map((c) => ({
                      name: c.name.replace(' & Resistivity', '').replace(' & Heating', ''),
                      mastery: c.attemptCount === 0 ? 0 : c.masteryScore,
                    }))}
                    margin={{ top: 8, right: 8, left: -18, bottom: 20 }}
                  >
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
                      dataKey="mastery"
                      name="Mastery %"
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
                Accuracy by Difficulty Tier
              </h2>
              <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5 mb-4">
                How your responses perform across adaptive tiers
              </p>

              {data.difficultyBreakdown.length === 0 ? (
                <p className="text-sm text-[#6E7696] dark:text-[#8892B5] mt-8">No attempts recorded yet.</p>
              ) : (
                <div className="space-y-4 mt-4">
                  {data.difficultyBreakdown.map((d) => (
                    <div key={d.difficulty} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium text-[#14172B] dark:text-[#F4F6FF]">
                          {d.difficulty}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-[#4E5674] dark:text-[#B4BDD9]">
                          {d.correct}/{d.attempts} correct ({d.accuracy}%)
                        </span>
                      </div>
                      <ProgressBar
                        value={d.accuracy}
                        max={100}
                        tone="secondary"
                        heightClass="h-2"
                        label={`${d.difficulty} tier accuracy`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>

          {/* Logged Misconceptions */}
          <SurfaceCard className="p-6">
            <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Misconception History
            </h2>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
              Conceptual errors diagnosed from your written reasoning
            </p>

            {data.misconceptions.length === 0 ? (
              <p className="text-sm text-[#6E7696] dark:text-[#8892B5] mt-4">
                No conceptual misconceptions logged.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
                {data.misconceptions.map((m) => (
                  <div key={m.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        {m.resolved ? (
                          <span className="inline-flex items-center gap-1 text-[#15996C] dark:text-[#27C991]">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#E5484D] dark:text-[#F87171]">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            Active Focus
                          </span>
                        )}
                        <span className="text-[#CBD3E8] dark:text-[#3C456D]">·</span>
                        <span className="text-[#7055F7] dark:text-[#A493FF]">{m.conceptName}</span>
                      </div>
                      <span className="font-mono text-xs text-[#6E7696] dark:text-[#8892B5] tabular-nums">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      {m.misconceptionTitle}
                    </p>
                    <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9]">
                      Your reasoning: <span className="italic">&ldquo;{m.studentReasoning}&rdquo;</span>
                    </p>
                    <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed">
                      Correction: {m.correctiveExplanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
