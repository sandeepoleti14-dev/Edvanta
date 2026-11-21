import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { RevisionStatusText } from '../../components/StatusIndicator';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCompanion } from '../../context/CompanionContext';
import { AchievementBadge, RevisionTask } from '../../../shared/types';

export function RevisionPlannerPage() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { triggerReaction } = useCompanion();
  const [revisions, setRevisions] = useState<RevisionTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'due' | 'upcoming' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<{ revisions: RevisionTask[] }>('/api/student/revisions');
        if (active) setRevisions(res.revisions);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load revision planner.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleMarkCompleted = async (id: number) => {
    setCompletingId(id);
    try {
      const res = await apiFetch<{
        revisions: RevisionTask[];
        newlyUnlockedBadges?: AchievementBadge[];
        streakDays?: number;
      }>(`/api/student/revisions/${id}/complete`, {
        method: 'POST',
      });
      setRevisions(res.revisions);
      if (user && typeof res.streakDays === 'number') {
        updateLocalUser({ ...user, streakDays: res.streakDays });
      }
      if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
        const names = res.newlyUnlockedBadges.map((b) => b.title).join(', ');
        showToast(`Revision complete! Badge unlocked: ${names}`, 'success');
        triggerReaction('celebrating', `Revision logged & unlocked ${names}!`, 4400);
      } else {
        showToast('Revision marked complete and next review scheduled', 'success');
        triggerReaction('celebrating', 'Revision checked off! Your retention interval just expanded.', 3600);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update revision task.', 'error');
    } finally {
      setCompletingId(null);
    }
  };

  const filtered = revisions.filter((r) => (filter === 'all' ? true : r.status === filter));
  const dueCount = revisions.filter((r) => r.status === 'due').length;
  const upcomingCount = revisions.filter((r) => r.status === 'upcoming').length;
  const completedCount = revisions.filter((r) => r.status === 'completed').length;

  return (
    <AppShell title="Revision Planner">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#101827]">
              Spaced Repetition Schedule
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Weak concepts and diagnosed misconceptions are queued earlier; mastered topics expand up to 14-day
              intervals.
            </p>
          </div>
          <div className="flex items-center gap-5 shrink-0 font-mono text-sm tabular-nums">
            <div>
              <span className="text-[#DC2626] font-semibold">{dueCount}</span>{' '}
              <span className="text-slate-500 text-xs font-sans">Due</span>
            </div>
            <div>
              <span className="text-[#526BFF] font-semibold">{upcomingCount}</span>{' '}
              <span className="text-slate-500 text-xs font-sans">Upcoming</span>
            </div>
            <div>
              <span className="text-[#16A34A] font-semibold">{completedCount}</span>{' '}
              <span className="text-slate-500 text-xs font-sans">Completed</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg w-fit">
          {(
            [
              { key: 'all', label: 'All Tasks' },
              { key: 'due', label: 'Due Now' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-[#101827] text-white'
                  : 'text-slate-600 hover:text-[#101827] hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-xl bg-white border border-slate-200" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <CalendarClock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-[#101827]">No revision tasks in this view</p>
            <p className="text-xs text-slate-500 mt-1">
              Complete diagnostic or adaptive practice questions to generate spaced-repetition intervals.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display text-base font-semibold text-[#101827]">
                      {rev.conceptName}
                    </h3>
                    <RevisionStatusText status={rev.status} />
                    <span className="text-xs text-slate-400" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono text-xs tabular-nums text-slate-600">
                      Mastery {rev.masteryScore}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{rev.reason}</p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    Scheduled: {new Date(rev.scheduledFor).toLocaleDateString()} · Interval:{' '}
                    {rev.intervalDays}d · Cycle #{rev.repetitionCount + 1}
                    {rev.completedAt
                      ? ` · Completed ${new Date(rev.completedAt).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>

                {rev.status !== 'completed' && (
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link
                      to={`/student/practice?conceptId=${rev.conceptId}&revisionId=${rev.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-4 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap"
                    >
                      Practice Review
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      disabled={completingId === rev.id}
                      onClick={() => handleMarkCompleted(rev.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-medium text-[#101827] transition-colors disabled:opacity-60 whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" aria-hidden="true" />
                      {completingId === rev.id ? 'Updating...' : 'Mark Completed'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
