import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Flame,
  Lock,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { AchievementCategory, AchievementsPayload } from '../../../shared/types';

const CATEGORY_LABELS: Record<'all' | AchievementCategory, string> = {
  all: 'All Badges',
  streak: 'Daily Streaks',
  mastery: 'Concept Mastery',
  curriculum: 'Syllabus Modules',
  consistency: 'Consistency',
};

function BadgeIcon({ category, unlocked }: { category: AchievementCategory; unlocked: boolean }) {
  const cls = `h-5 w-5 ${unlocked ? 'text-[#526BFF]' : 'text-slate-400'}`;
  if (category === 'streak') return <Flame className={`h-5 w-5 ${unlocked ? 'text-[#D97706]' : 'text-slate-400'}`} />;
  if (category === 'mastery') return <Trophy className={cls} />;
  if (category === 'curriculum') return <BookOpenCheck className={cls} />;
  return <Target className={cls} />;
}

export function AchievementsPage() {
  const [data, setData] = useState<AchievementsPayload | null>(null);
  const [filter, setFilter] = useState<'all' | AchievementCategory>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<AchievementsPayload>('/api/student/achievements');
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load achievements.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <AppShell title="Streaks & Achievements">
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-xl bg-white border border-slate-200" />
            ))}
          </div>
          <div className="h-72 rounded-xl bg-white border border-slate-200" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Streaks & Achievements">
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Achievements unavailable.'}</span>
        </div>
      </AppShell>
    );
  }

  const filtered = data.badges.filter((b) => (filter === 'all' ? true : b.category === filter));

  return (
    <AppShell title="Streaks & Achievements">
      <div className="space-y-6">
        {/* Streak & XP Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Active Study Streak</p>
            <div className="flex items-center gap-2 mt-2">
              <Flame className="h-6 w-6 text-[#D97706]" aria-hidden="true" />
              <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827]">
                {data.streakDays}d
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">Updates automatically on daily practice or module completion</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Total Mastery XP</p>
            <div className="flex items-center gap-2 mt-2">
              <Sparkles className="h-6 w-6 text-[#526BFF]" aria-hidden="true" />
              <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827]">
                {data.totalXp} XP
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">Earned from unlocked Electricity milestones</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Badges Unlocked</p>
            <div className="flex items-center gap-2 mt-2">
              <Award className="h-6 w-6 text-[#16A34A]" aria-hidden="true" />
              <p className="font-mono text-3xl font-semibold tabular-nums text-[#101827]">
                {data.unlockedCount}/{data.totalCount}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">Complete modules and practice to unlock remaining badges</p>
          </div>
        </section>

        {/* Category Filter & Quick Action */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            {(Object.keys(CATEGORY_LABELS) as Array<'all' | AchievementCategory>).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filter === cat
                    ? 'bg-[#101827] text-white'
                    : 'text-slate-600 hover:text-[#101827] hover:bg-slate-50'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <Link to="/student/modules" className="text-[#526BFF] hover:underline">
              Explore Learning Modules
            </Link>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <Link to="/student/practice" className="text-[#526BFF] hover:underline">
              Start Practice Drill
            </Link>
          </div>
        </section>

        {/* Badge Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((badge) => {
            const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100));
            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                  badge.unlocked
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200/80 bg-white/75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${
                        badge.unlocked ? 'border-[#526BFF]/30 bg-[#526BFF]/10' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <BadgeIcon category={badge.category} unlocked={badge.unlocked} />
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#526BFF]">
                        +{badge.xpReward} XP
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {CATEGORY_LABELS[badge.category]}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-base font-semibold text-[#101827]">
                        {badge.title}
                      </h3>
                      {badge.unlocked ? (
                        <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" aria-label="Unlocked" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-label="Locked" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{badge.description}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {badge.unlocked && badge.unlockedAt
                        ? `Unlocked ${new Date(badge.unlockedAt).toLocaleDateString()}`
                        : 'Progress'}
                    </span>
                    <span className="font-mono tabular-nums font-medium text-[#101827]">
                      {badge.progress}/{badge.target}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${badge.unlocked ? 'bg-[#16A34A]' : 'bg-[#526BFF]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
