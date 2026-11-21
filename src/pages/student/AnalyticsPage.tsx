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
          <div className="h-64 rounded-xl bg-white border border-slate-200" />
          <div className="h-64 rounded-xl bg-white border border-slate-200" />
        </div>
      ) : error || !data ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Analytics unavailable.'}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-semibold text-[#101827]">
                Concept Mastery Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Persisted mastery percentage across all 8 Electricity concepts
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
                    <Bar dataKey="mastery" name="Mastery %" fill="#526BFF" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-semibold text-[#101827]">
                Accuracy by Difficulty Tier
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                How your responses perform across adaptive tiers
              </p>

              {data.difficultyBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500 mt-8">No attempts recorded yet.</p>
              ) : (
                <div className="space-y-4 mt-4">
                  {data.difficultyBreakdown.map((d) => (
                    <div key={d.difficulty} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium text-[#101827]">{d.difficulty}</span>
                        <span className="font-mono text-xs tabular-nums text-slate-600">
                          {d.correct}/{d.attempts} correct ({d.accuracy}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#8B6CFF]" style={{ width: `${d.accuracy}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logged Misconceptions */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#101827]">
              Misconception History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Conceptual errors diagnosed from your written reasoning
            </p>

            {data.misconceptions.length === 0 ? (
              <p className="text-sm text-slate-500 mt-4">No conceptual misconceptions logged.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {data.misconceptions.map((m) => (
                  <div key={m.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        {m.resolved ? (
                          <span className="inline-flex items-center gap-1 text-[#16A34A]">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#DC2626]">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            Active Focus
                          </span>
                        )}
                        <span className="text-slate-400">·</span>
                        <span className="text-[#526BFF]">{m.conceptName}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-display text-sm font-semibold text-[#101827]">
                      {m.misconceptionTitle}
                    </p>
                    <p className="text-xs text-slate-600">
                      Your reasoning: <span className="italic">&ldquo;{m.studentReasoning}&rdquo;</span>
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Correction: {m.correctiveExplanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
