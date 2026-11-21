import { useEffect, useState } from 'react';
import { Search, AlertCircle, ChevronRight, X } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { MasteryStatusText } from '../../components/StatusIndicator';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { TeacherOverviewPayload, TeacherStudentDetailPayload } from '../../../shared/types';

export function TeacherStudents() {
  const [overview, setOverview] = useState<TeacherOverviewPayload | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<TeacherOverviewPayload>('/api/teacher/overview');
        if (active) setOverview(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load student roster.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const inspectStudent = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await apiFetch<TeacherStudentDetailPayload>(`/api/teacher/students/${id}`);
      setSelectedStudent(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student history.');
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredStudents =
    overview?.students.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <AppShell title="Students">
      {loading ? (
        <div className="h-80 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      ) : error ? (
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Student Progress Table */}
          <SurfaceCard className={`${selectedStudent ? 'xl:col-span-7' : 'xl:col-span-12'} overflow-hidden`}>
            <div className="p-5 border-b border-[#E2E6F3] dark:border-[#2B3150] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Student Progress Roster
                </h2>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Select a student to inspect their concept mastery and reasoning log
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search
                  className="h-4 w-4 text-[#6E7696] dark:text-[#8892B5] absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Filter students by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                  className="w-full rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] pl-9 pr-3 py-2 text-xs text-[#14172B] dark:text-[#F4F6FF] placeholder:text-[#6E7696] focus:border-[#7055F7] focus:outline-none focus:ring-2 focus:ring-[#7055F7]/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 text-right">Mastery</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">Attempts</th>
                    <th className="py-3 px-4">Weakest Concept</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150] text-sm">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#6E7696] dark:text-[#8892B5] text-sm">
                        No students match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr
                        key={s.id}
                        className={`hover:bg-[#EEF1FA]/50 dark:hover:bg-[#212640]/60 transition-colors ${
                          selectedStudent?.student.id === s.id
                            ? 'bg-[#7055F7]/8 dark:bg-[#7055F7]/15'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#14172B] dark:text-[#F4F6FF]">{s.name}</p>
                          <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">{s.email}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                          {s.overallMastery}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#4E5674] dark:text-[#B4BDD9]">
                          {s.accuracyRate}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#4E5674] dark:text-[#B4BDD9]">
                          {s.totalAttempted}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
                          {s.weakestConcept || 'Not assessed'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => inspectStudent(s.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
                          >
                            Inspect
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          {/* Individual Student Learning History */}
          {(detailLoading || selectedStudent) && (
            <SurfaceCard className="xl:col-span-5 p-6 space-y-5">
              {detailLoading && !selectedStudent ? (
                <div className="h-64 animate-pulse bg-[#EEF1FA] dark:bg-[#212640] rounded-xl" />
              ) : (
                selectedStudent && (
                  <>
                    <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E2E6F3] dark:border-[#2B3150]">
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#14172B] dark:text-[#F4F6FF]">
                          {selectedStudent.student.name}
                        </h3>
                        <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">
                          {selectedStudent.student.email} · {selectedStudent.overallMastery}% overall mastery ·{' '}
                          {selectedStudent.accuracyRate}% accuracy
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(null)}
                        aria-label="Close student history panel"
                        className="p-1.5 rounded-lg text-[#6E7696] hover:text-[#14172B] dark:hover:text-white hover:bg-[#EEF1FA] dark:hover:bg-[#212640] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#4E5674] dark:text-[#B4BDD9] mb-2.5">
                        Concept Mastery
                      </h4>
                      <div className="space-y-2.5">
                        {selectedStudent.conceptMasteries.map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#14172B] dark:text-[#F4F6FF]">{c.name}</span>
                            <div className="flex items-center gap-3">
                              <MasteryStatusText status={c.status} />
                              <span className="font-mono font-semibold tabular-nums w-9 text-right text-[#14172B] dark:text-[#F4F6FF]">
                                {c.attemptCount === 0 ? '—' : `${c.masteryScore}%`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E2E6F3] dark:border-[#2B3150]">
                      <h4 className="text-xs font-semibold text-[#4E5674] dark:text-[#B4BDD9] mb-2.5">
                        Logged Misconceptions ({selectedStudent.misconceptions.length})
                      </h4>
                      {selectedStudent.misconceptions.length === 0 ? (
                        <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">
                          No misconceptions flagged for this student.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedStudent.misconceptions.slice(0, 4).map((m) => (
                            <div
                              key={m.id}
                              className="rounded-xl bg-[#EEF1FA]/70 dark:bg-[#212640] border border-[#E2E6F3] dark:border-[#2B3150] p-3 text-xs space-y-1"
                            >
                              <p className="font-semibold text-[#E5484D] dark:text-[#F87171]">{m.conceptName}</p>
                              <p className="font-medium text-[#14172B] dark:text-[#F4F6FF]">
                                {m.misconceptionTitle}
                              </p>
                              <p className="text-[#4E5674] dark:text-[#B4BDD9] italic">
                                &ldquo;{m.studentReasoning}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#E2E6F3] dark:border-[#2B3150]">
                      <h4 className="text-xs font-semibold text-[#4E5674] dark:text-[#B4BDD9] mb-2.5">
                        Recent Attempts
                      </h4>
                      {selectedStudent.recentAttempts.length === 0 ? (
                        <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">No attempts yet.</p>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {selectedStudent.recentAttempts.slice(0, 6).map((a) => (
                            <div
                              key={a.id}
                              className="text-xs border-b border-[#E2E6F3] dark:border-[#2B3150] pb-2 last:border-0"
                            >
                              <div className="flex items-center justify-between font-medium">
                                <span className="text-[#14172B] dark:text-[#F4F6FF]">{a.conceptName}</span>
                                <span
                                  className={
                                    a.isCorrect
                                      ? 'text-[#15996C] dark:text-[#27C991]'
                                      : 'text-[#E5484D] dark:text-[#F87171]'
                                  }
                                >
                                  {a.isCorrect ? 'Correct' : 'Incorrect'} ({a.masteryBefore}% → {a.masteryAfter}%)
                                </span>
                              </div>
                              {a.studentReasoning && (
                                <p className="text-[#6E7696] dark:text-[#8892B5] italic mt-0.5">
                                  &ldquo;{a.studentReasoning}&rdquo;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )
              )}
            </SurfaceCard>
          )}
        </div>
      )}
    </AppShell>
  );
}
