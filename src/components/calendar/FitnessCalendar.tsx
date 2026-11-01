import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { progressService } from '../../services/progressService';
import type { CalendarNote } from '../../types';

export const FitnessCalendar: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    workoutLogs,
    allMeals,
    habits,
    completionsMap,
    calendarNotes,
    saveCalendarNote,
    deleteCalendarNote,
    refreshData,
  } = useData();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<Record<string, CalendarNote>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Selected date modal states
  const [noteText, setNoteText] = useState('');
  const [quickWeight, setQuickWeight] = useState<string>('');
  const [quickActivity, setQuickActivity] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Sync notes directly from DataContext's real-time cloud snapshot
  useEffect(() => {
    const map: Record<string, CalendarNote> = {};
    calendarNotes.forEach((n) => {
      map[n.date] = n;
    });
    setNotes(map);
  }, [calendarNotes]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // 0 = Sunday, 1 = Monday ... Monday as index 0
  const startingDayIndex = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateKey = (day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const openDateModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = notes[dateStr];
    if (existing) {
      setNoteText(existing.note || '');
      setQuickWeight(existing.weight ? String(existing.weight) : '');
      setQuickActivity(existing.activity || '');
    } else {
      setNoteText('');
      setQuickWeight('');
      setQuickActivity('');
    }
    setSaveSuccessMsg('');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedDate) return;

    setIsSaving(true);
    const weightNum = quickWeight.trim() ? parseFloat(quickWeight) : undefined;
    const activityStr = quickActivity.trim() || undefined;

    await saveCalendarNote(
      selectedDate,
      noteText.trim(),
      weightNum,
      activityStr
    );

    // If user provided a weight log in their daily note, also log to progress entries
    if (weightNum && !isNaN(weightNum)) {
      await progressService.addProgressEntry({
        user_id: currentUser.id,
        date: selectedDate,
        weight: weightNum,
        notes: `Logged via Calendar note: ${noteText.trim() || 'Daily weight record'}`,
      }).catch(() => {});
      await refreshData();
    }

    setIsSaving(false);
    setSaveSuccessMsg('Note saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleDeleteNote = async () => {
    if (!currentUser || !selectedDate || !notes[selectedDate]) return;
    if (confirm('Delete note for this date?')) {
      await deleteCalendarNote(notes[selectedDate].id);
      setSelectedDate(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
            <h2 className="font-heading text-lg font-semibold text-primary">
              {monthNames[month]} {year}
            </h2>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Click on any date to attach notes (e.g. &apos;weight 85 run 3 km&apos;), log metrics, and view journal history.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded border border-outline-variant bg-surface hover:bg-neutral-100 text-primary text-xs font-medium transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-outline-variant rounded bg-surface p-0.5">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded hover:bg-neutral-200 text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded hover:bg-neutral-200 text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 sm:p-6 shadow-sm space-y-3">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono uppercase text-secondary font-medium py-1 border-b border-outline-variant">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for offset */}
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[85px] sm:min-h-[105px] rounded bg-surface/40 border border-transparent opacity-30 pointer-events-none" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatDateKey(dayNum);
            const isToday = dateStr === todayStr;
            const noteEntry = notes[dateStr];

            const workoutsOnDate = workoutLogs.filter((w) => w.date === dateStr);
            const mealsOnDate = allMeals.filter((m) => m.date === dateStr);
            const hasHabitDone = habits.some(
              (h) => completionsMap[h.id] && completionsMap[h.id][dateStr]
            );

            return (
              <div
                key={dateStr}
                onClick={() => openDateModal(dateStr)}
                className={`min-h-[85px] sm:min-h-[105px] rounded p-2 sm:p-2.5 flex flex-col justify-between cursor-pointer transition-colors border group ${
                  isToday
                    ? 'border-2 border-primary bg-surface-container'
                    : noteEntry
                    ? 'border-neutral-400 bg-surface hover:bg-neutral-100'
                    : 'border-outline-variant bg-surface-container-lowest hover:border-neutral-400 hover:bg-surface'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono ${isToday ? 'font-bold text-primary' : 'text-primary'}`}>
                    {dayNum}
                  </span>

                  {isToday && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-primary border border-primary px-1 rounded bg-surface-container-lowest">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Day Note Snippet if present */}
                {noteEntry && (
                  <div className="bg-surface-container border border-outline-variant p-1 rounded text-[10px] font-mono text-primary truncate mt-1">
                    {noteEntry.note || (noteEntry.weight ? `${noteEntry.weight}kg` : 'Note')}
                  </div>
                )}

                {/* Activity Badge Counters */}
                <div className="flex items-center gap-1 flex-wrap pt-1 font-mono text-[9px] text-secondary">
                  {workoutsOnDate.length > 0 && (
                    <span title={`${workoutsOnDate.length} workout(s) logged`} className="px-1 py-0.2 rounded border border-outline-variant bg-surface">
                      GYM
                    </span>
                  )}
                  {mealsOnDate.length > 0 && (
                    <span title={`${mealsOnDate.length} meal(s) logged`} className="px-1 py-0.2 rounded border border-outline-variant bg-surface">
                      MEAL
                    </span>
                  )}
                  {hasHabitDone && (
                    <span title="Habits completed" className="px-1 py-0.2 rounded border border-outline-variant bg-surface">
                      HABIT
                    </span>
                  )}
                  {noteEntry?.weight && (
                    <span title={`Weight: ${noteEntry.weight}kg`} className="text-primary font-bold ml-auto">
                      {noteEntry.weight}k
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-secondary pt-3 border-t border-outline-variant flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 border border-outline-variant rounded bg-surface text-[10px] text-primary">HABIT</span>
            <span>Habits Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 border border-outline-variant rounded bg-surface text-[10px] text-primary">GYM</span>
            <span>Workout Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 border border-outline-variant rounded bg-surface text-[10px] text-primary">MEAL</span>
            <span>Meals Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="border border-outline-variant rounded bg-surface-container px-1 text-[10px] text-primary">Note</span>
            <span>Date Note</span>
          </div>
        </div>
      </div>

      {/* Date Details & Note Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <h3 className="font-heading font-semibold text-base text-primary">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="text-xs font-mono text-secondary">{selectedDate}</div>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="bg-surface border border-primary text-primary p-2.5 rounded text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Note Form */}
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-secondary mb-1">
                  Daily Note / Training Reflection *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Today weight 85, run 3 km, hit personal record on bench press."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-container-low border border-outline-variant text-primary text-xs leading-relaxed resize-none focus:outline-none focus:border-primary"
                />
              </div>

              {/* Quick Metric Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-secondary mb-1">
                    Quick Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 85"
                    value={quickWeight}
                    onChange={(e) => setQuickWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-surface-container-low border border-outline-variant text-primary text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-secondary mb-1">
                    Activity / Run
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Run 3 km, 5x5 Squats"
                    value={quickActivity}
                    onChange={(e) => setQuickActivity(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-surface-container-low border border-outline-variant text-primary text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                {notes[selectedDate] ? (
                  <button
                    type="button"
                    onClick={handleDeleteNote}
                    className="flex items-center gap-1 text-error text-xs font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Delete Note</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="px-4 py-2 rounded border border-outline-variant text-secondary hover:text-primary transition-colors text-xs font-medium cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded bg-primary text-on-primary hover:bg-neutral-800 transition-colors text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Date Note'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
