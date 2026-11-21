import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, CircleDashed } from 'lucide-react';
import { LearnerConceptMastery, MasteryStatus } from '../../shared/types';
import { MasteryStatusText, masteryBarColor } from './StatusIndicator';

interface ConceptGraphViewProps {
  concepts: LearnerConceptMastery[];
  onPracticeConcept?: (conceptId: number) => void;
}

// 5-tier left-to-right DAG coordinates inside a 1080x540 canvas so no edges cross behind nodes
const LAYOUT_POSITIONS: Record<string, { x: number; y: number }> = {
  'electric-current': { x: 105, y: 150 },
  'potential-difference': { x: 105, y: 390 },
  'ohms-law': { x: 315, y: 270 },
  resistance: { x: 525, y: 150 },
  'series-circuits': { x: 715, y: 170 },
  'parallel-circuits': { x: 715, y: 380 },
  'electric-power': { x: 945, y: 170 },
  'electrical-energy': { x: 945, y: 380 },
};

const VIEW_W = 1080;
const VIEW_H = 540;
const BOX_W = 178;
const BOX_H = 104;

function statusColors(status: MasteryStatus): {
  border: string;
  bg: string;
  accent: string;
} {
  if (status === 'mastered') {
    return { border: 'border-emerald-300', bg: 'bg-emerald-50/75', accent: 'text-[#16A34A]' };
  }
  if (status === 'developing') {
    return { border: 'border-amber-300', bg: 'bg-amber-50/75', accent: 'text-[#D97706]' };
  }
  if (status === 'weak') {
    return { border: 'border-red-300', bg: 'bg-red-50/75', accent: 'text-[#DC2626]' };
  }
  return { border: 'border-slate-200', bg: 'bg-white', accent: 'text-slate-500' };
}

