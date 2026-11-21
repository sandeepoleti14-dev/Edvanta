import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { MasteryStatusText, masteryBarColor } from '../../components/StatusIndicator';
import { apiFetch } from '../../lib/api';
import { AttemptHistoryItem, LearnerConceptMastery } from '../../../shared/types';

export function StudentLearning() {
  const [concepts, setConcepts] = useState<LearnerConceptMastery[]>([]);
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<{
          conceptMasteries: LearnerConceptMastery[];
          recentAttempts: AttemptHistoryItem[];
        }>('/api/student/analytics');
        if (active) {
          setConcepts(res.conceptMasteries);
          setAttempts(res.recentAttempts);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load curriculum data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="My Learning">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#101827]">
                  Class 10 Physics — Electricity Syllabus
                </h2>
                <p className="text-sm text-slate-600">
                  Track concept-level mastery and jump directly into targeted practice.
                </p>
              </div>
              <Link
                to="/student/concept-map"
                className="text-sm font-medium text-[#526BFF] hover:underline"
              >
                Open Dependency Graph →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {concepts.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-[#101827]">{c.name}</h3>
                        <p className="font-mono text-xs text-slate-500 mt-0.5">{c.keyFormula}</p>
                      </div>
                      <span className="font-mono text-lg font-semibold tabular-nums text-[#101827]">
                        {c.attemptCount === 0 ? '—' : `${c.masteryScore}%`}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{c.description}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${masteryBarColor(c.status)}`}
                        style={{ width: `${c.attemptCount === 0 ? 0 : c.masteryScore}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <MasteryStatusText status={c.status} />
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{c.attemptCount} attempts</span>
                      </div>
                      <Link
                        to={`/student/practice?conceptId=${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#526BFF] hover:underline"
                      >
                        Practice
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#101827]">Recent Practice &amp; Reasoning Log</h2>
            {attempts.length === 0 ? (
              <p className="text-sm text-slate-500 mt-4">
                No responses logged yet. Start the Diagnostic Test or Adaptive Practice to build your history.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {attempts.slice(0, 8).map((a) => (
                  <div key={a.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-medium text-[#101827]">{a.conceptName}</span>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className={a.isCorrect ? 'text-[#16A34A] font-medium' : 'text-[#DC2626] font-medium'}>
                          {a.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                        <span>·</span>
                        <span>
                          Mastery {a.masteryBefore}% → {a.masteryAfter}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#101827]">{a.questionText}</p>
                    {a.studentReasoning && (
                      <p className="text-xs text-slate-600">
                        Reasoning: <span className="italic">&ldquo;{a.studentReasoning}&rdquo;</span>
                      </p>
                    )}
                    {a.misconceptionTitle && (
                      <p className="text-xs font-medium text-[#DC2626]">
                        Detected misconception: {a.misconceptionTitle}
                      </p>
                    )}
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
