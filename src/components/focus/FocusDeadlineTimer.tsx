import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { FocusDeadline } from '../../types';

interface TimeRemaining {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(targetIso: string): TimeRemaining {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { totalSeconds: Math.floor(diff / 1000), days, hours, minutes, seconds, isExpired: false };
}

export const FocusDeadlineTimer: React.FC<{ onDeadlineChange?: () => void }> = ({ onDeadlineChange }) => {
  const { currentUser } = useAuth();
  const { activeDeadline, setFocusDeadline, completeFocusDeadline } = useData();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeepFocusMode, setIsDeepFocusMode] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('23:59');
  const [category, setCategory] = useState<FocusDeadline['category']>('fitness');
  const [targetNote, setTargetNote] = useState('');

  // Update time remaining whenever activeDeadline updates (live from onSnapshot)
  useEffect(() => {
    if (activeDeadline) {
      setTimeRemaining(calculateTimeRemaining(activeDeadline.target_date));
    } else {
      setTimeRemaining(null);
    }
  }, [activeDeadline]);

  // Non-stop live ticker ticking every second
  useEffect(() => {
    if (!activeDeadline) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(activeDeadline.target_date);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDeadline]);

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title || !targetDate) return;

    const fullIso = `${targetDate}T${targetTime || '23:59'}:00`;
    await setFocusDeadline({
      title,
      target_date: fullIso,
      category,
      target_note: targetNote,
    });

    setIsModalOpen(false);
    if (onDeadlineChange) onDeadlineChange();
  };

  const handleComplete = async () => {
    if (!activeDeadline || !currentUser) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    await completeFocusDeadline(activeDeadline.id);
    if (onDeadlineChange) onDeadlineChange();
  };

  const handleClear = async () => {
    if (!activeDeadline || !currentUser) return;
    if (confirm('Reset this focus deadline?')) {
      await completeFocusDeadline(activeDeadline.id);
      if (onDeadlineChange) onDeadlineChange();
    }
  };

  const openCreateModal = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const dateStr = defaultDate.toISOString().split('T')[0];

    if (activeDeadline) {
      setTitle(activeDeadline.title);
      const parts = activeDeadline.target_date.split('T');
      setTargetDate(parts[0] || dateStr);
      setTargetTime(parts[1]?.substring(0, 5) || '23:59');
      setCategory(activeDeadline.category);
      setTargetNote(activeDeadline.target_note || '');
    } else {
      setTitle('');
      setTargetDate(dateStr);
      setTargetTime('23:59');
      setCategory('fitness');
      setTargetNote('');
    }
    setIsModalOpen(true);
  };

  const renderModal = () => {
    if (!isModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
            <h3 className="font-heading font-semibold text-base text-primary">
              {activeDeadline ? 'Edit Target Deadline' : 'Set New Focus Target'}
            </h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1 text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSaveDeadline} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-secondary uppercase mb-1">
                Target Objective Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Weight Loss (100kg baseline) or Marathon"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant rounded text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-secondary uppercase mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant rounded text-primary focus:outline-none focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-secondary uppercase mb-1">
                  Target Time
                </label>
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant rounded text-primary focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-secondary uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant rounded text-primary focus:outline-none focus:border-primary"
              >
                <option value="fitness">Fitness / Weight</option>
                <option value="nutrition">Nutrition & Diet</option>
                <option value="habit">Habit Streak</option>
                <option value="custom">General Deadline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-secondary uppercase mb-1">
                Target Focus Note / Motivation
              </label>
              <textarea
                rows={2}
                placeholder="Target reduction to 100kg sustainable athletic baseline."
                value={targetNote}
                onChange={(e) => setTargetNote(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant rounded text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium border border-outline-variant rounded bg-surface-container-lowest text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded bg-primary text-on-primary hover:bg-neutral-800 transition-colors"
              >
                Start Non-Stop Timer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Fullscreen Deep Focus Mode
  if (isDeepFocusMode && activeDeadline && timeRemaining) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 sm:p-12 animate-fade-in text-black">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
            <span className="font-mono text-xs uppercase tracking-widest text-secondary">
              DEEP FOCUS PROTOCOL
            </span>
          </div>
          <button
            onClick={() => setIsDeepFocusMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded text-xs font-medium hover:bg-neutral-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>Exit Fullscreen</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center my-auto text-center space-y-6">
          <span className="font-mono text-sm uppercase tracking-widest text-secondary">
            Primary Target Objective
          </span>
          <h1 className="font-heading text-4xl sm:text-6xl font-semibold tracking-tight text-black">
            {activeDeadline.title}
          </h1>
          {activeDeadline.target_note && (
            <p className="font-sans text-lg text-secondary max-w-xl">
              &ldquo;{activeDeadline.target_note}&rdquo;
            </p>
          )}

          {/* Massive Countdown Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-6">
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col items-center">
              <span className="font-heading text-5xl sm:text-7xl font-bold tracking-tight tabular-nums">
                {timeRemaining.days}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-secondary mt-2">Days</span>
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col items-center">
              <span className="font-heading text-5xl sm:text-7xl font-bold tracking-tight tabular-nums">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-secondary mt-2">Hours</span>
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col items-center">
              <span className="font-heading text-5xl sm:text-7xl font-bold tracking-tight tabular-nums">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-secondary mt-2">Minutes</span>
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col items-center">
              <span className="font-heading text-5xl sm:text-7xl font-bold tracking-tight tabular-nums">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-secondary mt-2">Seconds</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant pt-4 text-xs font-mono text-secondary">
          <span>Non-Stop Live Hardware Clock</span>
          <span>{timeRemaining.totalSeconds.toLocaleString()}s remaining</span>
        </div>
      </div>
    );
  }

  // If no deadline is set, show prompt card matching Stitch
  if (!activeDeadline || !timeRemaining) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded border border-primary font-mono text-[11px] text-primary uppercase font-medium bg-surface-container-lowest">
              High-Focus Countdown
            </span>
            <span className="font-mono text-xs text-secondary tracking-tight">/ NO TARGET ACTIVE</span>
          </div>
          <h3 className="font-heading text-xl font-semibold text-primary pt-1">
            Set an Immovable Target Deadline
          </h3>
          <p className="text-xs text-secondary max-w-xl leading-relaxed">
            Configure an uncompromised target date (e.g. Weight Loss, 30-Day Shred, Marathon). A non-stop live countdown timer will tick every second to keep focus absolute.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="h-9 px-4 bg-primary text-on-primary font-sans text-xs font-medium rounded border border-primary hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add_alarm</span>
          <span>Set Target Deadline</span>
        </button>

        {renderModal()}
      </div>
    );
  }

  // Active Countdown Timer Card matching Stitch
  const targetDateFormatted = new Date(activeDeadline.target_date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).toUpperCase();

  return (
    <>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 sm:p-6 flex flex-col gap-5">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-outline-variant pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded border border-primary font-mono text-[11px] text-primary uppercase font-medium bg-surface-container-lowest">
              High-Focus Countdown
            </span>
            <span className="font-mono text-xs text-secondary tracking-tight">
              / TARGET: {targetDateFormatted}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>DISCIPLINE PROTOCOL ACTIVE</span>
          </div>
        </div>

        {/* Primary Objective Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-medium">
              Primary Objective
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl text-primary tracking-tight font-semibold mt-1">
              {activeDeadline.title}
            </h2>
            {activeDeadline.target_note && (
              <p className="text-xs text-secondary mt-1">
                {activeDeadline.target_note}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDeepFocusMode(true)}
              className="h-9 px-4 bg-primary text-on-primary text-xs font-medium rounded border border-primary hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Focus Mode</span>
            </button>

            <button
              onClick={handleComplete}
              className="h-9 px-4 bg-surface-container-lowest text-primary text-xs font-medium rounded border border-outline-variant hover:bg-surface-container hover:border-primary transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Mark Achieved</span>
            </button>

            <button
              onClick={openCreateModal}
              title="Edit Deadline"
              className="h-9 w-9 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>

            <button
              onClick={handleClear}
              title="Reset Deadline"
              className="h-9 w-9 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container text-secondary hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>

        {/* Countdown Blocks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col">
            <span className="font-heading text-3xl sm:text-4xl text-primary font-semibold tracking-tight tabular-nums">
              {timeRemaining.days}
            </span>
            <span className="font-sans text-[11px] text-secondary uppercase tracking-widest mt-1 font-medium">
              Days
            </span>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col">
            <span className="font-heading text-3xl sm:text-4xl text-primary font-semibold tracking-tight tabular-nums">
              {String(timeRemaining.hours).padStart(2, '0')}
            </span>
            <span className="font-sans text-[11px] text-secondary uppercase tracking-widest mt-1 font-medium">
              Hours
            </span>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col">
            <span className="font-heading text-3xl sm:text-4xl text-primary font-semibold tracking-tight tabular-nums">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </span>
            <span className="font-sans text-[11px] text-secondary uppercase tracking-widest mt-1 font-medium">
              Minutes
            </span>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col">
            <span className="font-heading text-3xl sm:text-4xl text-primary font-semibold tracking-tight tabular-nums">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
            <span className="font-sans text-[11px] text-secondary uppercase tracking-widest mt-1 font-medium">
              Seconds
            </span>
          </div>
        </div>

        {/* Footer Sub-Bar with Raw Seconds */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pt-3 border-t border-outline-variant text-secondary font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-primary">timer</span>
            <span>Every second counts. Stay disciplined with today&apos;s habits and training.</span>
          </div>
          <div className="text-primary font-medium tracking-tight">
            <span>{timeRemaining.totalSeconds.toLocaleString()}</span>s remaining
          </div>
        </div>
      </div>

      {renderModal()}
    </>
  );
};
