import { useEffect, useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
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
      link.download = 'adaptix-class10-electricity-report.csv';
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
        <div className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
      ) : error || !data ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Unavailable'}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#101827]">
                Classroom Intervention &amp; Mastery Export
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Download a structured CSV matrix of every student&apos;s concept-level mastery, status, and accuracy.
              </p>
            </div>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60 shrink-0 whitespace-nowrap"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloading ? 'Preparing CSV...' : 'Download CSV Report'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-[#101827]">
              Suggested Classroom Remediation Plan
            </h3>
            <div className="divide-y divide-slate-100">
              {data.difficultConcepts.slice(0, 3).map((c, idx) => (
                <div key={c.conceptId} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#101827]">
                      0{idx + 1}. Reteach {c.conceptName}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {c.weakStudentCount} students are below 50% mastery (class accuracy: {c.accuracyRate}%).
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[#DC2626] shrink-0">
                    {c.averageMastery}% avg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
