import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
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
            <div
              key={n}
              className="h-32 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]"
            />
          ))}
        </div>
      ) : error || !data ? (
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Unavailable'}</span>
        </SurfaceCard>
      ) : (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <h2 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Detected Conceptual Gaps Across {data.className}
            </h2>
            <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1">
              Patterns identified by analyzing students&apos; written reasoning during diagnostic and adaptive
              practice.
            </p>
          </SurfaceCard>

          {data.commonMisconceptions.length === 0 ? (
            <SurfaceCard className="p-8 text-center text-sm text-[#6E7696] dark:text-[#8892B5]">
              No recurring misconceptions detected across the class yet.
            </SurfaceCard>
          ) : (
            <div className="space-y-4">
              {data.commonMisconceptions.map((m, idx) => (
                <SurfaceCard key={idx} className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                      <AlertTriangle className="h-4 w-4 text-[#E5484D] dark:text-[#F87171]" aria-hidden="true" />
                      <span>{m.conceptName}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#E5484D] dark:text-[#F87171]">
                      {m.occurrences} {m.occurrences === 1 ? 'student case' : 'student cases'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#14172B] dark:text-[#F4F6FF]">
                    {m.misconceptionTitle}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl bg-[#EEF1FA]/70 dark:bg-[#212640] border border-[#E2E6F3] dark:border-[#2B3150] p-3.5">
                      <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">
                        Example Student Reasoning
                      </p>
                      <p className="text-sm text-[#14172B] dark:text-[#F4F6FF] italic mt-1">
                        &ldquo;{m.exampleReasoning}&rdquo;
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#27C991]/10 border border-[#27C991]/35 p-3.5">
                      <p className="text-xs font-semibold text-[#15996C] dark:text-[#27C991]">
                        Recommended Classroom Correction
                      </p>
                      <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1">{m.correctiveExplanation}</p>
                    </div>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
