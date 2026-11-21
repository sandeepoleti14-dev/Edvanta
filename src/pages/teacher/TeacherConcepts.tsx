import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { TeacherOverviewPayload } from '../../../shared/types';

export function TeacherConcepts() {
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
        if (active) setError(err instanceof Error ? err.message : 'Unable to load concept analytics.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="Concept Analytics">
      {loading ? (
        <div className="h-80 rounded-xl bg-white border border-slate-200 animate-pulse" />
      ) : error || !data ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Unavailable'}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#101827]">
              Mastery Tier Distribution Across Cohort
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Number of students at Mastered, Developing, Weak, or Not Started per Electricity concept
            </p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.conceptPerformance.map((c) => ({
                    name: c.conceptName.replace(' & Resistivity', '').replace(' & Heating', ''),
                    Mastered: c.masteredCount,
                    Developing: c.developingCount,
                    Weak: c.weakCount,
                  }))}
                  margin={{ top: 10, right: 16, left: -16, bottom: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    angle={-16}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Mastered" stackId="a" fill="#16A34A" isAnimationActive={false} />
                  <Bar dataKey="Developing" stackId="a" fill="#D97706" isAnimationActive={false} />
                  <Bar dataKey="Weak" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-display text-base font-semibold text-[#101827]">
                Concept Readiness Table
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-3 px-4">Concept</th>
                    <th className="py-3 px-4 text-right">Class Avg Mastery</th>
                    <th className="py-3 px-4 text-right">Mastered</th>
                    <th className="py-3 px-4 text-right">Developing</th>
                    <th className="py-3 px-4 text-right">Weak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {data.conceptPerformance.map((c) => (
                    <tr key={c.conceptId}>
                      <td className="py-3 px-4 font-medium text-[#101827]">{c.conceptName}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#101827]">
                        {c.averageMastery}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#16A34A]">
                        {c.masteredCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#D97706]">
                        {c.developingCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#DC2626]">
                        {c.weakCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
