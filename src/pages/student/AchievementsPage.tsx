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
  X,
  Zap,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ByteMascotSvg } from '../../components/StudyCompanion';
import { ProgressBar, SurfaceCard } from '../../components/ui/ThemePrimitives';
import { useCompanion } from '../../context/CompanionContext';
import { apiFetch } from '../../lib/api';
import { AchievementBadge, AchievementCategory, AchievementsPayload } from '../../../shared/types';

const CATEGORY_LABELS: Record<'all' | AchievementCategory, string> = {
  all: 'All Badges',
  streak: 'Daily Streaks',
  mastery: 'Concept Mastery',
  curriculum: 'Syllabus Modules',
  consistency: 'Consistency',
};

function BadgeIcon({ category, unlocked }: { category: AchievementCategory; unlocked: boolean }) {
  const muted = 'text-[#6E7696] dark:text-[#8892B5]';
  if (category === 'streak') {
    return <Flame className={`h-5 w-5 ${unlocked ? 'text-[#F6B94A]' : muted}`} />;
  }
  if (category === 'mastery') {
    return <Trophy className={`h-5 w-5 ${unlocked ? 'text-[#7055F7] dark:text-[#A493FF]' : muted}`} />;
  }
  if (category === 'curriculum') {
    return <BookOpenCheck className={`h-5 w-5 ${unlocked ? 'text-[#35C9D8]' : muted}`} />;
  }
  return <Target className={`h-5 w-5 ${unlocked ? 'text-[#27C991]' : muted}`} />;
}

