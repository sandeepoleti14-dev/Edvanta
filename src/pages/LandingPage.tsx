import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  GitBranch,
  CalendarClock,
  LineChart,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BrandHeader, EdvantaLogo } from '../components/brand/EdvantaBrand';
import { ThemeSegmentedControl } from '../components/ui/ThemePrimitives';

export function LandingPage() {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [heroImgError, setHeroImgError] = useState(false);
  const [labImgError, setLabImgError] = useState(false);
  const [busyRole, setBusyRole] = useState<'student' | 'teacher' | null>(null);

  const handleQuickDemo = async (role: 'student' | 'teacher') => {
    setBusyRole(role);
    try {
      await demoLogin(role);
      navigate(role === 'teacher' ? '/teacher/overview' : '/student/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to start demo session', 'error');
    } finally {
      setBusyRole(null);
    }
  };

  const primaryCtaTarget = user
    ? user.role === 'teacher'
      ? '/teacher/overview'
      : '/student/dashboard'
    : '/auth';

  return (
    <div className="min-h-screen bg-[#F6F7FC] dark:bg-[#111322] text-[#14172B] dark:text-[#F4F6FF] flex flex-col transition-colors">
      {/* Top Bar Contract: [Brand wordmark] — [4 nav links] — [Theme + CTA] */}
      <BrandHeader
        variant="auto"
        centerNav={
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4E5674] dark:text-[#B4BDD9]"
          >
            <a href="#how-it-works" className="hover:text-[#14172B] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#capabilities" className="hover:text-[#14172B] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Capabilities
            </a>
            <a href="#benefits" className="hover:text-[#14172B] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              For Classrooms
            </a>
            <a href="#preview" className="hover:text-[#14172B] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Live Preview
            </a>
          </nav>
        }
        rightSlot={
          <>
            <ThemeSegmentedControl compact />
            <Link
              to={primaryCtaTarget}
              className="inline-flex items-center justify-center rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              {user ? 'Open Workspace' : 'Get Started'}
            </Link>
          </>
        }
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-semibold text-[#7055F7] dark:text-[#A493FF] mb-3">
                EDVANTA · Learn Smarter. Grow Further.
              </p>
              <h1
                className="font-display font-bold tracking-tight text-[#14172B] dark:text-[#F4F6FF] leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Learn Smarter. Master What Matters Most.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed max-w-xl">
                Conventional quizzes only count right or wrong answers. EDVANTA maintains a persistent
                concept-by-concept learner model, inspects written student reasoning to uncover hidden
                misconceptions, and schedules targeted spaced repetition.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={busyRole !== null}
                  onClick={() => handleQuickDemo('student')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 whitespace-nowrap shadow-xs"
                >
                  {busyRole === 'student' ? 'Loading Student Demo...' : 'Launch Student Demo'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={busyRole !== null}
                  onClick={() => handleQuickDemo('teacher')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#181B2E] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] px-5 py-3 text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF] transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {busyRole === 'teacher' ? 'Loading Teacher Demo...' : 'Explore Teacher Dashboard'}
                </button>
                <Link
                  to="/auth"
                  className="text-sm font-medium text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white underline underline-offset-4 whitespace-nowrap"
                >
                  Sign in or register
                </Link>
              </div>

              <div className="mt-10 pt-6 border-t border-[#E2E6F3] dark:border-[#2B3150] grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">8</p>
                  <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">Electricity concepts mapped</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">3 Tiers</p>
                  <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">Adaptive question difficulty</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">Real-Time</p>
                  <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">Reasoning misconception diagnosis</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#14172B] overflow-hidden flex flex-col shadow-[var(--shadow-card)]">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_physics_studio_1795247410314.jpg"
                    alt="Architectural electrical schematic workspace representing EDVANTA concept mastery mapping"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-64 sm:h-80 lg:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-64 sm:h-80 lg:h-full bg-gradient-to-br from-[#111322] via-[#181B2E] to-[#212640] flex items-center justify-center p-8 text-[#B4BDD9]">
                    <div className="text-center space-y-2">
                      <Brain className="h-10 w-10 text-[#7055F7] mx-auto" />
                      <p className="font-display text-base font-semibold text-white">
                        Persistent Concept Mastery Engine
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Product Dashboard Preview */}
        <section id="preview" className="bg-white dark:bg-[#181B2E] border-y border-[#E2E6F3] dark:border-[#2B3150] py-16 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">Inside the Learner Model</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-1.5">
                Every concept tracked independently, updated on every explanation
              </h2>
              <p className="text-sm sm:text-base text-[#4E5674] dark:text-[#B4BDD9] mt-2">
                Instead of collapsing a student&apos;s knowledge into a single quiz percentage, EDVANTA models mastery,
                prerequisite readiness, and diagnosed misconceptions across each syllabus concept.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#F6F7FC] dark:bg-[#111322] p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-6 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E6F3] dark:border-[#2B3150]">
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                        Sample Learner Profile — Class 10 Electricity
                      </h3>
                      <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                        Concept mastery drives question selection and spaced-repetition intervals
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#7055F7] dark:text-[#A493FF]">
                      59% Overall
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {[
                      { name: 'Electric Current', score: 84, status: 'Mastered', bar: 'bg-[#27C991]', text: 'text-[#15996C] dark:text-[#27C991]' },
                      { name: 'Electric Power', score: 78, status: 'Mastered', bar: 'bg-[#27C991]', text: 'text-[#15996C] dark:text-[#27C991]' },
                      { name: 'Potential Difference', score: 74, status: 'Developing', bar: 'bg-[#F6B94A]', text: 'text-[#B46E00] dark:text-[#F6B94A]' },
                      { name: "Ohm's Law", score: 38, status: 'Weak', bar: 'bg-[#E5484D]', text: 'text-[#E5484D] dark:text-[#F87171]' },
                      { name: 'Series Circuits', score: 34, status: 'Weak', bar: 'bg-[#E5484D]', text: 'text-[#E5484D] dark:text-[#F87171]' },
                    ].map((row) => (
                      <div key={row.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[#14172B] dark:text-[#F4F6FF]">{row.name}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium ${row.text}`}>{row.status}</span>
                            <span className="font-mono text-xs font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF] w-10 text-right">
                              {row.score}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#EEF1FA] dark:bg-[#212640] overflow-hidden">
                          <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-6 flex flex-col justify-between space-y-5 shadow-[var(--shadow-card)]">
                  <div>
                    <p className="text-xs font-semibold text-[#477BFF] dark:text-[#759EFF]">Misconception Detection Sample</p>
                    <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] mt-1">
                      Ohm&apos;s Law Reasoning Check
                    </h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="rounded-xl bg-[#EEF1FA]/70 dark:bg-[#212640] border border-[#E2E6F3] dark:border-[#2B3150] p-3">
                        <p className="text-xs font-medium text-[#6E7696] dark:text-[#8892B5]">Student written reasoning</p>
                        <p className="text-[#14172B] dark:text-[#F4F6FF] mt-1 italic">
                          &ldquo;Current increases because resistance increases when connected to the battery.&rdquo;
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#E5484D]/8 dark:bg-[#E5484D]/12 border border-[#E5484D]/30 p-3">
                        <p className="text-xs font-semibold text-[#E5484D] dark:text-[#F87171]">Identified Misconception</p>
                        <p className="text-[#14172B] dark:text-[#F4F6FF] mt-1 font-medium">
                          Misunderstands the inverse relationship between current and resistance.
                        </p>
                        <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1.5 leading-relaxed">
                          Correction: At constant voltage, I = V / R means higher resistance restricts charge flow,
                          reducing current proportionally.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#E2E6F3] dark:border-[#2B3150] flex items-center justify-between text-xs text-[#6E7696] dark:text-[#8892B5]">
                    <span>Next revision scheduled: Due today</span>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('student')}
                      className="font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
                    >
                      Try live in workspace →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">How It Works</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-1.5">
              A closed diagnostic-to-mastery loop
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01. Baseline Diagnostic',
                desc: 'Eight targeted questions map initial mastery across all Class 10 Electricity concepts and establish prerequisite baselines.',
              },
              {
                num: '02. Adaptive Questioning',
                desc: 'Weak concepts receive priority practice at calibrated difficulty (Easy, Medium, Hard) without repetitive drilling.',
              },
              {
                num: '03. Misconception Analysis',
                desc: 'Gemini inspects optional written explanations to distinguish lucky guesses or simple slips from deep conceptual flaws.',
              },
              {
                num: '04. Spaced Repetition',
                desc: 'Weak or misunderstood concepts are queued for immediate review while mastered concepts space out up to 14 days.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-6 shadow-[var(--shadow-card)]"
              >
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">{step.num}</h3>
                <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-2.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core AI Capabilities (Asymmetric Bento Grid) */}
        <section id="capabilities" className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">Core Intelligence</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-1.5">
              Built for genuine conceptual clarity
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] overflow-hidden flex flex-col shadow-[var(--shadow-card)]">
              <div className="p-6 pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                  <GitBranch className="h-4 w-4" aria-hidden="true" />
                  Concept Knowledge Graph & Prerequisite Tracing
                </div>
                <h3 className="font-display text-xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-2">
                  Visualize mastery across connected physics principles
                </h3>
                <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1.5">
                  When a student struggles with Electric Power or Series Circuits, EDVANTA traces upstream
                  prerequisites like Ohm&apos;s Law and Resistance to fix root gaps first.
                </p>
              </div>
              <div className="mt-auto px-6 pb-6">
                <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] overflow-hidden bg-[#EEF1FA] dark:bg-[#212640] h-52">
                  {!labImgError ? (
                    <img
                      src="/src/assets/images/concept_circuit_lab_1795247411273.jpg"
                      alt="Precision circuit board drafting diagram showing electrical components"
                      referrerPolicy="no-referrer"
                      onError={() => setLabImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6E7696] text-sm">
                      Electricity Syllabus Concept Graph
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-6 flex-1 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#477BFF] dark:text-[#759EFF]">
                  <Brain className="h-4 w-4" aria-hidden="true" />
                  Transparent Scoring Algorithm
                </div>
                <h3 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF] mt-2">
                  Deterministic learner model updates
                </h3>
                <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1.5 leading-relaxed">
                  Mastery scores are computed transparently on the server using correctness, question difficulty, and
                  reasoning alignment—never invented arbitrarily by an LLM.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-6 flex-1 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#15996C] dark:text-[#27C991]">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Adaptive Spaced Repetition
                </div>
                <h3 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF] mt-2">
                  Database-backed revision scheduling
                </h3>
                <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1.5 leading-relaxed">
                  Every attempt recalculates when a student next needs to revisit a concept, keeping weak ideas fresh
                  without wasting time on mastered topics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Student & Teacher Benefits */}
        <section id="benefits" className="bg-white dark:bg-[#181B2E] border-y border-[#E2E6F3] dark:border-[#2B3150] py-16 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#F6F7FC] dark:bg-[#111322] p-7">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#7055F7] dark:text-[#A493FF]">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
                For Students
              </div>
              <h3 className="font-display text-xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-2">
                Focused exam preparation without guesswork
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-[#4E5674] dark:text-[#B4BDD9]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#27C991] mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Pinpoints exact sub-concepts holding back overall physics scores</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#27C991] mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Explains why a line of reasoning failed in clear, step-by-step terms</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#27C991] mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Automates daily revision queues based on real retention strength</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#F6F7FC] dark:bg-[#111322] p-7">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                <Users className="h-5 w-5 text-[#35C9D8]" aria-hidden="true" />
                For Teachers
              </div>
              <h3 className="font-display text-xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-2">
                Classroom-wide visibility into conceptual gaps
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-[#4E5674] dark:text-[#B4BDD9]">
                <li className="flex items-start gap-2.5">
                  <LineChart className="h-4 w-4 text-[#477BFF] mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Aggregates concept mastery across every student in the section</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <LineChart className="h-4 w-4 text-[#477BFF] mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Surfaces the most frequent misconceptions with verbatim student reasoning</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <LineChart className="h-4 w-4 text-[#477BFF] mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Exports structured CSV progress reports for targeted classroom remediation</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <div className="rounded-2xl border border-[#2B3150] bg-[#14172B] dark:bg-[#181B2E] text-white p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                See adaptive mastery and misconception detection in action
              </h2>
              <p className="text-[#B4BDD9] text-sm sm:text-base mt-2">
                Start with a seeded student or teacher workspace, or create a new student account to run the full
                diagnostic from scratch.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap"
              >
                Open Sign In
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E7696] dark:text-[#8892B5]">
          <EdvantaLogo variant="auto" size="sm" showTagline />
          <div className="flex items-center gap-5">
            <span>Class 10 Physics — Electricity Curriculum</span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('edvanta:replay-intro'))}
              className="font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
            >
              Replay Intro
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
