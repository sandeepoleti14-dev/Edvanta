import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, ClipboardCheck, Sun, Moon, Monitor, Bot, Eye, EyeOff } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ThemePreference, useTheme } from '../../context/ThemeContext';
import { useCompanion } from '../../context/CompanionContext';
import { apiFetch } from '../../lib/api';
import { AuthUser } from '../../../shared/types';

export function ProfileSettingsPage() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { preference, resolvedTheme, setPreference } = useTheme();
  const { isHidden, setIsHidden } = useCompanion();

  const [name, setName] = useState(user?.name ?? '');
  const [gradeLevel, setGradeLevel] = useState(user?.gradeLevel ?? 'Java DSA');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      showToast('Name must be between 2 and 80 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<{ user: AuthUser }>('/api/student/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), gradeLevel: gradeLevel.trim() || 'Java DSA' }),
      });
      updateLocalUser({ ...user!, ...res.user });
      showToast('Profile settings saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const themeCards: Array<{
    id: ThemePreference;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'light', title: 'Light Mode', desc: 'Clean airy #F6F7FC studio canvas', icon: Sun },
    { id: 'dark', title: 'Dark Mode', desc: 'Deep #111322 focus workspace', icon: Moon },
    { id: 'system', title: 'System Sync', desc: `Follows OS (${resolvedTheme} active)`, icon: Monitor },
  ];

  return (
    <AppShell title="Profile & Settings">
      <div className="max-w-2xl space-y-6">
        {/* Appearance / Light & Dark Theme Selector */}
        <SurfaceCard className="p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Appearance &amp; Theme
            </h2>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
              Choose Light, Dark, or follow your device preference. Saved automatically across reloads.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeCards.map((card) => {
              const Icon = card.icon;
              const active = preference === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setPreference(card.id);
                    showToast(`Theme set to ${card.title}`, 'info');
                  }}
                  aria-pressed={active}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    active
                      ? 'border-[#7055F7] bg-[#7055F7]/8 dark:bg-[#7055F7]/15 ring-2 ring-[#7055F7]/20'
                      : 'border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/40 dark:bg-[#212640]/50 hover:border-[#CBD3E8] dark:hover:border-[#3C456D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-[#7055F7] dark:text-[#A493FF]' : 'text-[#6E7696]'}`}
                      aria-hidden="true"
                    />
                    {active && (
                      <span className="text-[11px] font-semibold text-[#7055F7] dark:text-[#A493FF]">Active</span>
                    )}
                  </div>
                  <p className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF] mt-2.5">
                    {card.title}
                  </p>
                  <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">{card.desc}</p>
                </button>
              );
            })}
          </div>
        </SurfaceCard>

        {/* Byte AI Companion Preferences */}
        <SurfaceCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#7055F7]/12 text-[#7055F7] dark:text-[#A493FF] flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Byte AI Study Companion
              </h3>
              <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                {isHidden
                  ? 'Byte is currently hidden from your workspace.'
                  : 'Byte accompanies your practice sessions and celebrates milestones.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !isHidden;
              setIsHidden(next);
              showToast(next ? 'Byte companion hidden' : 'Byte companion restored', 'info');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-4 py-2 text-xs font-semibold text-[#14172B] dark:text-[#F4F6FF] shrink-0 transition-colors"
          >
            {isHidden ? <Eye className="h-4 w-4 text-[#27C991]" /> : <EyeOff className="h-4 w-4 text-[#6E7696]" />}
            {isHidden ? 'Show Byte' : 'Hide Byte'}
          </button>
        </SurfaceCard>

        {/* Learner Profile Form */}
        <form onSubmit={handleSave}>
          <SurfaceCard className="p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">Learner Profile</h2>
              <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                Update your display name or class track for teacher reports.
              </p>
            </div>

            <div>
              <label htmlFor="profile-name" className="block text-xs font-medium text-[#4E5674] dark:text-[#B4BDD9] mb-1.5">
                Full name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] px-3.5 py-2.5 text-sm text-[#14172B] dark:text-[#F4F6FF] focus:border-[#7055F7] focus:outline-none focus:ring-2 focus:ring-[#7055F7]/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-email" className="block text-xs font-medium text-[#4E5674] dark:text-[#B4BDD9] mb-1.5">
                  Email address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/60 px-3.5 py-2.5 text-sm text-[#6E7696] dark:text-[#8892B5]"
                />
              </div>
              <div>
                <label htmlFor="profile-grade" className="block text-xs font-medium text-[#4E5674] dark:text-[#B4BDD9] mb-1.5">
                  Grade / Track
                </label>
                <input
                  id="profile-grade"
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] px-3.5 py-2.5 text-sm text-[#14172B] dark:text-[#F4F6FF] focus:border-[#7055F7] focus:outline-none focus:ring-2 focus:ring-[#7055F7]/20"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </SurfaceCard>
        </form>

        <SurfaceCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Diagnostic Recalibration
            </h3>
            <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">
              Retake the 8-question Java DSA diagnostic to refresh your topic mastery baseline.
            </p>
          </div>
          <Link
            to="/student/diagnostic"
            className="inline-flex items-center gap-2 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-4 py-2 text-xs font-semibold text-[#14172B] dark:text-[#F4F6FF] shrink-0 transition-colors"
          >
            <ClipboardCheck className="h-4 w-4 text-[#7055F7]" aria-hidden="true" />
            Launch Diagnostic
          </Link>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
