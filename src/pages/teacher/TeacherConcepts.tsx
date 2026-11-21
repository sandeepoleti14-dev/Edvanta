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
import { SurfaceCard, useChartTheme } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { TeacherOverviewPayload } from '../../../shared/types';

export function TeacherConcepts() {
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
        <div className="h-80 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      ) : error || !data ? (
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Unavailable'}</span>
        </SurfaceCard>
      ) : (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Mastery Tier Distribution Across Cohort
            </h2>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5 mb-4">
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
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: chartTheme.tickFill }}
                    interval={0}
                    angle={-16}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTheme.tickFill }} />
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
                  <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.tickFill }} />
                  <Bar dataKey="Mastered" stackId="a" fill={chartTheme.success} isAnimationActive={false} />
                  <Bar dataKey="Developing" stackId="a" fill={chartTheme.gold} isAnimationActive={false} />
                  <Bar
                    dataKey="Weak"
                    stackId="a"
                    fill={chartTheme.danger}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <div className="p-5 border-b border-[#E2E6F3] dark:border-[#2B3150]">
              <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Concept Readiness Table
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">
                    <th className="py-3 px-4">Concept</th>
                    <th className="py-3 px-4 text-right">Class Avg Mastery</th>
                    <th className="py-3 px-4 text-right">Mastered</th>
                    <th className="py-3 px-4 text-right">Developing</th>
                    <th className="py-3 px-4 text-right">Weak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150] text-sm">
                  {data.conceptPerformance.map((c) => (
                    <tr key={c.conceptId}>
                      <td className="py-3 px-4 font-medium text-[#14172B] dark:text-[#F4F6FF]">
                        {c.conceptName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                        {c.averageMastery}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#15996C] dark:text-[#27C991]">
                        {c.masteredCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#B46E00] dark:text-[#F6B94A]">
                        {c.developingCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#E5484D] dark:text-[#F87171]">
                        {c.weakCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
