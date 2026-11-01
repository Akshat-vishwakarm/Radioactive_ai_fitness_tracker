export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export type HabitCategory = 'health' | 'fitness' | 'mindset' | 'nutrition' | 'productivity' | 'custom';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly';
  goal_target: number;
  unit: string;
  color: string;
  start_date: string;
  archived: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  value?: number;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  target_muscle: string;
  target_sets: number;
  target_reps: number;
  target_weight: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  day_of_week: number;
  workout_name: string;
  muscle_group: string;
  exercises: WorkoutExercise[];
  created_at: string;
}

export interface CompletedSet {
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface LoggedExercise {
  exercise_id: string;
  exercise_name: string;
  target_muscle: string;
  sets: CompletedSet[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_plan_id?: string;
  workout_name: string;
  date: string;
  duration_minutes: number;
  exercise_logs: LoggedExercise[];
  created_at: string;
}

export interface NutritionGoal {
  id: string;
  user_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  updated_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface FoodItemAnalysis {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionAnalysisResult {
  mealType: MealType;
  originalDescription: string;
  amount?: number;
  unit?: string;
  foodItems: FoodItemAnalysis[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  estimationNote: string;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
}

export interface MealEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  meal_type: MealType;
  food_name: string;
  amount?: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  food_items?: FoodItemAnalysis[];
  estimation_note?: string;
  created_at: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  date: string;
  weight?: number;
  body_fat?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  notes?: string;
  created_at: string;
}

export type GoalCategory = 'habit' | 'workout' | 'nutrition' | 'weight' | 'custom';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface FocusDeadline {
  id: string;
  user_id: string;
  title: string;
  target_date: string;
  category: 'fitness' | 'weight' | 'habit' | 'race' | 'custom';
  target_note?: string;
  active: boolean;
  created_at: string;
}

export interface CalendarNote {
  id: string;
  user_id: string;
  date: string;
  note: string;
  weight?: number;
  activity?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  unit_system: 'metric' | 'imperial';
  theme: 'monochrome' | 'dark' | 'light';
  daily_water_target_ml: number;
  daily_calorie_target: number;
  deep_focus_mode: boolean;
  updated_at: string;
}

export interface PersonalRecords {
  id?: string;
  user_id: string;
  best_streak: number;
  highest_workout_volume: number;
  max_weight_lifted: number;
  lowest_weight: number | null;
  highest_weight: number | null;
  total_workouts: number;
  total_meals: number;
  total_habit_completions: number;
  updated_at: string;
}

export interface MLConfig {
  id: string;
  user_id: string;
  endpoint_url: string;
  provider: 'local' | 'python_fastapi' | 'rest_api' | 'custom';
  connected: boolean;
  api_key?: string;
  last_synced_at?: string;
}

export interface MLFeatureVector {
  timestamp: string;
  user_id: string;
  habits_summary: {
    total_active_habits: number;
    completion_rate_7d: number;
    completion_rate_21d: number;
    current_streak: number;
    best_streak: number;
  };
  workout_summary: {
    workouts_logged_7d: number;
    total_volume_kg_7d: number;
    avg_workout_duration_mins: number;
  };
  nutrition_summary: {
    avg_calories_7d: number;
    avg_protein_7d: number;
    avg_carbs_7d: number;
    avg_fats_7d: number;
    target_calorie_adherence_pct: number;
  };
  progress_summary: {
    latest_weight: number | null;
    weight_change_30d: number | null;
    logs_count: number;
  };
}

export interface MLPredictionResult {
  connected: boolean;
  status_message: string;
  insights: Array<{
    id: string;
    title: string;
    description: string;
    confidence: number;
    type: 'positive' | 'warning' | 'info';
  }>;
}

export interface FullTelemetryContext {
  _instruction_for_llm: string;
  metadata: {
    platform: string;
    version: string;
    exported_at: string;
    current_local_date: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
  };
  habits: {
    active_habits_count: number;
    current_streak_days: number;
    best_streak_days: number;
    overall_completion_rate_7d_pct: number;
    overall_completion_rate_30d_pct: number;
    habits_list: Array<{
      id: string;
      name: string;
      category: string;
      daily_target: number;
      unit: string;
      today_status: 'completed' | 'pending';
      completions_last_7d: number;
      completion_rate_7d_pct: number;
      completions_last_30d: number;
      completion_rate_30d_pct: number;
      recent_completed_dates: string[];
    }>;
    daily_timeline_last_14d: Array<{
      date: string;
      completed_habits: string[];
      missed_habits: string[];
      completion_pct: number;
    }>;
  };
  gym_and_workout: {
    weekly_training_split: Array<{
      day_of_week: number;
      day_name: string;
      workout_name: string;
      muscle_group: string;
      is_rest_day: boolean;
      exercises: Array<{
        name: string;
        target_muscle: string;
        target_sets: number;
        target_reps: number;
        target_weight_kg: number;
        notes?: string;
      }>;
    }>;
    metrics_7d: {
      workouts_logged_7d: number;
      total_volume_kg_7d: number;
      avg_workout_duration_mins: number;
    };
    recent_workout_sessions: Array<{
      id: string;
      date: string;
      workout_name: string;
      duration_minutes: number;
      total_volume_kg: number;
      exercises_performed: Array<{
        exercise_name: string;
        target_muscle: string;
        completed_sets: Array<{
          set_number: number;
          weight_kg: number;
          reps: number;
          completed: boolean;
        }>;
      }>;
    }>;
  };
  nutrition: {
    daily_targets: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
    } | null;
    today_summary: {
      date: string;
      total_calories: number;
      total_protein_g: number;
      total_carbs_g: number;
      total_fats_g: number;
      calorie_adherence_pct: number;
      protein_adherence_pct: number;
      logged_meals_count: number;
      logged_meals: Array<{
        id: string;
        time?: string;
        meal_type: string;
        food_name: string;
        amount?: number;
        unit?: string;
        calories: number;
        protein_g: number;
        carbs_g: number;
        fats_g: number;
        food_items?: Array<{
          name: string;
          amount: number;
          unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        }>;
        estimation_note?: string;
      }>;
    };
    weekly_averages_7d: {
      avg_daily_calories: number;
      avg_daily_protein_g: number;
      avg_daily_carbs_g: number;
      avg_daily_fats_g: number;
      total_meals_logged_7d: number;
    };
    recent_meal_history: Array<{
      date: string;
      time?: string;
      meal_type: string;
      food_name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
    }>;
  };
  body_progress_and_goals: {
    latest_weight_kg: number | null;
    weight_change_30d_kg: number | null;
    weight_history: Array<{
      date: string;
      weight_kg?: number;
      body_fat_pct?: number;
    }>;
    latest_measurements: {
      waist?: number;
      chest?: number;
      arms?: number;
      body_fat?: number;
    } | null;
    active_goals: Array<{
      id: string;
      title: string;
      category: string;
      target_value: number;
      current_value: number;
      unit: string;
      progress_pct: number;
      deadline?: string;
      status: string;
    }>;
  };
}
