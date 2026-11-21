import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ModuleSimulator } from '../../components/ModuleSimulator';
import { MasteryStatusText } from '../../components/StatusIndicator';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCompanion } from '../../context/CompanionContext';
import { AchievementBadge, AchievementsPayload, LearningModuleItem } from '../../../shared/types';

export function LearningModulesPage() {
  const [searchParams] = useSearchParams();
  const requestedSlug = searchParams.get('conceptSlug');
  const requestedId = searchParams.get('conceptId');
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { triggerReaction, setActiveConceptName } = useCompanion();

  const [modules, setModules] = useState<LearningModuleItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [quickChoice, setQuickChoice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<{ modules: LearningModuleItem[] }>('/api/student/modules');
        if (active) {
          setModules(res.modules);
          const firstIncomplete = res.modules.findIndex((m) => !m.completed);
          if (firstIncomplete >= 0) {
            setSelectedIdx(firstIncomplete);
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load syllabus modules.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      setActiveConceptName(undefined);
    };
  }, [setActiveConceptName]);

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

      if (res.newlyUnlockedBadges.length > 0) {
        const names = res.newlyUnlockedBadges.map((b) => b.title).join(', ');
        showToast(`Badge unlocked: ${names}!`, 'success');
        triggerReaction('celebrating', `Module complete & new badge unlocked: ${names}!`, 4800);
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

  if (loading) {
    return (
      <AppShell title="Learning Modules">
        <div className="h-96 rounded-xl bg-white border border-slate-200 animate-pulse" />
      </AppShell>
    );
  }

  if (error || !activeModule) {
    return (
      <AppShell title="Learning Modules">
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'No syllabus modules available.'}</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Learning Modules">
      <div className="space-y-6">
        {/* Syllabus Progress Header */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#101827]">
              Class 10 Physics — Electricity Syllabus Modules
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Follow the prerequisite sequence from electric charge to Joule heating with interactive simulators.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs text-slate-500">Modules Completed</p>
              <p className="font-mono text-xl font-bold tabular-nums text-[#101827]">
                {completedCount}/{modules.length}
              </p>
            </div>
            <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#16A34A] transition-all"
                style={{ width: `${modules.length ? Math.round((completedCount / modules.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Syllabus List */}
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {modules.map((mod, idx) => {
              const isActive = idx === selectedIdx;
              return (
                <button
                  key={mod.conceptId}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                    isActive ? 'bg-[#526BFF]/8' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-[#526BFF]' : 'text-[#101827]'
                      }`}
                    >
                      {mod.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {mod.estimatedMinutes} min · Mastery{' '}
                      <span className="font-mono tabular-nums">{mod.masteryScore}%</span>
                    </p>
                  </div>
                  {mod.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" aria-label="Completed" />
                  ) : (
                    <span className="text-xs font-mono text-slate-400 shrink-0 mt-0.5">
                      0{mod.orderIndex}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Active Module Reader */}
          <article className="lg:col-span-8 space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {activeModule.estimatedMinutes} min lesson
                    </span>
                    <span aria-hidden="true">·</span>
                    <MasteryStatusText status={activeModule.masteryStatus} />
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{activeModule.masteryScore}% mastery</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#101827] mt-1.5">
                    {activeModule.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-0.5">{activeModule.subtitle}</p>
                </div>

                <div className="rounded-lg bg-[#101827] px-4 py-2.5 text-white shrink-0">
                  <p className="text-[11px] text-slate-400">Core Formula</p>
                  <p className="font-mono text-sm font-semibold mt-0.5">{activeModule.keyFormula}</p>
                </div>
              </div>

              {/* SI Units & Objectives */}
              <div className="space-y-3">
                <p className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2">
                  {activeModule.unitsNote}
                </p>
                <div>
                  <h4 className="font-display text-sm font-semibold text-[#101827]">Learning Objectives</h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                    {activeModule.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Core Concept Explanation */}
              <div className="pt-2">
                <h4 className="font-display text-sm font-semibold text-[#101827]">Core Concept</h4>
                <p className="text-sm text-slate-700 leading-relaxed mt-1.5">
                  {activeModule.coreExplanation}
                </p>
              </div>

              {/* Interactive Physics Simulator */}
              <ModuleSimulator type={activeModule.simulatorType} />

              {/* Worked Numerical Example */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <h4 className="font-display text-sm font-semibold text-[#101827]">Worked Numerical Example</h4>
                <p className="text-sm font-medium text-[#101827]">{activeModule.workedExample.problem}</p>
                <ol className="space-y-1.5 text-sm text-slate-700 list-decimal pl-5">
                  {activeModule.workedExample.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <p className="text-xs font-mono font-semibold text-[#16A34A]">
                  Final Answer: {activeModule.workedExample.answer}
                </p>
              </div>

              {/* Common Misconception Watch */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs sm:text-sm text-slate-700">
                  <strong className="font-semibold text-[#101827]">Misconception Watch: </strong>
                  {activeModule.misconceptionWatch}
                </div>
              </div>

              {/* Quick Comprehension Check */}
              <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                <h4 className="font-display text-sm font-semibold text-[#101827]">Quick Comprehension Check</h4>
                <p className="text-sm text-slate-800">{activeModule.quickCheck.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeModule.quickCheck.options.map((opt, idx) => {
                    const isPicked = quickChoice === idx;
                    const isRight = idx === activeModule.quickCheck.correctIndex;
                    let cls = 'border-slate-200 hover:bg-slate-50 text-slate-700';
                    if (quickChoice !== null) {
                      if (isRight) cls = 'border-[#16A34A] bg-emerald-50/70 text-[#101827] font-medium';
                      else if (isPicked) cls = 'border-[#DC2626] bg-red-50/70 text-[#101827]';
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickCheck(idx)}
                        className={`rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${cls}`}
                      >
                        <span className="font-mono text-xs mr-2 text-slate-500">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quickChoice !== null && (
                  <p className="text-xs text-slate-600 pt-1">{activeModule.quickCheck.explanation}</p>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={`/student/practice?conceptId=${activeModule.conceptId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-medium text-[#101827] transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-[#526BFF]" aria-hidden="true" />
                  Practice This Concept
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  disabled={completing}
                  onClick={handleCompleteModule}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    activeModule.completed
                      ? 'bg-[#16A34A] text-white hover:bg-emerald-700'
                      : 'bg-[#526BFF] text-white hover:bg-[#4158E6]'
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
            </div>
          </article>
        </div>
      </div>
    </AppShell>
  );
}
