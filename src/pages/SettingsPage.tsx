import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../db/database';
import { firestoreService } from '../services/firestoreService';
import { ApiIntegrationSection } from '../components/settings/ApiIntegrationSection';

export const SettingsPage: React.FC = () => {
  const { currentUser, users, switchUser, createUser } = useAuth();
  const { userPreferences, savePreferences, refreshData } = useData();

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [msg, setMsg] = useState('');

  // Preference form states
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    userPreferences?.unit_system || 'metric'
  );
  const [waterTarget, setWaterTarget] = useState<number>(
    userPreferences?.daily_water_target_ml || 2500
  );
  const [calorieTarget, setCalorieTarget] = useState<number>(
    userPreferences?.daily_calorie_target || 2200
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingPrefs(true);
    try {
      await savePreferences({
        unit_system: unitSystem,
        daily_water_target_ml: Number(waterTarget) || 2500,
        daily_calorie_target: Number(calorieTarget) || 2200,
      });
      setMsg('User preferences updated and synchronized to cloud.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setMsg('Failed to update preferences: ' + (err?.message || err));
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    await createUser(
      newUserName.trim(),
      newUserEmail.trim() || `${newUserName.toLowerCase().replace(/\s+/g, '')}@fittrack.ai`
    );
    setNewUserName('');
    setNewUserEmail('');
    await refreshData();
    setMsg('New profile registered and activated.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleResetCurrentUserData = async () => {
    if (!currentUser) return;
    if (
      confirm(
        `Are you sure you want to delete all cloud and local fitness records for profile "${currentUser.name}"? This operation propagates across all devices and cannot be reversed.`
      )
    ) {
      const uid = currentUser.id;
      // 1. Clear all cloud Firestore subcollections
      await firestoreService.clearUserData(uid);

      // 2. Clear local Dexie database
      await db.transaction(
        'rw',
        [
          db.habits,
          db.habitCompletions,
          db.workoutPlans,
          db.workoutLogs,
          db.nutritionGoals,
          db.mealEntries,
          db.progressEntries,
          db.goals,
          db.focusDeadlines,
          db.calendarNotes,
        ],
        async () => {
          await db.habits.where('user_id').equals(uid).delete();
          await db.habitCompletions.where('user_id').equals(uid).delete();
          await db.workoutPlans.where('user_id').equals(uid).delete();
          await db.workoutLogs.where('user_id').equals(uid).delete();
          await db.nutritionGoals.where('user_id').equals(uid).delete();
          await db.mealEntries.where('user_id').equals(uid).delete();
          await db.progressEntries.where('user_id').equals(uid).delete();
          await db.goals.where('user_id').equals(uid).delete();
          await db.focusDeadlines.where('user_id').equals(uid).delete();
          await db.calendarNotes.where('user_id').equals(uid).delete();
        }
      );
      await refreshData();
      setMsg(`Profile "${currentUser.name}" reset to baseline zero state across all devices.`);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleExportJSON = async () => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const exportData = {
      user: currentUser,
      preferences: userPreferences,
      habits: await db.habits.where('user_id').equals(uid).toArray(),
      completions: await db.habitCompletions.where('user_id').equals(uid).toArray(),
      workoutPlans: await db.workoutPlans.where('user_id').equals(uid).toArray(),
      workoutLogs: await db.workoutLogs.where('user_id').equals(uid).toArray(),
      nutritionGoals: await db.nutritionGoals.where('user_id').equals(uid).toArray(),
      mealEntries: await db.mealEntries.where('user_id').equals(uid).toArray(),
      progressEntries: await db.progressEntries.where('user_id').equals(uid).toArray(),
      goals: await db.goals.where('user_id').equals(uid).toArray(),
      calendarNotes: await db.calendarNotes.where('user_id').equals(uid).toArray(),
      focusDeadlines: await db.focusDeadlines.where('user_id').equals(uid).toArray(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack_backup_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">MODULE 08 &bull; CONFIGURATION</div>
          <h1 className="font-heading text-xl font-bold text-on-surface tracking-tight">SETTINGS &amp; INTEGRATIONS</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Cross-device cloud persistence, user preferences, API keys, and account telemetry.
          </p>
        </div>

        <span className="px-3 py-1 rounded text-[10px] font-mono font-bold bg-surface-variant border border-outline text-on-surface uppercase tracking-wider self-start sm:self-auto">
          FITTRACK OS v2.4
        </span>
      </div>

      {msg && (
        <div className="bg-surface-variant border border-outline text-on-surface p-3.5 rounded-lg text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg('')} className="text-[11px] font-bold uppercase underline">Dismiss</button>
        </div>
      )}

      {/* Cloud Synchronization Status Card */}
      <div className="bg-surface border border-outline rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Cloud Architecture</div>
            <h2 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-Time Cross-Device Synchronization
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
            LIVE SYNC
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-surface-container-lowest p-3.5 rounded-lg border border-outline space-y-1">
            <div className="text-on-surface-variant text-[11px] uppercase">Canonical Account UID</div>
            <div className="font-bold text-on-surface truncate">{currentUser?.id || 'Not authenticated'}</div>
          </div>
          <div className="bg-surface-container-lowest p-3.5 rounded-lg border border-outline space-y-1">
            <div className="text-on-surface-variant text-[11px] uppercase">Real-Time Listeners (onSnapshot)</div>
            <div className="font-bold text-emerald-700">12 Sub-Collections Active &bull; Instant Multi-Device Push</div>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Changes made on your laptop, tablet, or phone automatically update across all other active sessions via Google Cloud Firestore listeners. Offline updates are cached locally in IndexedDB and reconcile automatically when connection restores.
        </p>
      </div>

      {/* User Preferences Form */}
      <div className="bg-surface border border-outline rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Preferences &amp; Units</div>
            <h2 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider">
              Telemetry &amp; Target Preferences
            </h2>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-on-surface-variant mb-1 font-bold">
                Unit System
              </label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value as 'metric' | 'imperial')}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
              >
                <option value="metric">Metric (kg, km, ml)</option>
                <option value="imperial">Imperial (lbs, miles, fl oz)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-on-surface-variant mb-1 font-bold">
                Daily Water Target (ml)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                step="50"
                value={waterTarget}
                onChange={(e) => setWaterTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-on-surface-variant mb-1 font-bold">
                Daily Calorie Target (kcal)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                step="50"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPrefs}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-[#222222] text-on-primary font-heading text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingPrefs ? 'Saving to Cloud...' : 'Save & Sync Preferences'}
          </button>
        </form>
      </div>

      {/* Personal API Token Integration Section */}
      <ApiIntegrationSection />

      {/* Active Profiles Selector */}
      <div className="bg-surface border border-outline rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Identity Architecture</div>
            <h2 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider">
              Registered User Profiles
            </h2>
          </div>
          <span className="text-[10px] font-mono text-on-surface-variant">
            {users.length} {users.length === 1 ? 'Profile' : 'Profiles'} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map((u) => {
            const isActive = currentUser?.id === u.id;
            return (
              <div
                key={u.id}
                onClick={async () => {
                  await switchUser(u.id);
                  await refreshData();
                }}
                className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-surface-variant border-primary ring-1 ring-primary'
                    : 'bg-surface border-outline hover:bg-surface-variant/40'
                }`}
              >
                <div>
                  <div className="font-heading font-bold text-sm text-on-surface">{u.name}</div>
                  <div className="text-xs text-on-surface-variant font-mono">{u.email}</div>
                </div>
                {isActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary uppercase tracking-wider">
                    CURRENT
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Profile Form */}
        <form onSubmit={handleCreateUser} className="pt-4 border-t border-outline space-y-3">
          <div className="text-xs font-heading font-bold text-on-surface uppercase tracking-wide">
            Add Isolated User Profile
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Full Name (e.g. Alex Morgan)"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-surface border border-outline text-on-surface text-xs focus:outline-none focus:border-primary font-mono"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-surface border border-outline text-on-surface text-xs focus:outline-none focus:border-primary font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary hover:bg-[#222222] text-on-primary font-heading text-xs font-bold transition-colors cursor-pointer"
          >
            + Create &amp; Switch Profile
          </button>
        </form>
      </div>

      {/* Database Operations */}
      <div className="bg-surface border border-outline rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-outline">
          <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Storage Protocol</div>
          <h2 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider">
            Cloud &amp; IndexedDB Data Operations
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-[#222222] text-on-primary font-heading font-bold text-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Cloud &amp; Local JSON Backup</span>
          </button>

          <button
            onClick={handleResetCurrentUserData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-variant border border-outline text-on-surface font-heading font-bold text-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset Active Profile Records (Cloud &amp; Local)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
