import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FlipHorizontal2,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ProgressBar, SurfaceCard } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCompanion } from '../../context/CompanionContext';
import { FlashcardConfidence, FlashcardItem, FlashcardsPayload } from '../../../shared/types';

type DeckFilter = 'all' | 'review' | 'new' | 'known';

export function FlashcardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConceptSlug = searchParams.get('conceptSlug') || 'all';

  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { triggerReaction, setActiveConceptName } = useCompanion();

  const [deck, setDeck] = useState<FlashcardsPayload | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialConceptSlug);
  const [statusFilter, setStatusFilter] = useState<DeckFilter>('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<FlashcardsPayload>('/api/student/flashcards');
        if (active) setDeck(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load flashcards.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      setActiveConceptName(undefined);
    };
  }, [setActiveConceptName]);

  const conceptOptions = useMemo(() => {
    if (!deck) return [];
    const seen = new Map<string, string>();
    for (const c of deck.cards) {
      if (!seen.has(c.conceptSlug)) {
        seen.set(c.conceptSlug, c.conceptName);
      }
    }
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
  }, [deck]);

  const filteredCards: FlashcardItem[] = useMemo(() => {
    if (!deck) return [];
    return deck.cards.filter((card) => {
      const matchConcept = selectedSlug === 'all' || card.conceptSlug === selectedSlug;
      const matchStatus = statusFilter === 'all' || card.confidence === statusFilter;
      return matchConcept && matchStatus;
    });
  }, [deck, selectedSlug, statusFilter]);

  const safeIdx = filteredCards.length > 0 ? Math.min(currentIdx, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeIdx];

  useEffect(() => {
    if (activeCard) {
      setActiveConceptName(activeCard.conceptName);
    }
  }, [activeCard, setActiveConceptName]);

  const handleSelectConcept = (slug: string) => {
    setSelectedSlug(slug);
    setCurrentIdx(0);
    setFlipped(false);
    const next = new URLSearchParams(searchParams);
    if (slug === 'all') next.delete('conceptSlug');
    else next.set('conceptSlug', slug);
    setSearchParams(next, { replace: true });
  };

  const handleSelectStatus = (nextStatus: DeckFilter) => {
    setStatusFilter(nextStatus);
    setCurrentIdx(0);
    setFlipped(false);
  };

  const handleReview = useCallback(
    async (confidence: Extract<FlashcardConfidence, 'known' | 'review'>) => {
      if (!activeCard || saving) return;
      setSaving(true);
      try {
        const updated = await apiFetch<FlashcardsPayload>(
          `/api/student/flashcards/${encodeURIComponent(activeCard.id)}/review`,
          {
            method: 'POST',
            body: JSON.stringify({ confidence }),
          }
        );
        setDeck(updated);
        if (user && typeof updated.streakDays === 'number') {
          updateLocalUser({ ...user, streakDays: updated.streakDays });
        }

        if (confidence === 'known') {
          triggerReaction(
            'celebrating',
            `Locked in "${activeCard.conceptName}"! ${updated.stats.known}/${updated.stats.total} cards known.`,
            3200
          );
        } else {
          triggerReaction(
            'encouraging',
            `Queued "${activeCard.conceptName}" for review—you'll nail it next pass.`,
            3200
          );
        }

        setFlipped(false);
        if (filteredCards.length > 1) {
          setCurrentIdx((prev) => (prev + 1) % filteredCards.length);
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not save flashcard progress.', 'error');
      } finally {
        setSaving(false);
      }
    },
    [activeCard, saving, user, updateLocalUser, triggerReaction, filteredCards.length, showToast]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight' && filteredCards.length > 1) {
        setFlipped(false);
        setCurrentIdx((prev) => (prev + 1) % filteredCards.length);
      } else if (e.key === 'ArrowLeft' && filteredCards.length > 1) {
        setFlipped(false);
        setCurrentIdx((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
      } else if (e.key === '1') {
        void handleReview('review');
      } else if (e.key === '2') {
        void handleReview('known');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filteredCards.length, handleReview]);

  if (loading) {
    return (
      <AppShell title="Active-Recall Flashcards">
        <div className="h-96 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      </AppShell>
    );
  }

  if (error || !deck) {
    return (
      <AppShell title="Active-Recall Flashcards">
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Flashcard deck unavailable.'}</span>
        </SurfaceCard>
      </AppShell>
    );
  }

  const knownPct = deck.stats.total > 0 ? Math.round((deck.stats.known / deck.stats.total) * 100) : 0;

  return (
    <AppShell title="Active-Recall Flashcards">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Deck Progress & Controls */}
        <SurfaceCard className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Java DSA — Rapid Recall Deck
              </h2>
              <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-0.5">
                {deck.stats.known} known · {deck.stats.needsReview} needs review · {deck.stats.unreviewed} unreviewed
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Deck Mastery</p>
                <p className="font-mono text-xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                  {knownPct}%
                </p>
              </div>
              <div className="w-28">
                <ProgressBar value={knownPct} max={100} tone="primary" heightClass="h-2" label="Flashcard deck mastery" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150]">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EEF1FA] dark:bg-[#212640] rounded-xl max-w-full">
              {(
                [
                  { id: 'all', label: `All (${deck.stats.total})` },
                  { id: 'review', label: `Needs Review (${deck.stats.needsReview})` },
                  { id: 'new', label: `Unreviewed (${deck.stats.unreviewed})` },
                  { id: 'known', label: `Known (${deck.stats.known})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectStatus(tab.id)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-white dark:bg-[#181B2E] text-[#14172B] dark:text-[#F4F6FF] shadow-xs'
                      : 'text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="fc-concept-select"
                className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5] whitespace-nowrap"
              >
                Topic:
              </label>
              <select
                id="fc-concept-select"
                value={selectedSlug}
                onChange={(e) => handleSelectConcept(e.target.value)}
                className="rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] px-3 py-1.5 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] focus:border-[#7055F7] focus:outline-none"
              >
                <option value="all">All 8 Concepts</option>
                {conceptOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SurfaceCard>

        {/* Active Card Stage */}
        {!activeCard ? (
          <SurfaceCard className="p-10 text-center space-y-4">
            <Layers className="h-8 w-8 text-[#6E7696] dark:text-[#8892B5] mx-auto" aria-hidden="true" />
            <div>
              <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                No flashcards match this filter
              </h3>
              <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1">
                Switch back to &ldquo;All&rdquo; or pick another DSA topic to keep drilling.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedSlug('all');
                setStatusFilter('all');
                setCurrentIdx(0);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              Reset Deck Filters
            </button>
          </SurfaceCard>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#6E7696] dark:text-[#8892B5] px-1">
              <span>
                Card <strong className="font-mono tabular-nums text-[#14172B] dark:text-[#F4F6FF]">{safeIdx + 1}</strong> of{' '}
                <strong className="font-mono tabular-nums text-[#14172B] dark:text-[#F4F6FF]">{filteredCards.length}</strong> ·{' '}
                {activeCard.conceptName} · {activeCard.category}
              </span>
              <span className="font-medium text-[#4E5674] dark:text-[#B4BDD9]">
                Status:{' '}
                <span
                  className={
                    activeCard.confidence === 'known'
                      ? 'text-[#15996C] dark:text-[#27C991]'
                      : activeCard.confidence === 'review'
                      ? 'text-[#B46E00] dark:text-[#F6B94A]'
                      : 'text-[#4E5674] dark:text-[#B4BDD9]'
                  }
                >
                  {activeCard.confidence === 'known'
                    ? 'Known'
                    : activeCard.confidence === 'review'
                    ? 'Needs Review'
                    : 'Unreviewed'}
                </span>
              </span>
            </div>

            <div className="flashcard-scene">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? 'Show flashcard question front' : 'Flip flashcard to reveal answer'}
                className={`flashcard-card w-full text-left block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7055F7] rounded-2xl ${
                  flipped ? 'is-flipped' : ''
                }`}
                style={{ minHeight: '420px' }}
              >
                {/* Front Face */}
                <div className="flashcard-face absolute inset-0 rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-7 sm:p-10 flex flex-col justify-between shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between text-xs text-[#6E7696] dark:text-[#8892B5]">
                    <span>
                      {activeCard.conceptName} · {activeCard.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#7055F7] dark:text-[#A493FF] font-semibold">
                      <FlipHorizontal2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Click or press Space to flip
                    </span>
                  </div>

                  <div className="my-auto py-4">
                    <p className="text-xs font-semibold text-[#6E7696] dark:text-[#8892B5] uppercase tracking-wider mb-2">
                      Recall Prompt
                    </p>
                    <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#14172B] dark:text-[#F4F6FF] leading-snug">
                      {activeCard.frontPrompt}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6E7696] dark:text-[#8892B5] pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150]">
                    <span>Active recall before checking solution</span>
                    <span className="font-mono tabular-nums">Reviewed {activeCard.reviewCount}×</span>
                  </div>
                </div>

                {/* Back Face */}
                <div className="flashcard-face flashcard-face-back absolute inset-0 rounded-2xl border border-[#7055F7]/50 bg-[#14172B] dark:bg-[#111322] text-white p-7 sm:p-10 flex flex-col justify-between shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between text-xs text-[#B4BDD9]">
                    <span>Answer &amp; Exam Rule · {activeCard.conceptName}</span>
                    <span className="font-mono text-[#35C9D8] font-semibold">{activeCard.formulaHint}</span>
                  </div>

                  <div className="my-auto py-4 space-y-3 max-h-[270px] overflow-y-auto">
                    <p className="text-base sm:text-lg font-medium leading-relaxed text-white">
                      {activeCard.backAnswer}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#35C9D8]">Worked solution</p>
                    <ol
                      aria-label="Worked solution steps"
                      className="list-decimal pl-5 text-xs sm:text-sm text-[#D7DCF0] space-y-1.5"
                    >
                      {activeCard.solutionSteps.map((step, index) => (
                        <li key={`${activeCard.id}-step-${index}`}>{step}</li>
                      ))}
                    </ol>
                    <p className="text-xs sm:text-sm text-[#B4BDD9] bg-[#212640] border border-[#2B3150] rounded-xl px-3.5 py-2.5">
                      <strong className="text-[#F6B94A]">Exam Tip:</strong> {activeCard.examTip}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#8892B5] pt-3 border-t border-[#2B3150]">
                    <span>Rate recall below: 1 = Needs Review · 2 = Got It</span>
                    <span>Click card to flip back</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Flashcard Rating & Navigation Controls */}
            <SurfaceCard className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={filteredCards.length <= 1}
                  onClick={() => {
                    setFlipped(false);
                    setCurrentIdx((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
                  }}
                  aria-label="Previous flashcard"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3.5 py-2 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] disabled:opacity-40 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={filteredCards.length <= 1}
                  onClick={() => {
                    setFlipped(false);
                    setCurrentIdx((prev) => (prev + 1) % filteredCards.length);
                  }}
                  aria-label="Next flashcard"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3.5 py-2 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] disabled:opacity-40 transition-colors"
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleReview('review')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#F6B94A]/50 bg-[#F6B94A]/12 hover:bg-[#F6B94A]/20 px-4 py-2 text-xs font-semibold text-[#B46E00] dark:text-[#F6B94A] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Needs Review (1)
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleReview('known')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#27C991] hover:bg-[#1FB681] px-4 py-2 text-xs font-semibold text-[#0D1A15] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Got It (2)
                </button>
              </div>
            </SurfaceCard>

            {/* Bottom Cross-Links */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1 text-xs">
              <Link
                to={`/student/modules?conceptSlug=${activeCard.conceptSlug}`}
                className="text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white hover:underline"
              >
                Open {activeCard.conceptName} Module &amp; Simulator →
              </Link>
              <Link
                to="/student/mock-exam"
                className="inline-flex items-center gap-1.5 font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Ready? Test yourself in Timed Mock Exam
              </Link>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
