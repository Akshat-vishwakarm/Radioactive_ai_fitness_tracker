import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type {
  Habit,
  WorkoutPlan,
  WorkoutLog,
  NutritionGoal,
  MealEntry,
  ProgressEntry,
  Goal,
  MLConfig,
  MLPredictionResult,
  CalendarNote,
  FocusDeadline,
  UserPreferences,
  PersonalRecords,
} from '../types';
import { habitService } from '../services/habitService';
import { workoutService } from '../services/workoutService';
import { nutritionService } from '../services/nutritionService';
import { progressService } from '../services/progressService';
import { goalService } from '../services/goalService';
import { mlService } from '../services/ml/mlService';
import { calendarNoteService } from '../services/calendarNoteService';
import { focusDeadlineService } from '../services/focusDeadlineService';
import { firestoreService } from '../services/firestoreService';
import { formatLocalDate } from '../utils/dateUtils';

interface DataContextType {
  loading: boolean;
  habits: Habit[];
  completionsMap: Record<string, Record<string, boolean>>;
  streak: { currentStreak: number; bestStreak: number };
  workoutPlans: WorkoutPlan[];
  workoutLogs: WorkoutLog[];
  nutritionGoal: NutritionGoal | null;
  todayMeals: MealEntry[];
  allMeals: MealEntry[];
  todayConsumed: { calories: number; protein: number; carbs: number; fats: number };
  progressEntries: ProgressEntry[];
  latestWeight: number | null;
  goals: Goal[];
  calendarNotes: CalendarNote[];
  focusDeadlines: FocusDeadline[];
  activeDeadline: FocusDeadline | null;
  userPreferences: UserPreferences | null;
  personalRecords: PersonalRecords | null;
  mlConfig: MLConfig | null;
  mlPrediction: MLPredictionResult | null;
  refreshData: () => Promise<void>;
  toggleHabit: (habitId: string, dateStr: string) => Promise<boolean>;
  clearAllCompletions: () => Promise<void>;
  savePreferences: (updates: Partial<UserPreferences>) => Promise<UserPreferences>;
  saveCalendarNote: (
    date: string,
    noteText: string,
    weight?: number,
    activity?: string,
    tags?: string[]
  ) => Promise<CalendarNote>;
  deleteCalendarNote: (id: string) => Promise<void>;
  setFocusDeadline: (data: {
    title: string;
    target_date: string;
    category?: FocusDeadline['category'];
    target_note?: string;
  }) => Promise<FocusDeadline>;
  completeFocusDeadline: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completionsMap, setCompletionsMap] = useState<Record<string, Record<string, boolean>>>({});
  const [streak, setStreak] = useState<{ currentStreak: number; bestStreak: number }>({
    currentStreak: 0,
    bestStreak: 0,
  });
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [allMeals, setAllMeals] = useState<MealEntry[]>([]);
  const [todayConsumed, setTodayConsumed] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [focusDeadlines, setFocusDeadlines] = useState<FocusDeadline[]>([]);
  const [activeDeadline, setActiveDeadline] = useState<FocusDeadline | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecords | null>(null);
  const [mlConfig, setMlConfig] = useState<MLConfig | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MLPredictionResult | null>(null);

  // Fallback explicit refresher
  const refreshData = useCallback(async () => {
    if (!currentUser) {
      setHabits([]);
      setCompletionsMap({});
      setStreak({ currentStreak: 0, bestStreak: 0 });
      setWorkoutPlans([]);
      setWorkoutLogs([]);
      setNutritionGoal(null);
      setTodayMeals([]);
      setAllMeals([]);
      setTodayConsumed({ calories: 0, protein: 0, carbs: 0, fats: 0 });
      setProgressEntries([]);
      setLatestWeight(null);
      setGoals([]);
      setCalendarNotes([]);
      setFocusDeadlines([]);
      setActiveDeadline(null);
      setUserPreferences(null);
      setPersonalRecords(null);
      setMlConfig(null);
      setMlPrediction(null);
      setLoading(false);
      return;
    }

    const userId = currentUser.id;
    const todayStr = formatLocalDate();

    try {
      const [
        fetchedHabits,
        fetchedCompletionsMap,
        fetchedStreak,
        fetchedPlans,
        fetchedLogs,
        fetchedNutrGoal,
        dailyNutrSummary,
        fetchedAllMeals,
        fetchedProgress,
        fetchedWeight,
        fetchedGoals,
        fetchedNotes,
        fetchedDeadlines,
        activeDl,
        fetchedPrefs,
        fetchedPR,
        fetchedMLConfig,
        fetchedMLPrediction,
      ] = await Promise.all([
        habitService.getHabits(userId),
        habitService.getCompletionsMap(userId),
        habitService.calculateStreak(userId),
        workoutService.getWorkoutPlans(userId),
        workoutService.getWorkoutLogs(userId),
        nutritionService.getNutritionGoal(userId),
        nutritionService.getDailySummary(userId, todayStr),
        nutritionService.getMealEntries(userId),
        progressService.getProgressEntries(userId),
        progressService.getLatestWeight(userId),
        goalService.getGoals(userId),
        calendarNoteService.getAllNotes(userId),
        focusDeadlineService.getAllDeadlines(userId),
        focusDeadlineService.getActiveDeadline(userId),
        firestoreService.getPreferences(userId),
        firestoreService.getPersonalRecords(userId),
        mlService.getMLConfig(userId),
        mlService.getInsights(userId),
      ]);

      setHabits(fetchedHabits);
      setCompletionsMap(fetchedCompletionsMap);
      setStreak(fetchedStreak);
      setWorkoutPlans(fetchedPlans);
      setWorkoutLogs(fetchedLogs);
      setNutritionGoal(fetchedNutrGoal);
      setTodayMeals(dailyNutrSummary.entries);
      setAllMeals(fetchedAllMeals);
      setTodayConsumed(dailyNutrSummary.consumed);
      setProgressEntries(fetchedProgress);
      setLatestWeight(fetchedWeight);
      setGoals(fetchedGoals);
      setCalendarNotes(fetchedNotes);
      setFocusDeadlines(fetchedDeadlines);
      setActiveDeadline(activeDl);
      setUserPreferences(fetchedPrefs);
      setPersonalRecords(fetchedPR);
      setMlConfig(fetchedMLConfig);
      setMlPrediction(fetchedMLPrediction);
    } catch (err) {
      console.error('Error refreshing DataContext:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Real-time multi-device cloud synchronization listener
  useEffect(() => {
    if (!currentUser) {
      setHabits([]);
      setCompletionsMap({});
      setStreak({ currentStreak: 0, bestStreak: 0 });
      setWorkoutPlans([]);
      setWorkoutLogs([]);
      setNutritionGoal(null);
      setTodayMeals([]);
      setAllMeals([]);
      setTodayConsumed({ calories: 0, protein: 0, carbs: 0, fats: 0 });
      setProgressEntries([]);
      setLatestWeight(null);
      setGoals([]);
      setCalendarNotes([]);
      setFocusDeadlines([]);
      setActiveDeadline(null);
      setUserPreferences(null);
      setPersonalRecords(null);
      setMlConfig(null);
      setMlPrediction(null);
      setLoading(false);
      return;
    }

    const userId = currentUser.id;
    setLoading(true);

    // 1. One-time upload of any pre-existing local records that haven't reached cloud yet
    firestoreService.migrateLocalDataToCloud(userId).catch((err) => {
      console.warn('migrateLocalDataToCloud non-critical notice:', err);
    });

    // 2. Initial load from local/cache for instant responsiveness
    refreshData();

    // 3. Real-time multi-device Firestore onSnapshot subscriptions
    const unsubscribe = firestoreService.subscribeToUserData(userId, async (data) => {
      const todayStr = formatLocalDate();

      // Habits
      if (data.habits !== undefined) {
        setHabits(data.habits);
      }

      // Habit Completions Map & Streak
      const comps = data.habitCompletions || data.completions;
      if (comps !== undefined) {
        const map: Record<string, Record<string, boolean>> = {};
        const completedDates = new Set<string>();
        for (const c of comps) {
          if (!map[c.habit_id]) map[c.habit_id] = {};
          map[c.habit_id][c.date] = c.completed;
          if (c.completed) completedDates.add(c.date);
        }
        setCompletionsMap(map);

        // Calculate streak
        setHabits((currentHabits) => {
          const activeHabits = currentHabits.filter((h) => !h.archived);
          if (activeHabits.length > 0 && completedDates.size > 0) {
            let currentStreak = 0;
            let bestStreak = 0;
            let tempStreak = 0;
            let checkDate = new Date();
            const curDateStr = formatLocalDate(checkDate);
            const hasToday = completedDates.has(curDateStr);

            if (!hasToday) {
              checkDate.setDate(checkDate.getDate() - 1);
              while (completedDates.has(formatLocalDate(checkDate))) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
              }
            } else {
              while (completedDates.has(formatLocalDate(checkDate))) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
              }
            }

            const sortedDates = Array.from(completedDates).sort();
            let prevTime: number | null = null;
            for (const dStr of sortedDates) {
              const dateTime = new Date(dStr).getTime();
              if (prevTime === null) {
                tempStreak = 1;
              } else {
                const diffDays = Math.round((dateTime - prevTime) / (1000 * 3600 * 24));
                if (diffDays === 1) tempStreak++;
                else if (diffDays > 1) tempStreak = 1;
              }
              prevTime = dateTime;
              if (tempStreak > bestStreak) bestStreak = tempStreak;
            }

            setStreak({
              currentStreak,
              bestStreak: Math.max(bestStreak, currentStreak),
            });
          }
          return currentHabits;
        });
      }

      // Workout Plans & Logs
      if (data.workoutPlans !== undefined) {
        setWorkoutPlans(data.workoutPlans);
      }
      if (data.workoutLogs !== undefined) {
        setWorkoutLogs(data.workoutLogs);
      }

      // Nutrition Goal
      if (data.nutritionGoal !== undefined) {
        setNutritionGoal(data.nutritionGoal);
      }

      // Meals & Daily Summary
      if (data.mealEntries !== undefined) {
        setAllMeals(data.mealEntries);
        const todays = data.mealEntries.filter((m) => m.date === todayStr);
        setTodayMeals(todays);
        const consumed = todays.reduce(
          (acc, entry) => ({
            calories: acc.calories + (entry.calories || 0),
            protein: acc.protein + (entry.protein || 0),
            carbs: acc.carbs + (entry.carbs || 0),
            fats: acc.fats + (entry.fats || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );
        setTodayConsumed(consumed);
      }

      // Progress & Weight
      if (data.progressEntries !== undefined) {
        setProgressEntries(data.progressEntries);
        if (data.progressEntries.length > 0) {
          const sortedProgress = [...data.progressEntries].sort((a, b) => b.date.localeCompare(a.date));
          setLatestWeight(sortedProgress[0].weight ?? null);
        } else {
          setLatestWeight(null);
        }
      }

      // Goals
      if (data.goals !== undefined) {
        setGoals(data.goals);
      }

      // Calendar Notes
      if (data.calendarNotes !== undefined) {
        setCalendarNotes(data.calendarNotes);
      }

      // Focus Deadlines
      if (data.focusDeadlines !== undefined) {
        setFocusDeadlines(data.focusDeadlines);
        const activeList = data.focusDeadlines.filter((d) => d.active);
        if (activeList.length > 0) {
          setActiveDeadline(activeList.sort((a, b) => a.target_date.localeCompare(b.target_date))[0]);
        } else {
          setActiveDeadline(null);
        }
      }

      // User Preferences
      if (data.preferences !== undefined) {
        setUserPreferences(data.preferences);
      }

      // Personal Records
      if (data.personalRecords !== undefined) {
        setPersonalRecords(data.personalRecords);
      }

      // Once initial snapshot arrives, dismiss loading screen
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, refreshData]);

  const toggleHabit = async (habitId: string, dateStr: string): Promise<boolean> => {
    if (!currentUser) return false;
    const newStatus = await habitService.toggleCompletion(currentUser.id, habitId, dateStr);
    // Optimistic state update
    setCompletionsMap((prev) => {
      const nextHabit = { ...(prev[habitId] || {}) };
      nextHabit[dateStr] = newStatus;
      return { ...prev, [habitId]: nextHabit };
    });
    return newStatus;
  };

  const clearAllCompletions = async (): Promise<void> => {
    if (!currentUser) return;
    await habitService.clearAllCompletions(currentUser.id);
    setCompletionsMap({});
  };

  const savePreferences = async (updates: Partial<UserPreferences>): Promise<UserPreferences> => {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = await firestoreService.savePreferences(currentUser.id, updates);
    setUserPreferences(updated);
    return updated;
  };

  const saveCalendarNote = async (
    date: string,
    noteText: string,
    weight?: number,
    activity?: string,
    tags?: string[]
  ): Promise<CalendarNote> => {
    if (!currentUser) throw new Error('Not authenticated');
    const note = await calendarNoteService.saveNote(currentUser.id, date, noteText, weight, activity, tags);
    setCalendarNotes((prev) => {
      const filtered = prev.filter((n) => n.date !== date);
      return [...filtered, note];
    });
    return note;
  };

  const deleteCalendarNote = async (id: string): Promise<void> => {
    if (!currentUser) return;
    await calendarNoteService.deleteNote(currentUser.id, id);
    setCalendarNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const setFocusDeadline = async (data: {
    title: string;
    target_date: string;
    category?: FocusDeadline['category'];
    target_note?: string;
  }): Promise<FocusDeadline> => {
    if (!currentUser) throw new Error('Not authenticated');
    const created = await focusDeadlineService.setDeadline(currentUser.id, data);
    setActiveDeadline(created);
    setFocusDeadlines((prev) => [created, ...prev.map((d) => ({ ...d, active: false }))]);
    return created;
  };

  const completeFocusDeadline = async (id: string): Promise<void> => {
    if (!currentUser) return;
    await focusDeadlineService.completeDeadline(currentUser.id, id);
    setActiveDeadline(null);
    setFocusDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, active: false } : d)));
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        habits,
        completionsMap,
        streak,
        workoutPlans,
        workoutLogs,
        nutritionGoal,
        todayMeals,
        allMeals,
        todayConsumed,
        progressEntries,
        latestWeight,
        goals,
        calendarNotes,
        focusDeadlines,
        activeDeadline,
        userPreferences,
        personalRecords,
        mlConfig,
        mlPrediction,
        refreshData,
        toggleHabit,
        clearAllCompletions,
        savePreferences,
        saveCalendarNote,
        deleteCalendarNote,
        setFocusDeadline,
        completeFocusDeadline,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
