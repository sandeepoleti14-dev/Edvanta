import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { MasteryStatusText } from '../../components/StatusIndicator';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCompanion } from '../../context/CompanionContext';
import { DiagnosticSubmitResult, Difficulty } from '../../../shared/types';

interface DiagnosticQuestion {
  id: number;
  conceptId: number;
  conceptSlug: string;
  conceptName: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
}

export function DiagnosticPage() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { triggerReaction } = useCompanion();
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedMap, setSelectedMap] = useState<Record<number, number>>({});
  const [reasoningMap, setReasoningMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticSubmitResult | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<{ questions: DiagnosticQuestion[] }>('/api/student/diagnostic/questions');
        if (active) setQuestions(res.questions);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load diagnostic assessment.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const currentQuestion = questions[currentIdx];
  const answeredCount = questions.filter((q) => selectedMap[q.id] !== undefined).length;

  const handleSubmitAll = async () => {
    const unanswered = questions.filter((q) => selectedMap[q.id] === undefined);
    if (unanswered.length > 0) {
      showToast(`Please answer all ${questions.length} questions (${unanswered.length} remaining).`, 'error');
      const firstMissing = questions.findIndex((q) => selectedMap[q.id] === undefined);
      if (firstMissing >= 0) setCurrentIdx(firstMissing);
      return;
    }

    setSubmitting(true);
    triggerReaction('thinking');
    try {
      const payload = {
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedIndex: selectedMap[q.id],
          reasoning: reasoningMap[q.id] || '',
        })),
      };
      const res = await apiFetch<DiagnosticSubmitResult>('/api/student/diagnostic/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(res);
      if (user && typeof res.streakDays === 'number') {
        updateLocalUser({ ...user, streakDays: res.streakDays });
      }
      if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
        const names = res.newlyUnlockedBadges.map((b) => b.title).join(', ');
        showToast(`Diagnostic complete! Unlocked badge: ${names}`, 'xp');
        triggerReaction('achievement', `Diagnostic complete & badge unlocked: ${names}!`, 4800);
      } else {
        showToast('Diagnostic completed — learner profile updated!', 'success');
        triggerReaction(
          'celebrating',
          `Diagnostic baseline ready (${res.overallMastery}% overall mastery)! Let's strengthen your weak spots.`,
          4500
        );
      }
    } catch (err) {
      triggerReaction('idle');
      showToast(err instanceof Error ? err.message : 'Failed to submit diagnostic.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Diagnostic Assessment">
        <div className="h-80 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Diagnostic Assessment">
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (result) {
    return (
      <AppShell title="Diagnostic Summary">
        <div className="space-y-6">
          <SurfaceCard className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#15996C] dark:text-[#27C991]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Baseline Learner Profile Generated
              </div>
              <h2 className="font-display text-2xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-1">
                Diagnostic Complete — Java DSA
              </h2>
              <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                EDVANTA evaluated your responses and calibrated mastery across all {result.totalQuestions} core
                concepts.
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Score</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                  {result.correctCount}/{result.totalQuestions}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Accuracy</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                  {result.accuracyRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Overall Mastery</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#7055F7] dark:text-[#A493FF]">
                  {result.overallMastery}%
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] mb-4">
              Concept-by-Concept Baseline
            </h3>
            <div className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
              {result.conceptResults.map((item) => (
                <div key={item.conceptId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF]">{item.conceptName}</p>
                    {item.misconceptionTitle && (
                      <p className="text-xs text-[#E5484D] dark:text-[#F87171] mt-0.5">
                        Misconception detected: {item.misconceptionTitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <MasteryStatusText status={item.status} />
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF] w-12 text-right">
                      {item.masteryScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/practice"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Start Adaptive Practice
            </Link>
            <Link
              to="/student/concept-map"
              className="inline-flex items-center gap-2 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#181B2E] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] px-5 py-2.5 text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors"
            >
              Inspect Concept Map
            </Link>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white px-3 py-2"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Diagnostic Assessment">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Header */}
        <SurfaceCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E7696] dark:text-[#8892B5]">
            <span>Java DSA Baseline</span>
            <span className="font-mono tabular-nums font-medium text-[#14172B] dark:text-[#F4F6FF]">
              {answeredCount} of {questions.length} answered
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = selectedMap[q.id] !== undefined;
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  aria-label={`Jump to question ${idx + 1}: ${q.conceptName}`}
                  className={`h-2.5 flex-1 rounded-full transition-colors ${
                    isCurrent
                      ? 'bg-[#7055F7]'
                      : isAnswered
                      ? 'bg-[#27C991]'
                      : 'bg-[#E2E6F3] dark:bg-[#2B3150] hover:bg-[#CBD3E8] dark:hover:bg-[#3C456D]'
                  }`}
                />
              );
            })}
          </div>
        </SurfaceCard>

        {/* Question Card */}
        {currentQuestion && (
          <SurfaceCard className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between gap-3 text-xs text-[#6E7696] dark:text-[#8892B5]">
              <span>
                Question {currentIdx + 1} of {questions.length} ·{' '}
                <strong className="font-semibold text-[#14172B] dark:text-[#F4F6FF]">{currentQuestion.conceptName}</strong>
              </span>
              <span className="capitalize font-mono">{currentQuestion.difficulty}</span>
            </div>

            <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14172B] dark:text-[#F4F6FF] leading-snug">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedMap[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedMap((prev) => ({ ...prev, [currentQuestion.id]: idx }))}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-[#7055F7] bg-[#7055F7]/8 dark:bg-[#7055F7]/15 text-[#14172B] dark:text-white font-medium'
                        : 'border-[#E2E6F3] dark:border-[#2B3150] hover:border-[#CBD3E8] dark:hover:border-[#3C456D] hover:bg-[#F2F4FB] dark:hover:bg-[#212640] text-[#4E5674] dark:text-[#B4BDD9]'
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 ${
                        isSelected
                          ? 'border-[#7055F7] bg-[#7055F7] text-white'
                          : 'border-[#CBD3E8] dark:border-[#3C456D] text-[#6E7696] dark:text-[#8892B5]'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor={`diag-reasoning-${currentQuestion.id}`}
                className="block text-xs font-medium text-[#4E5674] dark:text-[#B4BDD9] mb-1.5"
              >
                Explain your reasoning (optional — enables misconception detection)
              </label>
              <textarea
                id={`diag-reasoning-${currentQuestion.id}`}
                rows={3}
                value={reasoningMap[currentQuestion.id] ?? ''}
                onChange={(e) =>
                  setReasoningMap((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                }
                placeholder="Briefly describe the formula or physical principle you used..."
                className="w-full rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] px-3.5 py-2.5 text-sm text-[#14172B] dark:text-[#F4F6FF] placeholder:text-[#6E7696] focus:border-[#7055F7] focus:outline-none focus:ring-2 focus:ring-[#7055F7]/20"
              />
            </div>

            <div className="pt-4 border-t border-[#E2E6F3] dark:border-[#2B3150] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#181B2E] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] px-4 py-2 text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] disabled:opacity-40 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#14172B] dark:bg-[#477BFF] hover:opacity-90 px-5 py-2 text-sm font-semibold text-white transition-opacity"
                >
                  Next Question
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Analyzing & Scoring...' : 'Submit Diagnostic'}
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </SurfaceCard>
        )}
      </div>
    </AppShell>
  );
}
