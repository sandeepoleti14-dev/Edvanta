import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { RevisionStatusText } from '../../components/StatusIndicator';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
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
        showToast(`Revision complete! Badge unlocked: ${names}`, 'xp');
        triggerReaction('achievement', `Revision logged & unlocked ${names}!`, 4400);
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
        <SurfaceCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Spaced Repetition Schedule
            </h2>
            <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1">
              Weak concepts and diagnosed misconceptions are queued earlier; mastered topics expand up to 14-day
              intervals.
            </p>
          </div>
          <div className="flex items-center gap-5 shrink-0 font-mono text-sm tabular-nums">
            <div>
              <span className="text-[#E5484D] dark:text-[#F87171] font-semibold">{dueCount}</span>{' '}
              <span className="text-[#6E7696] dark:text-[#8892B5] text-xs font-sans">Due</span>
            </div>
            <div>
              <span className="text-[#477BFF] dark:text-[#759EFF] font-semibold">{upcomingCount}</span>{' '}
              <span className="text-[#6E7696] dark:text-[#8892B5] text-xs font-sans">Upcoming</span>
            </div>
            <div>
              <span className="text-[#15996C] dark:text-[#27C991] font-semibold">{completedCount}</span>{' '}
              <span className="text-[#6E7696] dark:text-[#8892B5] text-xs font-sans">Completed</span>
            </div>
          </div>
        </SurfaceCard>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] rounded-xl w-fit">
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-[#7055F7] text-white'
                  : 'text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white hover:bg-[#EEF1FA] dark:hover:bg-[#212640]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]" />
            ))}
          </div>
        ) : error ? (
          <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </SurfaceCard>
        ) : filtered.length === 0 ? (
          <SurfaceCard className="p-10 text-center">
            <CalendarClock className="h-8 w-8 text-[#6E7696] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF]">No revision tasks in this view</p>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">
              Complete diagnostic or adaptive practice questions to generate spaced-repetition intervals.
            </p>
          </SurfaceCard>
        ) : (
          <SurfaceCard className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      {rev.conceptName}
                    </h3>
                    <RevisionStatusText status={rev.status} />
                    <span className="text-xs text-[#6E7696]" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono text-xs tabular-nums text-[#4E5674] dark:text-[#B4BDD9]">
                      Mastery {rev.masteryScore}%
                    </span>
                  </div>
                  <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9]">{rev.reason}</p>
                  <p className="text-xs text-[#6E7696] dark:text-[#8892B5] font-mono tabular-nums">
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
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                    >
                      Practice Review
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      disabled={completingId === rev.id}
                      onClick={() => handleMarkCompleted(rev.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3.5 py-2 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors disabled:opacity-60 whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#27C991]" aria-hidden="true" />
                      {completingId === rev.id ? 'Updating...' : 'Mark Completed'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </SurfaceCard>
        )}
      </div>
    </AppShell>
  );
}
