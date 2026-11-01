import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { nutritionService } from '../services/nutritionService';
import { NutritionSummaryCard } from '../components/nutrition/NutritionSummaryCard';
import { NutritionGoalModal } from '../components/nutrition/NutritionGoalModal';
import { LogMealModal } from '../components/nutrition/LogMealModal';
import type { MealEntry } from '../types';

export const NutritionPage: React.FC = () => {
  const { nutritionGoal, todayConsumed, allMeals, refreshData } = useData();
  const { currentUser } = useAuth();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);

  const handleSaveGoal = async (goals: { calories: number; protein: number; carbs: number; fats: number }) => {
    if (!currentUser) return;
    await nutritionService.saveNutritionGoal(currentUser.id, goals);
    await refreshData();
  };

  const handleSaveMeal = async (mealData: Omit<MealEntry, 'id' | 'created_at'>) => {
    if (editingMeal) {
      await nutritionService.updateMealEntry(editingMeal.id, mealData);
    } else {
      await nutritionService.addMealEntry(mealData);
    }
    setEditingMeal(null);
    await refreshData();
  };

  const handleEditMeal = (meal: MealEntry) => {
    setEditingMeal(meal);
    setIsMealModalOpen(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (confirm('Remove meal entry?')) {
      await nutritionService.deleteMealEntry(mealId, currentUser?.id);
      await refreshData();
    }
  };

  const handleOpenNewMealModal = () => {
    setEditingMeal(null);
    setIsMealModalOpen(true);
  };

  const handleDownloadLog = async () => {
    if (!currentUser) return;

    const fetchedMeals = await nutritionService.getMealEntries(currentUser.id);
    if (fetchedMeals.length === 0) {
      alert('No nutrition entries found to download.');
      return;
    }

    const mealsByDateMap: Record<string, MealEntry[]> = {};
    fetchedMeals.forEach((meal) => {
      const d = meal.date || new Date().toISOString().split('T')[0];
      if (!mealsByDateMap[d]) mealsByDateMap[d] = [];
      mealsByDateMap[d].push(meal);
    });

    const sortedDates = Object.keys(mealsByDateMap).sort((a, b) => (b > a ? 1 : -1));

    const csvLines: string[] = [];
    csvLines.push(`FITTRACK AI NUTRITION LOG BACKUP - ${currentUser.name}`);
    csvLines.push(`Export Date: ${new Date().toLocaleString()}`);
    csvLines.push('');

    sortedDates.forEach((dateStr) => {
      const dateMeals = mealsByDateMap[dateStr];
      const dObj = new Date(dateStr + 'T00:00:00');
      const formattedDate = dObj.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      csvLines.push(`================================================================================`);
      csvLines.push(`DATE: ${dateStr} (${formattedDate}) - ${dateMeals.length} Meals Logged`);
      csvLines.push(`================================================================================`);
      csvLines.push('Time,Meal Type,Food Description,Amount,Unit,Calories (kcal),Protein (g),Carbs (g),Fat (g)');

      let dayCals = 0;
      let dayP = 0;
      let dayC = 0;
      let dayF = 0;

      dateMeals.forEach((m) => {
        dayCals += m.calories || 0;
        dayP += m.protein || 0;
        dayC += m.carbs || 0;
        dayF += m.fats || 0;
        csvLines.push(
          `"${m.time || ''}","${m.meal_type || ''}","${(m.food_name || '').replace(/"/g, '""')}","${m.amount || ''}","${m.unit || ''}",${m.calories || 0},${m.protein || 0},${m.carbs || 0},${m.fats || 0}`
        );
      });

      csvLines.push(`TOTALS,,,,,,${dayCals},${dayP},${dayC},${dayF}`);
      csvLines.push('');
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fittrack_nutrition_log_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sub-header Breadcrumb & Operational Bar matching Stitch */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-xs text-secondary uppercase tracking-wider">
            <span>Metabolic Logs</span>
            <span>/</span>
            <span className="text-primary font-medium">Daily Telemetry</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-primary tracking-tight">
            Today&apos;s Fuel Breakdown
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Real stored calorie &amp; macronutrient totals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="h-9 px-4 flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest hover:bg-surface text-primary text-xs font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Targets</span>
          </button>
          <button
            onClick={handleOpenNewMealModal}
            className="h-9 px-4 flex items-center gap-1.5 rounded bg-primary text-on-primary hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Log Meal</span>
          </button>
        </div>
      </div>

      {/* Main Nutrition Summary Card & Historical Accordion */}
      <NutritionSummaryCard
        goal={nutritionGoal}
        todayConsumed={todayConsumed}
        allMeals={allMeals}
        onSetGoalClick={() => setIsGoalModalOpen(true)}
        onLogMealClick={handleOpenNewMealModal}
        onEditMeal={handleEditMeal}
        onDeleteMeal={handleDeleteMeal}
        onDownloadLog={handleDownloadLog}
      />

      {/* Target Goal Modal */}
      {isGoalModalOpen && (
        <NutritionGoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={handleSaveGoal}
          initialGoal={nutritionGoal}
        />
      )}

      {/* Log Meal Modal with AI and Manual Mode */}
      {isMealModalOpen && currentUser && (
        <LogMealModal
          isOpen={isMealModalOpen}
          onClose={() => {
            setIsMealModalOpen(false);
            setEditingMeal(null);
          }}
          onSaveMeal={handleSaveMeal}
          initialMeal={editingMeal}
          userId={currentUser.id}
        />
      )}
    </div>
  );
};
