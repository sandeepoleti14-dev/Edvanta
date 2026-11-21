import { useEffect, useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
import { apiFetch, getAuthToken } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { TeacherOverviewPayload } from '../../../shared/types';

export function TeacherReports() {
  const { showToast } = useToast();
  const [data, setData] = useState<TeacherOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<TeacherOverviewPayload>('/api/teacher/overview');
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load reports.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      const headers = new Headers();
      const token = getAuthToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const res = await fetch('/api/teacher/reports/csv', {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to generate CSV export.');
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edvanta-java-dsa-report.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Class mastery CSV downloaded', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppShell title="Reports">
      {loading ? (
        <div className="h-64 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      ) : error || !data ? (
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Unavailable'}</span>
        </SurfaceCard>
      ) : (
        <div className="space-y-6">
          <SurfaceCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Classroom Intervention &amp; Mastery Export
              </h2>
              <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                Download a structured CSV matrix of every student&apos;s concept-level mastery, status, and accuracy.
              </p>
            </div>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 shrink-0 whitespace-nowrap"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloading ? 'Preparing CSV...' : 'Download CSV Report'}
            </button>
          </SurfaceCard>

          <SurfaceCard className="p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Suggested Classroom Remediation Plan
            </h3>
            <div className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
              {data.difficultConcepts.slice(0, 3).map((c, idx) => (
                <div
                  key={c.conceptId}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      0{idx + 1}. Reteach {c.conceptName}
                    </p>
                    <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-0.5">
                      {c.weakStudentCount} students are below 50% mastery (class accuracy: {c.accuracyRate}%).
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[#E5484D] dark:text-[#F87171] shrink-0">
                    {c.averageMastery}% avg
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
