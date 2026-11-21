import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, ClipboardCheck } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../lib/api';
import { AuthUser } from '../../../shared/types';

export function ProfileSettingsPage() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [gradeLevel, setGradeLevel] = useState(user?.gradeLevel ?? 'Class 10');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      showToast('Name must be at least 2 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<{ user: AuthUser }>('/api/student/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), gradeLevel: gradeLevel.trim() || 'Class 10' }),
      });
      updateLocalUser({ ...user!, ...res.user });
      showToast('Profile settings saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Profile & Settings">
      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-[#101827]">Learner Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your display name or class track for teacher reports.
            </p>
          </div>

          <div>
            <label htmlFor="profile-name" className="block text-xs font-medium text-slate-700 mb-1.5">
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="profile-grade" className="block text-xs font-medium text-slate-700 mb-1.5">
                Grade / Track
              </label>
              <input
                id="profile-grade"
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#101827]">Diagnostic Recalibration</h3>
            <p className="text-xs text-slate-500 mt-1">
              Retake the 8-question Class 10 Electricity diagnostic to refresh your concept mastery baseline.
            </p>
          </div>
          <Link
            to="/student/diagnostic"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-medium text-[#101827] shrink-0 transition-colors"
          >
            <ClipboardCheck className="h-4 w-4 text-[#526BFF]" aria-hidden="true" />
            Launch Diagnostic
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
