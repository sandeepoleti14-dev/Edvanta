import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Compass,
  FlipHorizontal2,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ModuleSimulator } from '../../components/ModuleSimulator';
import { MasteryStatusText } from '../../components/StatusIndicator';
import { ProgressBar, SurfaceCard } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCompanion } from '../../context/CompanionContext';
import {
  AchievementBadge,
  AchievementsPayload,
  LearningModuleItem,
  StudentJourneyPayload,
} from '../../../shared/types';

type ModuleViewTab = 'reader' | 'journey' | 'offline';

export function LearningModulesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSlug = searchParams.get('conceptSlug');
  const requestedId = searchParams.get('conceptId');
  const initialTab = (searchParams.get('view') as ModuleViewTab | null) || 'reader';
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { triggerReaction, setActiveConceptName } = useCompanion();

  const [viewTab, setViewTab] = useState<ModuleViewTab>(
    initialTab === 'journey' || initialTab === 'offline' ? initialTab : 'reader'
  );
  const [modules, setModules] = useState<LearningModuleItem[]>([]);
  const [journey, setJourney] = useState<StudentJourneyPayload | null>(null);
  const [savedNoteIds, setSavedNoteIds] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [quickChoice, setQuickChoice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const offlineCacheKey = user ? `edvanta_offline_notes_${user.id}` : 'edvanta_offline_notes';
    (async () => {
      try {
        const [modRes, journeyRes] = await Promise.all([
          apiFetch<{ modules: LearningModuleItem[] }>('/api/student/modules'),
          apiFetch<StudentJourneyPayload>('/api/student/journey'),
        ]);
        if (active) {
          setModules(modRes.modules);
          setJourney(journeyRes);
          setSavedNoteIds(journeyRes.savedNoteConceptIds);
          try {
            const cachedModules = modRes.modules.filter((m) =>
              journeyRes.savedNoteConceptIds.includes(m.conceptId)
            );
            window.localStorage.setItem(offlineCacheKey, JSON.stringify(cachedModules));
          } catch {
            // ignore storage quota errors
          }
          const firstIncomplete = modRes.modules.findIndex((m) => !m.completed);
          if (firstIncomplete >= 0) {
            setSelectedIdx(firstIncomplete);
          }
        }
      } catch (err) {
        if (active) {
          try {
            const cachedRaw = window.localStorage.getItem(offlineCacheKey);
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw) as LearningModuleItem[];
              if (cached.length > 0) {
                setModules(cached);
                setSavedNoteIds(cached.map((c) => c.conceptId));
                setViewTab('offline');
                setLoading(false);
                return;
              }
            }
          } catch {
            // ignore cache fallback error
          }
          setError(err instanceof Error ? err.message : 'Unable to load syllabus modules.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      setActiveConceptName(undefined);
    };
  }, [setActiveConceptName, user]);

  useEffect(() => {
    if (modules.length === 0) return;
    if (requestedSlug) {
      const idx = modules.findIndex((m) => m.conceptSlug === requestedSlug);
      if (idx >= 0) setSelectedIdx(idx);
    } else if (requestedId) {
      const numId = Number(requestedId);
      const idx = modules.findIndex((m) => m.conceptId === numId);
      if (idx >= 0) setSelectedIdx(idx);
    }
  }, [modules, requestedSlug, requestedId]);

  const activeModule = modules[selectedIdx];

  useEffect(() => {
    if (activeModule) {
      setActiveConceptName(activeModule.title);
      setQuickChoice(null);
    }
  }, [activeModule, setActiveConceptName]);

  const completedCount = modules.filter((m) => m.completed).length;

  const handleQuickCheck = (idx: number) => {
    setQuickChoice(idx);
    if (!activeModule) return;
    if (idx === activeModule.quickCheck.correctIndex) {
      triggerReaction(
        'celebrating',
        `Nice check on ${activeModule.title}! Click "Mark Module Complete" to save your progress.`,
        3500
      );
    } else {
      triggerReaction(
        'encouraging',
        `Take a quick look at the formula above and check why option ${String.fromCharCode(
          65 + activeModule.quickCheck.correctIndex
        )} fits.`,
        3500
      );
    }
  };

  const handleCompleteModule = async () => {
    if (!activeModule) return;
    setCompleting(true);
    const isCheckCorrect = quickChoice === activeModule.quickCheck.correctIndex;
    try {
      const res = await apiFetch<{
        modules: LearningModuleItem[];
        achievements: AchievementsPayload;
        newlyUnlockedBadges: AchievementBadge[];
        streakDays: number;
      }>(`/api/student/modules/${activeModule.conceptId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ quickCheckCorrect: isCheckCorrect }),
      });

      setModules(res.modules);
      if (user) {
        updateLocalUser({ ...user, streakDays: res.streakDays });
      }
      apiFetch<StudentJourneyPayload>('/api/student/journey')
        .then((j) => setJourney(j))
        .catch(() => {});

      if (res.newlyUnlockedBadges.length > 0) {
        const names = res.newlyUnlockedBadges.map((b) => b.title).join(', ');
        showToast(`Badge unlocked: ${names}!`, 'xp');
        triggerReaction('achievement', `Module complete & new badge unlocked: ${names}!`, 4800);
      } else {
        showToast('Learning module marked complete!', 'success');
        triggerReaction('celebrating', `Completed "${activeModule.title}"! Ready to practice?`, 4000);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save module completion.', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleToggleOfflineNote = async (conceptId: number) => {
    if (savingNote) return;
    setSavingNote(true);
    try {
      const res = await apiFetch<{ saved: boolean; savedNoteConceptIds: number[] }>(
        `/api/student/notes/${conceptId}/toggle`,
        { method: 'POST' }
      );
      setSavedNoteIds(res.savedNoteConceptIds);
      const offlineCacheKey = user ? `edvanta_offline_notes_${user.id}` : 'edvanta_offline_notes';
      try {
        const cachedModules = modules.filter((m) => res.savedNoteConceptIds.includes(m.conceptId));
        window.localStorage.setItem(offlineCacheKey, JSON.stringify(cachedModules));
      } catch {
        // ignore storage quota errors
      }
      if (journey) {
        setJourney({
          ...journey,
          savedNoteConceptIds: res.savedNoteConceptIds,
          milestones: journey.milestones.map((m) =>
            m.conceptId === conceptId ? { ...m, noteSavedOffline: res.saved } : m
          ),
        });
      }
      showToast(res.saved ? 'Revision notes saved for offline review' : 'Removed from offline notes', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update offline notes.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const switchTab = (nextTab: ModuleViewTab) => {
    setViewTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === 'reader') nextParams.delete('view');
    else nextParams.set('view', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  if (loading) {
    return (
      <AppShell title="Learning Modules">
        <div className="h-96 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      </AppShell>
    );
  }

  if (error || !activeModule) {
    return (
      <AppShell title="Learning Modules">
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'No syllabus modules available.'}</span>
        </SurfaceCard>
      </AppShell>
    );
  }

  const isCurrentNoteSaved = savedNoteIds.includes(activeModule.conceptId);
  const offlineSavedModules = modules.filter((m) => savedNoteIds.includes(m.conceptId));

  return (
    <AppShell title="Learning Modules">
      <div className="space-y-6">
        {/* Syllabus Progress Header & Mode Tabs */}
        <SurfaceCard className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Class 10 Physics — Electricity Study Hub
              </h2>
              <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                Switch between interactive lessons, your step-by-step Journey View, and offline revision sheets.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Modules Completed</p>
                <p className="font-mono text-xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                  {completedCount}/{modules.length}
                </p>
              </div>
              <div className="w-28">
                <ProgressBar
                  value={completedCount}
                  max={modules.length || 1}
                  tone="success"
                  heightClass="h-2"
                  label="Syllabus modules completed"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150]">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EEF1FA] dark:bg-[#212640] rounded-xl max-w-full">
              <button
                type="button"
                onClick={() => switchTab('reader')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  viewTab === 'reader'
                    ? 'bg-white dark:bg-[#181B2E] text-[#14172B] dark:text-[#F4F6FF] shadow-xs'
                    : 'text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white'
                }`}
              >
                Chapter Reader
              </button>
              <button
                type="button"
                onClick={() => switchTab('journey')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  viewTab === 'journey'
                    ? 'bg-white dark:bg-[#181B2E] text-[#14172B] dark:text-[#F4F6FF] shadow-xs'
                    : 'text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white'
                }`}
              >
                Journey View
              </button>
              <button
                type="button"
                onClick={() => switchTab('offline')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  viewTab === 'offline'
                    ? 'bg-white dark:bg-[#181B2E] text-[#14172B] dark:text-[#F4F6FF] shadow-xs'
                    : 'text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white'
                }`}
              >
                Saved Offline ({savedNoteIds.length})
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Link
                to="/student/flashcards"
                className="font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
              >
                Open Flashcards →
              </Link>
              <span aria-hidden="true" className="text-[#CBD3E8] dark:text-[#3C456D]">·</span>
              <Link
                to="/student/mock-exam"
                className="font-semibold text-[#14172B] dark:text-[#F4F6FF] hover:underline whitespace-nowrap"
              >
                Timed Mock Exam →
              </Link>
            </div>
          </div>
        </SurfaceCard>

        {/* JOURNEY VIEW TAB */}
        {viewTab === 'journey' && journey && (
          <div className="space-y-6">
            <SurfaceCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  <span>Up Next in Your Journey · {journey.overallCompletionPercent}% Path Progress</span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#14172B] dark:text-[#F4F6FF]">
                  {journey.upNext.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#4E5674] dark:text-[#B4BDD9]">
                  Formula: <span className="font-mono text-[#14172B] dark:text-[#F4F6FF]">{journey.upNext.keyFormula}</span> · Mastery{' '}
                  <span className="font-mono tabular-nums">{journey.upNext.masteryScore}%</span> ·{' '}
                  Flashcards {journey.upNext.flashcardsKnown}/{journey.upNext.flashcardsTotal}
                </p>
              </div>
              <Link
                to={journey.upNext.nextStepPath}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0 whitespace-nowrap shadow-xs"
              >
                {journey.upNext.nextStepLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </SurfaceCard>

            <SurfaceCard className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150] overflow-hidden">
              {journey.milestones.map((ms) => (
                <div
                  key={ms.conceptId}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E7696] dark:text-[#8892B5]">
                      <span className="font-mono font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                        Step 0{ms.orderIndex}
                      </span>
                      <span aria-hidden="true">·</span>
                      <MasteryStatusText status={ms.masteryStatus} />
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ms.masteryScore}% mastery</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Lesson {ms.moduleCompleted ? 'Done' : 'Pending'} · Flashcards {ms.flashcardsKnown}/
                        {ms.flashcardsTotal}
                      </span>
                    </div>
                    <h4 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">{ms.title}</h4>
                    <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9]">{ms.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const idx = modules.findIndex((m) => m.conceptId === ms.conceptId);
                        if (idx >= 0) setSelectedIdx(idx);
                        switchTab('reader');
                      }}
                      className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3 py-1.5 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors whitespace-nowrap"
                    >
                      {ms.moduleCompleted ? 'Review Lesson' : 'Open Lesson'}
                    </button>
                    <Link
                      to={`/student/flashcards?conceptSlug=${ms.conceptSlug}`}
                      className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3 py-1.5 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors whitespace-nowrap"
                    >
                      Flashcards
                    </Link>
                    <Link
                      to={`/student/practice?conceptId=${ms.conceptId}`}
                      className="rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                    >
                      Practice
                    </Link>
                  </div>
                </div>
              ))}
            </SurfaceCard>
          </div>
        )}

        {/* OFFLINE SAVED REVISION NOTES TAB */}
        {viewTab === 'offline' && (
          <section className="space-y-4">
            {offlineSavedModules.length === 0 ? (
              <SurfaceCard className="p-10 text-center space-y-3">
                <Bookmark className="h-8 w-8 text-[#6E7696] dark:text-[#8892B5] mx-auto" aria-hidden="true" />
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  No offline revision notes saved yet
                </h3>
                <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] max-w-md mx-auto">
                  Click &ldquo;Save Offline&rdquo; inside any chapter to cache its formula sheet, key concepts, and worked example
                  for quick offline revision.
                </p>
                <button
                  type="button"
                  onClick={() => switchTab('reader')}
                  className="rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  Browse Chapters
                </button>
              </SurfaceCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {offlineSavedModules.map((mod) => (
                  <SurfaceCard
                    key={mod.conceptId}
                    className="p-6 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#15996C] dark:text-[#27C991] font-semibold">Available Offline</p>
                          <h3 className="font-display text-base font-bold text-[#14172B] dark:text-[#F4F6FF] mt-0.5">
                            {mod.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleOfflineNote(mod.conceptId)}
                          className="text-xs text-[#6E7696] dark:text-[#8892B5] hover:text-[#E5484D] dark:hover:text-[#F87171] shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="rounded-xl bg-[#14172B] dark:bg-[#111322] border border-[#2B3150] text-white px-3.5 py-2 font-mono text-xs">
                        {mod.keyFormula} · {mod.unitsNote}
                      </div>
                      <p className="text-xs sm:text-sm text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed">
                        {mod.coreExplanation}
                      </p>
                      <p className="text-xs text-[#B46E00] dark:text-[#F6B94A] bg-[#F6B94A]/10 border border-[#F6B94A]/30 rounded-xl px-3 py-2">
                        <strong>Trap Alert:</strong> {mod.misconceptionWatch}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const idx = modules.findIndex((m) => m.conceptId === mod.conceptId);
                          if (idx >= 0) setSelectedIdx(idx);
                          switchTab('reader');
                        }}
                        className="font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline"
                      >
                        Open Full Simulator Lesson →
                      </button>
                      <span className="font-mono text-[#6E7696] dark:text-[#8892B5]">{mod.workedExample.answer}</span>
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CHAPTER READER TAB */}
        {viewTab === 'reader' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Syllabus List */}
            <aside className="lg:col-span-4 rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] divide-y divide-[#E2E6F3] dark:divide-[#2B3150] overflow-hidden shadow-[var(--shadow-card)]">
              {modules.map((mod, idx) => {
                const isActive = idx === selectedIdx;
                return (
                  <button
                    key={mod.conceptId}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-[#7055F7]/10 dark:bg-[#7055F7]/18'
                        : 'hover:bg-[#EEF1FA]/60 dark:hover:bg-[#212640]/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive
                            ? 'text-[#7055F7] dark:text-[#A493FF]'
                            : 'text-[#14172B] dark:text-[#F4F6FF]'
                        }`}
                      >
                        {mod.title}
                      </p>
                      <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">
                        {mod.estimatedMinutes} min · Mastery{' '}
                        <span className="font-mono tabular-nums">{mod.masteryScore}%</span>
                      </p>
                    </div>
                    {mod.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#27C991] shrink-0 mt-0.5" aria-label="Completed" />
                    ) : (
                      <span className="text-xs font-mono text-[#6E7696] dark:text-[#8892B5] shrink-0 mt-0.5">
                        0{mod.orderIndex}
                      </span>
                    )}
                  </button>
                );
              })}
            </aside>

            {/* Active Module Reader */}
            <article className="lg:col-span-8 space-y-5">
              <SurfaceCard className="p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E2E6F3] dark:border-[#2B3150]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E7696] dark:text-[#8892B5]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {activeModule.estimatedMinutes} min lesson
                      </span>
                      <span aria-hidden="true">·</span>
                      <MasteryStatusText status={activeModule.masteryStatus} />
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{activeModule.masteryScore}% mastery</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-1.5">
                      {activeModule.title}
                    </h3>
                    <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-0.5">{activeModule.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      disabled={savingNote}
                      onClick={() => handleToggleOfflineNote(activeModule.conceptId)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        isCurrentNoteSaved
                          ? 'border-[#27C991]/50 bg-[#27C991]/12 text-[#15996C] dark:text-[#27C991]'
                          : 'border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] text-[#14172B] dark:text-[#F4F6FF]'
                      }`}
                    >
                      {isCurrentNoteSaved ? (
                        <>
                          <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Saved Offline
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                          Save Offline
                        </>
                      )}
                    </button>

                    <div className="rounded-xl bg-[#14172B] dark:bg-[#111322] border border-[#2B3150] px-4 py-2 text-white shrink-0">
                      <p className="text-[11px] text-[#8892B5]">Core Formula</p>
                      <p className="font-mono text-sm font-semibold mt-0.5 text-[#35C9D8]">
                        {activeModule.keyFormula}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SI Units & Objectives */}
                <div className="space-y-3">
                  <p className="text-xs font-mono text-[#4E5674] dark:text-[#B4BDD9] bg-[#EEF1FA]/70 dark:bg-[#212640] border border-[#E2E6F3] dark:border-[#2B3150] rounded-xl px-3.5 py-2">
                    {activeModule.unitsNote}
                  </p>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      Learning Objectives
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-[#4E5674] dark:text-[#B4BDD9] list-disc pl-5">
                      {activeModule.objectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Core Concept Explanation */}
                <div className="pt-2">
                  <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                    Core Concept
                  </h4>
                  <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed mt-1.5">
                    {activeModule.coreExplanation}
                  </p>
                </div>

                {/* Interactive Physics Simulator */}
                <ModuleSimulator type={activeModule.simulatorType} />

                {/* Worked Numerical Example */}
                <div className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#F6F7FC]/70 dark:bg-[#111322]/70 p-5 space-y-3">
                  <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                    Worked Numerical Example
                  </h4>
                  <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF]">
                    {activeModule.workedExample.problem}
                  </p>
                  <ol className="space-y-1.5 text-sm text-[#4E5674] dark:text-[#B4BDD9] list-decimal pl-5">
                    {activeModule.workedExample.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <p className="text-xs font-mono font-semibold text-[#15996C] dark:text-[#27C991]">
                    Final Answer: {activeModule.workedExample.answer}
                  </p>
                </div>

                {/* Common Misconception Watch */}
                <div className="rounded-2xl border border-[#F6B94A]/40 bg-[#F6B94A]/10 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-[#B46E00] dark:text-[#F6B94A] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs sm:text-sm text-[#4E5674] dark:text-[#B4BDD9]">
                    <strong className="font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      Misconception Watch:{' '}
                    </strong>
                    {activeModule.misconceptionWatch}
                  </div>
                </div>

                {/* Quick Comprehension Check */}
                <div className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] p-5 space-y-3">
                  <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                    Quick Comprehension Check
                  </h4>
                  <p className="text-sm text-[#14172B] dark:text-[#F4F6FF]">{activeModule.quickCheck.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeModule.quickCheck.options.map((opt, idx) => {
                      const isPicked = quickChoice === idx;
                      const isRight = idx === activeModule.quickCheck.correctIndex;
                      let cls =
                        'border-[#E2E6F3] dark:border-[#2B3150] hover:bg-[#EEF1FA]/70 dark:hover:bg-[#212640] text-[#4E5674] dark:text-[#B4BDD9]';
                      if (quickChoice !== null) {
                        if (isRight) {
                          cls =
                            'border-[#27C991] bg-[#27C991]/12 text-[#14172B] dark:text-[#F4F6FF] font-medium';
                        } else if (isPicked) {
                          cls =
                            'border-[#E5484D] bg-[#E5484D]/12 text-[#14172B] dark:text-[#F4F6FF]';
                        }
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickCheck(idx)}
                          className={`rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${cls}`}
                        >
                          <span className="font-mono text-xs mr-2 text-[#6E7696] dark:text-[#8892B5]">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quickChoice !== null && (
                    <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] pt-1 font-friendly">
                      {activeModule.quickCheck.explanation}
                    </p>
                  )}
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/student/flashcards?conceptSlug=${activeModule.conceptSlug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors whitespace-nowrap"
                    >
                      <FlipHorizontal2 className="h-4 w-4 text-[#7055F7]" aria-hidden="true" />
                      Flashcards
                    </Link>
                    <Link
                      to={`/student/practice?conceptId=${activeModule.conceptId}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors whitespace-nowrap"
                    >
                      <Sparkles className="h-4 w-4 text-[#35C9D8]" aria-hidden="true" />
                      Practice Concept
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>

                  <button
                    type="button"
                    disabled={completing}
                    onClick={handleCompleteModule}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap ${
                      activeModule.completed
                        ? 'bg-[#27C991] text-[#0D1A15] hover:bg-[#1FB681]'
                        : 'bg-[#7055F7] text-white hover:bg-[#5D42E6]'
                    }`}
                  >
                    <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                    {completing
                      ? 'Saving...'
                      : activeModule.completed
                      ? 'Module Completed (Update)'
                      : 'Mark Module Complete'}
                  </button>
                </div>
              </SurfaceCard>
            </article>
          </div>
        )}
      </div>
    </AppShell>
  );
}