export function AchievementsPage() {
  const { setCompanionTier } = useCompanion();
  const [data, setData] = useState<AchievementsPayload | null>(null);
  const [filter, setFilter] = useState<'all' | AchievementCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<AchievementsPayload>('/api/student/achievements');
        if (active) {
          setData(res);
          if (res.gamification?.companionTier) {
            setCompanionTier(res.gamification.companionTier);
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load achievements.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [setCompanionTier]);

  useEffect(() => {
    if (!selectedBadge) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBadge(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBadge]);

  if (loading) {
    return (
      <AppShell title="Streaks & Achievements">
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]"
              />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150]" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Streaks & Achievements">
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Achievements unavailable.'}</span>
        </SurfaceCard>
      </AppShell>
    );
  }

  const gamification = data.gamification;
  const filtered = data.badges.filter((b) => (filter === 'all' ? true : b.category === filter));
  const companionTier = gamification?.companionTier ?? {
    tier: 1,
    title: 'Code Scout',
    unlockHint: 'Reach Level 2 (200 XP) to evolve Byte to Code Guardian.',
  };

  return (
    <AppShell title="Streaks & Achievements">
      <div className="space-y-6">
        {/* Top Row: Learner Level & XP + Active Streak Calendar + Byte Evolution Showcase */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Learner Level & Total XP */}
          <SurfaceCard className="lg:col-span-4 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  Learner Level &amp; XP
                </p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="font-display text-3xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                    Lv {gamification?.level ?? 1}
                  </span>
                  <span className="text-sm font-medium text-[#4E5674] dark:text-[#B4BDD9]">
                    {gamification?.levelTitle ?? 'Spark Apprentice'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-xl font-bold tabular-nums text-[#F6B94A]">
                  {gamification?.totalXp ?? data.totalXp} XP
                </p>
                <p className="text-[11px] text-[#6E7696] dark:text-[#8892B5] tabular-nums">
                  {gamification ? `${gamification.xpRemaining} XP to next level` : 'Verified milestones'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <ProgressBar
                value={gamification?.xpInLevel ?? 0}
                max={gamification?.xpForNextLevel ?? 200}
                tone="primary"
                label="XP progress to next learner level"
              />
              <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] font-friendly">
                Earn XP from accurate answers, mastered concepts, completed modules, flashcards, and badges.
              </p>
            </div>
          </SurfaceCard>

          {/* Study Streak + 7-Day UTC Activity Calendar */}
          <SurfaceCard className="lg:col-span-4 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#B46E00] dark:text-[#F6B94A] flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  Daily Study Streak
                </p>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <span className="font-display text-3xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                    {gamification?.streakDays ?? data.streakDays} Days
                  </span>
                  <span className="text-xs text-[#6E7696] dark:text-[#8892B5] tabular-nums">
                    Longest: {gamification?.longestStreakDays ?? data.streakDays}d
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[#15996C] dark:text-[#27C991]">
                {gamification?.dailyGoalCompleted ?? 0}/{gamification?.dailyGoalTarget ?? 5} today
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5" aria-label="7-day study activity calendar">
              {(gamification?.weeklyActivity ?? []).map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} learning action(s)`}
                  className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 border transition-colors ${
                    day.active
                      ? 'border-[#27C991]/45 bg-[#27C991]/12 text-[#15996C] dark:text-[#27C991]'
                      : day.isToday
                      ? 'border-[#7055F7]/50 bg-[#7055F7]/8 text-[#7055F7] dark:text-[#A493FF]'
                      : 'border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/50 dark:bg-[#212640]/50 text-[#6E7696] dark:text-[#8892B5]'
                  }`}
                >
                  <span className="text-[10px] font-medium">{day.dayLabel}</span>
                  <span className="font-mono text-xs font-bold tabular-nums mt-0.5">
                    {day.count > 0 ? day.count : '·'}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          {/* Byte Companion Evolution Tier & Badges Count */}
          <SurfaceCard className="lg:col-span-4 p-5 flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[#EEF1FA] dark:bg-[#212640] border border-[#E2E6F3] dark:border-[#2B3150] flex items-center justify-center shrink-0">
              <ByteMascotSvg mood="achievement" size={50} tier={companionTier.tier} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#35C9D8]">
                  Byte Tier {companionTier.tier} · {companionTier.title}
                </p>
                <span className="font-mono text-xs font-bold tabular-nums text-[#15996C] dark:text-[#27C991] shrink-0">
                  {data.unlockedCount}/{data.totalCount} Badges
                </span>
              </div>
              <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed font-friendly">
                {companionTier.unlockHint}
              </p>
            </div>
          </SurfaceCard>
        </section>

        {/* Active Learning Quests */}
        {gamification && gamification.quests.length > 0 && (
          <SurfaceCard className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#35C9D8]" aria-hidden="true" />
                  <span>Learning Quests &amp; Milestones</span>
                </h2>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Tracked in real time from your persisted diagnostic, practice, module, and revision actions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gamification.quests.map((q) => (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-4 space-y-2.5 transition-colors ${
                    q.completed
                      ? 'border-[#27C991]/40 bg-[#27C991]/8'
                      : 'border-[#E2E6F3] dark:border-[#2B3150] bg-[#F6F7FC]/60 dark:bg-[#111322]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                          {q.title}
                        </h3>
                        {q.completed && (
                          <CheckCircle2 className="h-4 w-4 text-[#27C991] shrink-0" aria-label="Quest completed" />
                        )}
                      </div>
                      <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-0.5">{q.description}</p>
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums text-[#F6B94A] shrink-0">
                      +{q.xpReward} XP
                    </span>
                  </div>

                  <div className="space-y-1">
                    <ProgressBar
                      value={q.progress}
                      max={q.target}
                      tone={q.completed ? 'success' : 'secondary'}
                      heightClass="h-1.5"
                      label={`${q.title} progress`}
                    />
                    <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#6E7696] dark:text-[#8892B5]">
                      <span>{q.completed ? 'Completed' : 'In progress'}</span>
                      <span>
                        {q.progress}/{q.target}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        )}

        {/* Category Filter & Quick Action */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] rounded-xl">
            {(Object.keys(CATEGORY_LABELS) as Array<'all' | AchievementCategory>).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filter === cat
                    ? 'bg-[#7055F7] text-white'
                    : 'text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white hover:bg-[#EEF1FA] dark:hover:bg-[#212640]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link to="/student/modules" className="text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap">
              Explore Learning Modules
            </Link>
            <span className="text-[#CBD3E8] dark:text-[#3C456D]" aria-hidden="true">·</span>
            <Link to="/student/practice" className="text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap">
              Start Practice Drill
            </Link>
          </div>
        </section>

        {/* Badge Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((badge) => {
            const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100));
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => setSelectedBadge(badge)}
                className={`text-left rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                  badge.unlocked
                    ? 'border-[#F6B94A]/45 bg-white dark:bg-[#181B2E] shadow-[var(--shadow-card)] hover:border-[#F6B94A]'
                    : 'border-[#E2E6F3] dark:border-[#2B3150] bg-white/80 dark:bg-[#181B2E]/70 hover:border-[#7055F7]/40'
                }`}
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${
                        badge.unlocked
                          ? 'border-[#F6B94A]/40 bg-[#F6B94A]/12'
                          : 'border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/70 dark:bg-[#212640]'
                      }`}
                    >
                      <BadgeIcon category={badge.category} unlocked={badge.unlocked} />
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono text-xs font-bold tabular-nums ${
                          badge.unlocked ? 'text-[#B46E00] dark:text-[#F6B94A]' : 'text-[#7055F7] dark:text-[#A493FF]'
                        }`}
                      >
                        +{badge.xpReward} XP
                      </span>
                      <p className="text-[11px] text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                        {CATEGORY_LABELS[badge.category]}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                        {badge.title}
                      </h3>
                      {badge.unlocked ? (
                        <CheckCircle2 className="h-4 w-4 text-[#27C991] shrink-0" aria-label="Unlocked" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-[#6E7696] dark:text-[#8892B5] shrink-0" aria-label="Locked" />
                      )}
                    </div>
                    <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150] w-full">
                  <div className="flex items-center justify-between text-xs text-[#6E7696] dark:text-[#8892B5]">
                    <span>
                      {badge.unlocked && badge.unlockedAt
                        ? `Unlocked ${new Date(badge.unlockedAt).toLocaleDateString()}`
                        : 'Progress'}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      {badge.progress}/{badge.target}
                    </span>
                  </div>
                  <ProgressBar
                    value={pct}
                    max={100}
                    tone={badge.unlocked ? 'success' : 'primary'}
                    heightClass="h-1.5"
                    label={`${badge.title} progress`}
                  />
                </div>
              </button>
            );
          })}
        </section>

        {/* Badge Detail & Celebration Modal */}
        {selectedBadge && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-modal-title"
            onClick={() => setSelectedBadge(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-6 shadow-[var(--shadow-float)] space-y-4 edvanta-xp-pop"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-[#EEF1FA] dark:bg-[#212640] border border-[#E2E6F3] dark:border-[#2B3150] flex items-center justify-center shrink-0">
                    <ByteMascotSvg
                      mood={selectedBadge.unlocked ? 'achievement' : 'encouraging'}
                      size={40}
                      tier={companionTier.tier}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                      {CATEGORY_LABELS[selectedBadge.category]} · +{selectedBadge.xpReward} XP
                    </p>
                    <h3
                      id="badge-modal-title"
                      className="font-display text-lg font-bold text-[#14172B] dark:text-[#F4F6FF]"
                    >
                      {selectedBadge.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  aria-label="Close badge details"
                  className="rounded-lg p-1.5 text-[#6E7696] hover:text-[#14172B] dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed font-friendly">
                {selectedBadge.description}
              </p>

              <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#4E5674] dark:text-[#B4BDD9]">
                    {selectedBadge.unlocked ? 'Milestone Status' : 'Current Progress'}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                    {selectedBadge.progress}/{selectedBadge.target}
                  </span>
                </div>
                <ProgressBar
                  value={selectedBadge.progress}
                  max={selectedBadge.target}
                  tone={selectedBadge.unlocked ? 'success' : 'gold'}
                />
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] pt-1 font-friendly">
                  {selectedBadge.unlocked && selectedBadge.unlockedAt
                    ? `Unlocked on ${new Date(selectedBadge.unlockedAt).toLocaleDateString()}. Awesome consistency!`
                    : `Complete ${Math.max(1, selectedBadge.target - selectedBadge.progress)} more step(s) to unlock +${selectedBadge.xpReward} XP.`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {!selectedBadge.unlocked && (
                  <Link
                    to="/student/practice"
                    onClick={() => setSelectedBadge(null)}
                    className="rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    Go Practice
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] px-4 py-2 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
