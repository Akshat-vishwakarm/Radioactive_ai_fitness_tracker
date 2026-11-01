import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestoreDb } from '../firebase/config';
import { db } from '../db/database';
import type {
  User,
  Habit,
  HabitCompletion,
  WorkoutPlan,
  WorkoutLog,
  NutritionGoal,
  MealEntry,
  ProgressEntry,
  Goal,
  CalendarNote,
  FocusDeadline,
  UserPreferences,
  PersonalRecords,
} from '../types';

export interface UserCloudData {
  habits: Habit[];
  completions: HabitCompletion[];
  habitCompletions: HabitCompletion[];
  workoutPlans: WorkoutPlan[];
  workoutLogs: WorkoutLog[];
  nutritionGoal: NutritionGoal | null;
  mealEntries: MealEntry[];
  progressEntries: ProgressEntry[];
  goals: Goal[];
  calendarNotes: CalendarNote[];
  focusDeadlines: FocusDeadline[];
  preferences: UserPreferences | null;
  personalRecords: PersonalRecords | null;
}

export const firestoreService = {
  // Scoped sub-collection helper
  getUserCol(uid: string, collectionName: string) {
    return collection(firestoreDb, 'users', uid, collectionName);
  },

  // Save or update user profile upon login
  async syncUserProfile(uid: string, email: string, name: string, photoURL?: string): Promise<User> {
    const fallbackUser: User = {
      id: uid,
      name: name || 'Athlete',
      email: email || '',
      avatar: photoURL || '',
      created_at: new Date().toISOString(),
    };

    try {
      const userRef = doc(firestoreDb, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap && snap.exists && snap.exists()) {
        const data = snap.data();
        updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          name: name || data.name,
          email: email || data.email,
          avatar: photoURL || data.avatar,
        }).catch(() => {});

        return {
          id: uid,
          name: name || data.name,
          email: email || data.email,
          avatar: photoURL || data.avatar,
          created_at: data.created_at || new Date().toISOString(),
        };
      } else {
        await setDoc(userRef, {
          userId: uid,
          name: fallbackUser.name,
          email: fallbackUser.email,
          avatar: fallbackUser.avatar,
          created_at: fallbackUser.created_at,
          lastLoginAt: serverTimestamp(),
        });
        return fallbackUser;
      }
    } catch (err) {
      console.warn('[Firestore] syncUserProfile notice:', err);
      return fallbackUser;
    }
  },

  // =========================================================================
  // MULTI-DEVICE REAL-TIME SYCHRONIZATION (onSnapshot)
  // =========================================================================
  subscribeToUserData(
    uid: string,
    onDataUpdated: (data: Partial<UserCloudData>) => void
  ): () => void {
    console.log(`[Firestore Sync] Activating real-time cloud listeners for UID: ${uid}`);
    const unsubs: Unsubscribe[] = [];

    // 1. Habits real-time listener
    try {
      const unsubHabits = onSnapshot(
        this.getUserCol(uid, 'habits'),
        (snapshot) => {
          const habits = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit));
          console.log(`[Firestore Sync] Real-time habits update: ${habits.length} records`);
          onDataUpdated({ habits });
          // Mirror to local Dexie for offline availability
          habits.forEach((h) => db.habits.put(h).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Habits listener error:', err)
      );
      unsubs.push(unsubHabits);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach habits listener:', e);
    }

    // 2. Habit Completions real-time listener
    try {
      const unsubCompletions = onSnapshot(
        this.getUserCol(uid, 'habitCompletions'),
        (snapshot) => {
          const completions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as HabitCompletion));
          onDataUpdated({ completions, habitCompletions: completions });
          completions.forEach((c) => db.habitCompletions.put(c).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Completions listener error:', err)
      );
      unsubs.push(unsubCompletions);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach completions listener:', e);
    }

    // 3. Workout Plans real-time listener
    try {
      const unsubPlans = onSnapshot(
        this.getUserCol(uid, 'workoutPlans'),
        (snapshot) => {
          const workoutPlans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutPlan));
          console.log(`[Firestore Sync] Real-time workout plans update: ${workoutPlans.length} records`);
          onDataUpdated({ workoutPlans });
          workoutPlans.forEach((p) => db.workoutPlans.put(p).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Workout plans listener error:', err)
      );
      unsubs.push(unsubPlans);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach workout plans listener:', e);
    }

    // 4. Workout Logs real-time listener
    try {
      const unsubLogs = onSnapshot(
        this.getUserCol(uid, 'workoutLogs'),
        (snapshot) => {
          const workoutLogs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutLog));
          onDataUpdated({ workoutLogs });
          workoutLogs.forEach((l) => db.workoutLogs.put(l).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Workout logs listener error:', err)
      );
      unsubs.push(unsubLogs);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach workout logs listener:', e);
    }

    // 5. Nutrition Goals real-time listener
    try {
      const unsubNutrGoal = onSnapshot(
        this.getUserCol(uid, 'nutritionGoals'),
        (snapshot) => {
          if (!snapshot.empty) {
            const goalDoc = snapshot.docs[0];
            const nutritionGoal = { id: goalDoc.id, ...goalDoc.data() } as NutritionGoal;
            onDataUpdated({ nutritionGoal });
            db.nutritionGoals.put(nutritionGoal).catch(() => {});
          } else {
            onDataUpdated({ nutritionGoal: null });
          }
        },
        (err) => console.warn('[Firestore Sync] Nutrition goal listener error:', err)
      );
      unsubs.push(unsubNutrGoal);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach nutrition goal listener:', e);
    }

    // 6. Meal Entries real-time listener
    try {
      const unsubMeals = onSnapshot(
        this.getUserCol(uid, 'mealEntries'),
        (snapshot) => {
          const mealEntries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MealEntry));
          onDataUpdated({ mealEntries });
          mealEntries.forEach((m) => db.mealEntries.put(m).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Meal entries listener error:', err)
      );
      unsubs.push(unsubMeals);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach meal entries listener:', e);
    }

    // 7. Progress Entries real-time listener
    try {
      const unsubProgress = onSnapshot(
        this.getUserCol(uid, 'progressEntries'),
        (snapshot) => {
          const progressEntries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressEntry));
          onDataUpdated({ progressEntries });
          progressEntries.forEach((p) => db.progressEntries.put(p).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Progress entries listener error:', err)
      );
      unsubs.push(unsubProgress);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach progress listener:', e);
    }

    // 8. Goals real-time listener
    try {
      const unsubGoals = onSnapshot(
        this.getUserCol(uid, 'goals'),
        (snapshot) => {
          const goals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
          onDataUpdated({ goals });
          goals.forEach((g) => db.goals.put(g).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Goals listener error:', err)
      );
      unsubs.push(unsubGoals);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach goals listener:', e);
    }

    // 9. Calendar Notes real-time listener
    try {
      const unsubNotes = onSnapshot(
        this.getUserCol(uid, 'calendarNotes'),
        (snapshot) => {
          const calendarNotes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarNote));
          onDataUpdated({ calendarNotes });
          calendarNotes.forEach((n) => db.calendarNotes.put(n).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Calendar notes listener error:', err)
      );
      unsubs.push(unsubNotes);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach calendar notes listener:', e);
    }

    // 10. Focus Deadlines real-time listener
    try {
      const unsubDeadlines = onSnapshot(
        this.getUserCol(uid, 'focusDeadlines'),
        (snapshot) => {
          const focusDeadlines = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FocusDeadline));
          onDataUpdated({ focusDeadlines });
          focusDeadlines.forEach((d) => db.focusDeadlines.put(d).catch(() => {}));
        },
        (err) => console.warn('[Firestore Sync] Focus deadlines listener error:', err)
      );
      unsubs.push(unsubDeadlines);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach focus deadlines listener:', e);
    }

    // 11. User Preferences real-time listener
    try {
      const unsubPrefs = onSnapshot(
        this.getUserCol(uid, 'preferences'),
        (snapshot) => {
          if (!snapshot.empty) {
            const docData = snapshot.docs[0];
            const preferences = { id: docData.id, ...docData.data() } as UserPreferences;
            onDataUpdated({ preferences });
          } else {
            onDataUpdated({ preferences: null });
          }
        },
        (err) => console.warn('[Firestore Sync] Preferences listener error:', err)
      );
      unsubs.push(unsubPrefs);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach preferences listener:', e);
    }

    // 12. Personal Records real-time listener
    try {
      const unsubPR = onSnapshot(
        this.getUserCol(uid, 'personalRecords'),
        (snapshot) => {
          if (!snapshot.empty) {
            const docData = snapshot.docs[0];
            const personalRecords = { id: docData.id, ...docData.data() } as PersonalRecords;
            onDataUpdated({ personalRecords });
          } else {
            onDataUpdated({ personalRecords: null });
          }
        },
        (err) => console.warn('[Firestore Sync] Personal records listener error:', err)
      );
      unsubs.push(unsubPR);
    } catch (e) {
      console.warn('[Firestore Sync] Failed to attach personal records listener:', e);
    }

    // Return combined cleanup function
    return () => {
      console.log(`[Firestore Sync] Cleaning up real-time listeners for UID: ${uid}`);
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // Ignore cleanup errors
        }
      });
    };
  },

  // =========================================================================
  // ONE-TIME LOCAL DATA MIGRATION TO CLOUD
  // =========================================================================
  async migrateLocalDataToCloud(uid: string): Promise<void> {
    const migrationFlagKey = `fittrack_cloud_migrated_${uid}`;
    try {
      console.log(`[Migration] Checking local records to migrate to Firestore for UID: ${uid}...`);

      // 1. Migrate Local Habits
      const localHabits = await db.habits.where('user_id').equals(uid).toArray();
      if (localHabits.length > 0) {
        for (const h of localHabits) {
          const docRef = doc(firestoreDb, 'users', uid, 'habits', h.id);
          await setDoc(docRef, h, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localHabits.length} habits to Firestore`);
      }

      // 2. Migrate Local Habit Completions
      const localComps = await db.habitCompletions.where('user_id').equals(uid).toArray();
      if (localComps.length > 0) {
        for (const c of localComps) {
          const docRef = doc(firestoreDb, 'users', uid, 'habitCompletions', c.id);
          await setDoc(docRef, c, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localComps.length} completions to Firestore`);
      }

      // 3. Migrate Local Workout Plans
      const localPlans = await db.workoutPlans.where('user_id').equals(uid).toArray();
      if (localPlans.length > 0) {
        for (const p of localPlans) {
          const docRef = doc(firestoreDb, 'users', uid, 'workoutPlans', p.id);
          await setDoc(docRef, p, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localPlans.length} workout plans to Firestore`);
      }

      // 4. Migrate Local Workout Logs
      const localLogs = await db.workoutLogs.where('user_id').equals(uid).toArray();
      if (localLogs.length > 0) {
        for (const l of localLogs) {
          const docRef = doc(firestoreDb, 'users', uid, 'workoutLogs', l.id);
          await setDoc(docRef, l, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localLogs.length} workout logs to Firestore`);
      }

      // 5. Migrate Local Nutrition Goal
      const localGoal = await db.nutritionGoals.where('user_id').equals(uid).first();
      if (localGoal) {
        const docRef = doc(firestoreDb, 'users', uid, 'nutritionGoals', localGoal.id || 'default_goal');
        await setDoc(docRef, localGoal, { merge: true }).catch(() => {});
        console.log(`[Migration] Migrated nutrition goal to Firestore`);
      }

      // 6. Migrate Local Meal Entries
      const localMeals = await db.mealEntries.where('user_id').equals(uid).toArray();
      if (localMeals.length > 0) {
        for (const m of localMeals) {
          const docRef = doc(firestoreDb, 'users', uid, 'mealEntries', m.id);
          await setDoc(docRef, m, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localMeals.length} meal entries to Firestore`);
      }

      // 7. Migrate Local Progress Entries
      const localProg = await db.progressEntries.where('user_id').equals(uid).toArray();
      if (localProg.length > 0) {
        for (const p of localProg) {
          const docRef = doc(firestoreDb, 'users', uid, 'progressEntries', p.id);
          await setDoc(docRef, p, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localProg.length} progress entries to Firestore`);
      }

      // 8. Migrate Local Goals
      const localGoals = await db.goals.where('user_id').equals(uid).toArray();
      if (localGoals.length > 0) {
        for (const g of localGoals) {
          const docRef = doc(firestoreDb, 'users', uid, 'goals', g.id);
          await setDoc(docRef, g, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localGoals.length} goals to Firestore`);
      }

      // 9. Migrate Local Calendar Notes
      const localNotes = await db.calendarNotes.where('user_id').equals(uid).toArray();
      if (localNotes.length > 0) {
        for (const n of localNotes) {
          const docRef = doc(firestoreDb, 'users', uid, 'calendarNotes', n.id);
          await setDoc(docRef, n, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localNotes.length} calendar notes to Firestore`);
      }

      // 10. Migrate Local Focus Deadlines
      const localDeadlines = await db.focusDeadlines.where('user_id').equals(uid).toArray();
      if (localDeadlines.length > 0) {
        for (const d of localDeadlines) {
          const docRef = doc(firestoreDb, 'users', uid, 'focusDeadlines', d.id);
          await setDoc(docRef, d, { merge: true }).catch(() => {});
        }
        console.log(`[Migration] Migrated ${localDeadlines.length} focus deadlines to Firestore`);
      }

      localStorage.setItem(migrationFlagKey, 'true');
    } catch (err) {
      console.warn('[Migration] Error during local data migration:', err);
    }
  },

  // =========================================================================
  // CLOUD DATA PERSISTENCE CRUD OPERATIONS
  // =========================================================================

  // Habits
  async getHabits(uid: string): Promise<Habit[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'habits'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Habit));
      }
    } catch (err) {
      console.warn('[Firestore] getHabits error, falling back to local Dexie:', err);
    }
    return await db.habits.where('user_id').equals(uid).toArray();
  },

  async saveHabit(uid: string, habit: Habit): Promise<Habit> {
    const docRef = doc(firestoreDb, 'users', uid, 'habits', habit.id);
    await setDoc(docRef, habit, { merge: true });
    await db.habits.put(habit).catch(() => {});
    return habit;
  },

  async addHabit(uid: string, habit: Habit | Omit<Habit, 'id' | 'created_at' | 'archived'>): Promise<Habit> {
    if ('id' in habit && habit.id) {
      return this.saveHabit(uid, habit as Habit);
    }
    const newId = 'hbt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const docData: Habit = {
      ...habit,
      id: newId,
      user_id: uid,
      archived: false,
      created_at: new Date().toISOString(),
    };
    return this.saveHabit(uid, docData);
  },

  async updateHabit(uid: string, habitId: string, updates: Partial<Habit>): Promise<void> {
    const docRef = doc(firestoreDb, 'users', uid, 'habits', habitId);
    await updateDoc(docRef, updates).catch(() => setDoc(docRef, updates, { merge: true }));
    await db.habits.update(habitId, updates).catch(() => {});
  },

  async deleteHabit(uid: string, habitId: string): Promise<void> {
    const docRef = doc(firestoreDb, 'users', uid, 'habits', habitId);
    await deleteDoc(docRef);
    await db.habits.delete(habitId).catch(() => {});
    await db.habitCompletions.where('habit_id').equals(habitId).delete().catch(() => {});
  },

  // Habit Completions
  async getCompletions(uid: string): Promise<HabitCompletion[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'habitCompletions'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HabitCompletion));
      }
    } catch (err) {
      console.warn('[Firestore] getCompletions error, falling back to local Dexie:', err);
    }
    return await db.habitCompletions.where('user_id').equals(uid).toArray();
  },

  async toggleCompletion(uid: string, habitId: string, dateStr: string): Promise<boolean> {
    const colRef = this.getUserCol(uid, 'habitCompletions');
    const q = query(colRef, where('habit_id', '==', habitId), where('date', '==', dateStr));
    const snap = await getDocs(q);

    if (snap && !snap.empty) {
      const existingDoc = snap.docs[0];
      const newStatus = !existingDoc.data().completed;
      await updateDoc(doc(firestoreDb, 'users', uid, 'habitCompletions', existingDoc.id), {
        completed: newStatus,
      });
      await db.habitCompletions.update(existingDoc.id, { completed: newStatus }).catch(() => {});
      return newStatus;
    } else {
      const compId = 'hbc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newComp: HabitCompletion = {
        id: compId,
        user_id: uid,
        habit_id: habitId,
        date: dateStr,
        completed: true,
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(firestoreDb, 'users', uid, 'habitCompletions', compId), newComp);
      await db.habitCompletions.put(newComp).catch(() => {});
      return true;
    }
  },

  async clearAllCompletions(uid: string): Promise<void> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'habitCompletions'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      await db.habitCompletions.where('user_id').equals(uid).delete().catch(() => {});
    } catch (err) {
      console.warn('clearAllCompletions error:', err);
    }
  },

  // Workout Plans
  async getWorkoutPlans(uid: string): Promise<WorkoutPlan[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'workoutPlans'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutPlan));
      }
    } catch (err) {
      console.warn('[Firestore] getWorkoutPlans error, falling back to local Dexie:', err);
    }
    return await db.workoutPlans.where('user_id').equals(uid).toArray();
  },

  async saveWorkoutPlan(
    uid: string,
    dayOfWeek: number,
    workoutName: string,
    muscleGroup: string,
    exercises: WorkoutPlan['exercises'],
    planId?: string
  ): Promise<WorkoutPlan> {
    const docId = planId || `wp_${uid}_day_${dayOfWeek}`;
    const planData: WorkoutPlan = {
      id: docId,
      user_id: uid,
      day_of_week: dayOfWeek,
      workout_name: workoutName,
      muscle_group: muscleGroup,
      exercises,
      created_at: new Date().toISOString(),
    };

    const docRef = doc(firestoreDb, 'users', uid, 'workoutPlans', docId);
    await setDoc(docRef, planData, { merge: true });
    await db.workoutPlans.put(planData).catch(() => {});
    return planData;
  },

  async deleteWorkoutPlan(uid: string, planId: string, dayOfWeek?: number): Promise<void> {
    const docRef = doc(firestoreDb, 'users', uid, 'workoutPlans', planId);
    await deleteDoc(docRef);
    await db.workoutPlans.delete(planId).catch(() => {});
    if (dayOfWeek !== undefined) {
      const colRef = this.getUserCol(uid, 'workoutPlans');
      const q = query(colRef, where('day_of_week', '==', dayOfWeek));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      await db.workoutPlans.where({ user_id: uid, day_of_week: dayOfWeek }).delete().catch(() => {});
    }
  },

  // Workout Logs
  async getWorkoutLogs(uid: string): Promise<WorkoutLog[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'workoutLogs'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutLog));
      }
    } catch (err) {
      console.warn('[Firestore] getWorkoutLogs error, falling back to local Dexie:', err);
    }
    return await db.workoutLogs.where('user_id').equals(uid).toArray();
  },

  async logWorkout(uid: string, log: Omit<WorkoutLog, 'id' | 'created_at'>): Promise<WorkoutLog> {
    const logId = 'wl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const docData: WorkoutLog = {
      ...log,
      id: logId,
      user_id: uid,
      created_at: new Date().toISOString(),
    };
    const docRef = doc(firestoreDb, 'users', uid, 'workoutLogs', logId);
    await setDoc(docRef, docData);
    await db.workoutLogs.put(docData).catch(() => {});
    return docData;
  },

  // Nutrition Goals
  async getNutritionGoal(uid: string): Promise<NutritionGoal | null> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'nutritionGoals'));
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as NutritionGoal;
      }
    } catch (err) {
      console.warn('[Firestore] getNutritionGoal error, falling back to local Dexie:', err);
    }
    const localGoal = await db.nutritionGoals.where('user_id').equals(uid).first();
    return localGoal || null;
  },

  async saveNutritionGoal(
    uid: string,
    goals: { calories: number; protein: number; carbs: number; fats: number }
  ): Promise<NutritionGoal> {
    const docId = `ng_${uid}`;
    const data: NutritionGoal = {
      id: docId,
      user_id: uid,
      ...goals,
      updated_at: new Date().toISOString(),
    };

    const docRef = doc(firestoreDb, 'users', uid, 'nutritionGoals', docId);
    await setDoc(docRef, data, { merge: true });
    await db.nutritionGoals.put(data).catch(() => {});
    return data;
  },

  // Meal Entries
  async getMealEntries(uid: string): Promise<MealEntry[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'mealEntries'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MealEntry));
      }
    } catch (err) {
      console.warn('[Firestore] getMealEntries error, falling back to local Dexie:', err);
    }
    return await db.mealEntries.where('user_id').equals(uid).toArray();
  },

  async addMealEntry(uid: string, meal: Omit<MealEntry, 'id' | 'created_at'>): Promise<MealEntry> {
    const mealId = 'ml_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const docData: MealEntry = {
      ...meal,
      id: mealId,
      user_id: uid,
      created_at: new Date().toISOString(),
    };
    const docRef = doc(firestoreDb, 'users', uid, 'mealEntries', mealId);
    await setDoc(docRef, docData);
    await db.mealEntries.put(docData).catch(() => {});
    return docData;
  },

  async updateMealEntry(uid: string, id: string, updates: Partial<MealEntry>): Promise<void> {
    const docRef = doc(firestoreDb, 'users', uid, 'mealEntries', id);
    await updateDoc(docRef, updates).catch(() => setDoc(docRef, updates, { merge: true }));
    await db.mealEntries.update(id, updates).catch(() => {});
  },

  async deleteMealEntry(uid: string, id: string): Promise<void> {
    const docRef = doc(firestoreDb, 'users', uid, 'mealEntries', id);
    await deleteDoc(docRef);
    await db.mealEntries.delete(id).catch(() => {});
  },

  // Progress Entries
  async getProgressEntries(uid: string): Promise<ProgressEntry[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'progressEntries'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressEntry));
      }
    } catch (err) {
      console.warn('[Firestore] getProgressEntries error, falling back to local Dexie:', err);
    }
    return await db.progressEntries.where('user_id').equals(uid).sortBy('date');
  },

  async addProgressEntry(uid: string, entry: Omit<ProgressEntry, 'id' | 'created_at'>): Promise<ProgressEntry> {
    const colRef = this.getUserCol(uid, 'progressEntries');
    const q = query(colRef, where('date', '==', entry.date));
    const snap = await getDocs(q);

    let docId: string;
    let fullData: ProgressEntry;

    if (snap && !snap.empty) {
      docId = snap.docs[0].id;
      fullData = { id: docId, created_at: snap.docs[0].data().created_at || new Date().toISOString(), ...entry };
      await updateDoc(doc(firestoreDb, 'users', uid, 'progressEntries', docId), entry);
    } else {
      docId = 'pe_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      fullData = { id: docId, ...entry, user_id: uid, created_at: new Date().toISOString() };
      await setDoc(doc(firestoreDb, 'users', uid, 'progressEntries', docId), fullData);
    }

    await db.progressEntries.put(fullData).catch(() => {});
    return fullData;
  },

  async deleteProgressEntry(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, 'users', uid, 'progressEntries', id));
    await db.progressEntries.delete(id).catch(() => {});
  },

  // Goals
  async getGoals(uid: string): Promise<Goal[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'goals'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
      }
    } catch (err) {
      console.warn('[Firestore] getGoals error, falling back to local Dexie:', err);
    }
    return await db.goals.where('user_id').equals(uid).toArray();
  },

  async addGoal(uid: string, goal: Omit<Goal, 'id' | 'created_at' | 'status'>): Promise<Goal> {
    const goalId = 'gl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const docData: Goal = {
      ...goal,
      id: goalId,
      user_id: uid,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    const docRef = doc(firestoreDb, 'users', uid, 'goals', goalId);
    await setDoc(docRef, docData);
    await db.goals.put(docData).catch(() => {});
    return docData;
  },

  async updateGoal(uid: string, id: string, updates: Partial<Goal>): Promise<void> {
    const docRef = doc(firestoreDb, 'users', uid, 'goals', id);
    await updateDoc(docRef, updates).catch(() => setDoc(docRef, updates, { merge: true }));
    await db.goals.update(id, updates).catch(() => {});
  },

  async deleteGoal(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, 'users', uid, 'goals', id));
    await db.goals.delete(id).catch(() => {});
  },

  // Calendar Notes
  async getCalendarNotes(uid: string): Promise<CalendarNote[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'calendarNotes'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarNote));
      }
    } catch (err) {
      console.warn('[Firestore] getCalendarNotes error:', err);
    }
    return await db.calendarNotes.where('user_id').equals(uid).toArray();
  },

  async saveCalendarNote(uid: string, note: CalendarNote): Promise<CalendarNote> {
    const docRef = doc(firestoreDb, 'users', uid, 'calendarNotes', note.id);
    await setDoc(docRef, note, { merge: true });
    await db.calendarNotes.put(note).catch(() => {});
    return note;
  },

  async deleteCalendarNote(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, 'users', uid, 'calendarNotes', id));
    await db.calendarNotes.delete(id).catch(() => {});
  },

  // Focus Deadlines
  async getFocusDeadlines(uid: string): Promise<FocusDeadline[]> {
    try {
      const snap = await getDocs(this.getUserCol(uid, 'focusDeadlines'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FocusDeadline));
      }
    } catch (err) {
      console.warn('[Firestore] getFocusDeadlines error:', err);
    }
    return await db.focusDeadlines.where('user_id').equals(uid).toArray();
  },

  async saveFocusDeadline(uid: string, deadline: FocusDeadline): Promise<FocusDeadline> {
    const docRef = doc(firestoreDb, 'users', uid, 'focusDeadlines', deadline.id);
    await setDoc(docRef, deadline, { merge: true });
    await db.focusDeadlines.put(deadline).catch(() => {});
    return deadline;
  },

  async deleteFocusDeadline(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, 'users', uid, 'focusDeadlines', id));
    await db.focusDeadlines.delete(id).catch(() => {});
  },

  // User Preferences
  async getPreferences(uid: string): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
      id: `pref_${uid}`,
      user_id: uid,
      unit_system: 'metric',
      theme: 'monochrome',
      daily_water_target_ml: 2500,
      daily_calorie_target: 2200,
      deep_focus_mode: false,
      updated_at: new Date().toISOString(),
    };
    try {
      const docRef = doc(firestoreDb, 'users', uid, 'preferences', `pref_${uid}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...defaultPrefs, ...snap.data() } as UserPreferences;
      }
    } catch {
      // offline fallback
    }
    return defaultPrefs;
  },

  async savePreferences(uid: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const docRef = doc(firestoreDb, 'users', uid, 'preferences', `pref_${uid}`);
    const current = await this.getPreferences(uid);
    const updated: UserPreferences = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await setDoc(docRef, updated, { merge: true }).catch(() => {});
    return updated;
  },

  // Personal Records
  async getPersonalRecords(uid: string): Promise<PersonalRecords> {
    const defaultPR: PersonalRecords = {
      id: `pr_${uid}`,
      user_id: uid,
      best_streak: 0,
      highest_workout_volume: 0,
      max_weight_lifted: 0,
      lowest_weight: null,
      highest_weight: null,
      total_workouts: 0,
      total_meals: 0,
      total_habit_completions: 0,
      updated_at: new Date().toISOString(),
    };
    try {
      const docRef = doc(firestoreDb, 'users', uid, 'personalRecords', `pr_${uid}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...defaultPR, ...snap.data() } as PersonalRecords;
      }
    } catch {
      // offline fallback
    }
    return defaultPR;
  },

  async savePersonalRecords(uid: string, updates: Partial<PersonalRecords>): Promise<PersonalRecords> {
    const docRef = doc(firestoreDb, 'users', uid, 'personalRecords', `pr_${uid}`);
    const current = await this.getPersonalRecords(uid);
    const updated: PersonalRecords = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await setDoc(docRef, updated, { merge: true }).catch(() => {});
    return updated;
  },

  // Full User Account Reset (Propagates across all devices)
  async clearUserData(uid: string): Promise<void> {
    const subcollections = [
      'habits',
      'habitCompletions',
      'workoutPlans',
      'workoutLogs',
      'nutritionGoals',
      'mealEntries',
      'progressEntries',
      'goals',
      'calendarNotes',
      'focusDeadlines',
      'preferences',
      'personalRecords',
    ];

    for (const col of subcollections) {
      try {
        const snap = await getDocs(this.getUserCol(uid, col));
        for (const d of snap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      } catch (err) {
        console.warn(`[Firestore] clearUserData error on ${col}:`, err);
      }
    }
  },
};
