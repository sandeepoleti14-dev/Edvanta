import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { TeacherOverviewPayload } from '../../../shared/types';

export function TeacherMisconceptions() {
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
        if (active) setError(err instanceof Error ? err.message : 'Unable to load misconceptions.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="Classroom Misconceptions">
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Unavailable'}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-[#101827]">
              Detected Conceptual Gaps Across {data.className}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Patterns identified by analyzing students&apos; written reasoning during diagnostic and adaptive
              practice.
            </p>
          </div>

          {data.commonMisconceptions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No recurring misconceptions detected across the class yet.
            </div>
          ) : (
            <div className="space-y-4">
              {data.commonMisconceptions.map((m, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#526BFF]">
                      <AlertTriangle className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
                      <span>{m.conceptName}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#DC2626]">
                      {m.occurrences} {m.occurrences === 1 ? 'student case' : 'student cases'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#101827]">{m.misconceptionTitle}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5">
                      <p className="text-xs font-medium text-slate-500">Example Student Reasoning</p>
                      <p className="text-sm text-[#101827] italic mt-1">&ldquo;{m.exampleReasoning}&rdquo;</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50/60 border border-emerald-200 p-3.5">
                      <p className="text-xs font-medium text-[#16A34A]">Recommended Classroom Correction</p>
                      <p className="text-sm text-slate-700 mt-1">{m.correctiveExplanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
