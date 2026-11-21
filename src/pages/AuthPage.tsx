import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../../shared/types';
import { BrandHeader, EdvantaLogo } from '../components/brand/EdvantaBrand';

export function AuthPage() {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [gradeLevel, setGradeLevel] = useState('Class 10');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register' && name.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const signedIn =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register({
              name: name.trim(),
              email: email.trim(),
              password,
              role,
              gradeLevel: gradeLevel.trim() || 'Class 10',
            });
      showToast(`Signed in as ${signedIn.name}`, 'success');
      navigate(signedIn.role === 'teacher' ? '/teacher/overview' : '/student/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (demoRole: UserRole) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const signedIn = await demoLogin(demoRole);
      showToast(`Signed in to ${demoRole} demo account`, 'success');
      navigate(signedIn.role === 'teacher' ? '/teacher/overview' : '/student/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in to demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FC] flex flex-col">
      <BrandHeader
        variant="light"
        sticky={false}
        rightSlot={
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-[#101827] whitespace-nowrap">
            Back to overview
          </Link>
        }
      />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left: Form */}
          <div className="md:col-span-7 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 w-fit">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === 'login' ? 'bg-white text-[#101827] shadow-sm' : 'text-slate-600 hover:text-[#101827]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === 'register' ? 'bg-white text-[#101827] shadow-sm' : 'text-slate-600 hover:text-[#101827]'
                }`}
              >
                Create Account
              </button>
            </div>

            <h1 className="font-display text-2xl font-bold text-[#101827] mt-6">
              {mode === 'login' ? 'Sign in to EDVANTA' : 'Create your EDVANTA account'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {mode === 'login'
                ? 'Continue your adaptive study plan or inspect class analytics.'
                : 'Start with a fresh learner profile and take the Class 10 Electricity diagnostic.'}
            </p>

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-[#DC2626]"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {mode === 'register' && (
                <>
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Full name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Riya Verma"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="auth-role" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Role
                      </label>
                      <select
                        id="auth-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="auth-grade" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Class / Track
                      </label>
                      <input
                        id="auth-grade"
                        type="text"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        placeholder="Class 10"
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@edvanta.edu"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
              >
                {submitting
                  ? 'Authenticating...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account & Continue'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Right: Seeded Demo Access */}
          <div className="md:col-span-5 rounded-xl border border-slate-200 bg-[#101827] text-white p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <EdvantaLogo variant="dark" size="sm" showTagline className="mb-5" />
              <p className="text-xs font-semibold text-[#8B6CFF]">Instant Evaluation Access</p>
              <h2 className="font-display text-xl font-bold mt-2">
                Explore seeded demo workspaces
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Test the full adaptive loop immediately with persistent SQLite learner profiles and live class data.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemo('student')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-800 p-4 text-left transition-colors disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                      <GraduationCap className="h-4 w-4 text-[#526BFF]" aria-hidden="true" />
                      Demo Student — Aarav Sharma
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Includes baseline concept mastery, weak areas in Ohm&apos;s Law &amp; Series Circuits, and due
                    revisions.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemo('teacher')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-800 p-4 text-left transition-colors disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                      <Users className="h-4 w-4 text-[#8B6CFF]" aria-hidden="true" />
                      Demo Teacher — Dr. Elena Vance
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Inspect class-wide mastery gaps, common misconceptions across 5 students, and export CSV reports.
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 text-xs text-slate-400">
              Your progress, answers, and misconception records persist in SQLite across sessions.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
