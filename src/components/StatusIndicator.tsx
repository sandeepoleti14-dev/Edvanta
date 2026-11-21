import { CheckCircle2, AlertTriangle, Clock, CircleDashed, TrendingUp } from 'lucide-react';
import { MasteryStatus } from '../../shared/types';

export function MasteryStatusText({ status }: { status: MasteryStatus }) {
  if (status === 'mastered') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Mastered
      </span>
    );
  }
  if (status === 'developing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D97706]">
        <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Developing
      </span>
    );
  }
  if (status === 'weak') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Weak
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Not started
    </span>
  );
}

export function RevisionStatusText({ status }: { status: 'due' | 'upcoming' | 'completed' }) {
  if (status === 'due') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Due now
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#526BFF]">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A]">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Completed
    </span>
  );
}

export function masteryBarColor(status: MasteryStatus): string {
  if (status === 'mastered') return 'bg-[#16A34A]';
  if (status === 'developing') return 'bg-[#D97706]';
  if (status === 'weak') return 'bg-[#DC2626]';
  return 'bg-slate-300';
}
