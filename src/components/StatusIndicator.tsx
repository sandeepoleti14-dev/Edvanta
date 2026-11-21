import { CheckCircle2, AlertTriangle, Clock, CircleDashed, TrendingUp } from 'lucide-react';
import { MasteryStatus } from '../../shared/types';

export function MasteryStatusText({ status }: { status: MasteryStatus }) {
  if (status === 'mastered') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15996C] dark:text-[#27C991]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Mastered
      </span>
    );
  }
  if (status === 'developing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B46E00] dark:text-[#F6B94A]">
        <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Developing
      </span>
    );
  }
  if (status === 'weak') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E5484D] dark:text-[#F87171]">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Weak
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">
      <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Not started
    </span>
  );
}

export function RevisionStatusText({ status }: { status: 'due' | 'upcoming' | 'completed' }) {
  if (status === 'due') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E5484D] dark:text-[#F87171]">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Due now
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#477BFF] dark:text-[#759EFF]">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15996C] dark:text-[#27C991]">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Completed
    </span>
  );
}

export function masteryBarColor(status: MasteryStatus): string {
  if (status === 'mastered') return 'bg-[#27C991]';
  if (status === 'developing') return 'bg-[#F6B94A]';
  if (status === 'weak') return 'bg-[#E5484D]';
  return 'bg-[#CBD3E8] dark:bg-[#3C456D]';
}