export function ConceptGraphView({ concepts, onPracticeConcept }: ConceptGraphViewProps) {
  const [selectedId, setSelectedId] = useState<number>(() => concepts[0]?.id ?? 1);

  const selected = useMemo(
    () => concepts.find((c) => c.id === selectedId) ?? concepts[0],
    [concepts, selectedId]
  );

  const conceptById = useMemo(() => {
    const map = new Map<number, LearnerConceptMastery>();
    for (const c of concepts) map.set(c.id, c);
    return map;
  }, [concepts]);

  const getPos = (c: LearnerConceptMastery) =>
    LAYOUT_POSITIONS[c.slug] ?? { x: c.graphX, y: c.graphY };

  const edges = useMemo(() => {
    const result: Array<{ from: LearnerConceptMastery; to: LearnerConceptMastery }> = [];
    for (const c of concepts) {
      for (const pid of c.prerequisites) {
        const prereq = conceptById.get(pid);
        if (prereq) {
          result.push({ from: prereq, to: c });
        }
      }
    }
    return result;
  }, [concepts, conceptById]);

  if (concepts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No syllabus concepts loaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Interactive Graph Canvas */}
      <div className="xl:col-span-8 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-base font-semibold text-[#101827]">
              Class 10 Physics — Electricity Dependency Map
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any concept node to inspect prerequisite readiness and mastery history.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" aria-hidden="true" />
              Mastered (75%+)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#D97706]" aria-hidden="true" />
              Developing (50–74%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" aria-hidden="true" />
              Weak (&lt;50%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CircleDashed className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Not started
            </span>
          </div>
        </div>

        {/* Desktop responsive aspect-ratio graph fitting all 8 nodes cleanly */}
        <div className="hidden md:block w-full">
          <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="edvanta-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
                </marker>
                <marker
                  id="edvanta-arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#526BFF" />
                </marker>
              </defs>
              {edges.map(({ from, to }) => {
                const pFrom = getPos(from);
                const pTo = getPos(to);
                const isSameCol = Math.abs(pFrom.x - pTo.x) < 20;
                const isRelated = selected && (from.id === selected.id || to.id === selected.id);

                let d = '';
                if (isSameCol) {
                  const startX = pFrom.x;
                  const startY = pFrom.y + BOX_H / 2 + 2;
                  const endX = pTo.x;
                  const endY = pTo.y - BOX_H / 2 - 4;
                  d = `M ${startX} ${startY} L ${endX} ${endY}`;
                } else {
                  const startX = pFrom.x + BOX_W / 2 + 2;
                  const startY = pFrom.y;
                  const endX = pTo.x - BOX_W / 2 - 4;
                  const endY = pTo.y;
                  const midX = (startX + endX) / 2;
                  d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
                }

                return (
                  <path
                    key={`${from.id}-${to.id}`}
                    d={d}
                    fill="none"
                    stroke={isRelated ? '#526BFF' : '#CBD5E1'}
                    strokeWidth={isRelated ? 2.25 : 1.5}
                    markerEnd={isRelated ? 'url(#edvanta-arrow-active)' : 'url(#edvanta-arrow)'}
                  />
                );
              })}
            </svg>

            {concepts.map((c) => {
              const pos = getPos(c);
              const palette = statusColors(c.status);
              const isSelected = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    width: `${(BOX_W / VIEW_W) * 100}%`,
                    height: `${(BOX_H / VIEW_H) * 100}%`,
                    left: `${((pos.x - BOX_W / 2) / VIEW_W) * 100}%`,
                    top: `${((pos.y - BOX_H / 2) / VIEW_H) * 100}%`,
                  }}
                  aria-pressed={isSelected}
                  className={`absolute rounded-xl border px-2.5 py-2 text-left transition-all flex flex-col justify-between overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526BFF] ${
                    palette.bg
                  } ${
                    isSelected
                      ? 'border-[#526BFF] ring-2 ring-[#526BFF]/25 shadow-sm'
                      : `${palette.border} hover:border-slate-400`
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-display text-[11px] font-semibold text-[#101827] leading-tight line-clamp-2">
                      {c.name}
                    </span>
                    <span className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${palette.accent}`}>
                      {c.attemptCount === 0 ? '—' : `${c.masteryScore}%`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <MasteryStatusText status={c.status} />
                    <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${masteryBarColor(c.status)}`}
                        style={{ width: `${c.attemptCount === 0 ? 0 : c.masteryScore}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile responsive concept list */}
        <div className="md:hidden space-y-3">
          {concepts.map((c) => {
            const palette = statusColors(c.status);
            const isSelected = selected?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${palette.bg} ${
                  isSelected ? 'border-[#526BFF] ring-2 ring-[#526BFF]/20' : palette.border
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-sm font-semibold text-[#101827]">{c.name}</span>
                  <span className={`font-mono text-sm font-semibold tabular-nums ${palette.accent}`}>
                    {c.attemptCount === 0 ? 'Not started' : `${c.masteryScore}%`}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <MasteryStatusText status={c.status} />
                  <span className="font-mono">{c.keyFormula}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Concept Inspector */}
      {selected && (
        <div className="xl:col-span-4 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <MasteryStatusText status={selected.status} />
              <span className="font-mono text-xs text-slate-500">{selected.keyFormula}</span>
            </div>
            <h3 className="font-display text-xl font-bold text-[#101827] mt-2">{selected.name}</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{selected.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Mastery</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-[#101827] mt-0.5">
                {selected.attemptCount === 0 ? '—' : `${selected.masteryScore}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Attempts</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-[#101827] mt-0.5">
                {selected.attemptCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Accuracy</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-[#101827] mt-0.5">
                {selected.attemptCount > 0
                  ? `${Math.round((selected.correctCount / selected.attemptCount) * 100)}%`
                  : '—'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700">Prerequisites</h4>
            {selected.prerequisites.length === 0 ? (
              <p className="text-xs text-slate-500 mt-1.5">Foundational concept — no prerequisites required.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {selected.prerequisites.map((pid) => {
                  const p = conceptById.get(pid);
                  if (!p) return null;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-[#101827]">{p.name}</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {p.attemptCount === 0 ? 'Not started' : `${p.masteryScore}%`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {onPracticeConcept && (
            <button
              type="button"
              onClick={() => onPracticeConcept(selected.id)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              Practice {selected.name}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
