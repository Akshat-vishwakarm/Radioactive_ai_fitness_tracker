import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { goalService } from '../services/goalService';
import { GoalModal } from '../components/goals/GoalModal';
import { EmptyState } from '../components/common/EmptyState';
import { FocusDeadlineTimer } from '../components/focus/FocusDeadlineTimer';
import type { Goal } from '../types';

export const GoalsPage: React.FC = () => {
  const { goals, refreshData } = useData();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'status'>) => {
    await goalService.addGoal(goalData);
    await refreshData();
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Delete this goal?')) {
      await goalService.deleteGoal(id, currentUser?.id);
      await refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary tracking-tight">
            Target Goals &amp; Deadlines
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Manage fitness milestones, body weight targets, habit objectives, and workout consistency.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-4 bg-primary text-on-primary text-xs font-medium rounded hover:bg-neutral-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Set Goal</span>
        </button>
      </div>

      {/* High-Focus Target Deadline & Non-Stop Countdown Timer */}
      <FocusDeadlineTimer />

      {/* Zero State if 0 goals */}
      {goals.length === 0 ? (
        <EmptyState
          icon="flag"
          title="No goals set yet"
          description="Create your target milestones for weight loss, muscle gain, daily habits, or workout frequency."
          actionLabel="Create First Goal"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
            return (
              <div
                key={goal.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 space-y-4 shadow-sm hover:border-neutral-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider bg-surface border border-outline-variant text-secondary">
                      {goal.category}
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-secondary hover:text-error transition-colors p-1 cursor-pointer"
                      title="Delete goal"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                  <h3 className="font-heading font-semibold text-base text-primary mt-2">
                    {goal.title}
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-secondary">
                      {goal.current_value} / {goal.target_value} {goal.unit}
                    </span>
                    <span className="text-primary font-medium">{pct}%</span>
                  </div>

                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {goal.deadline && (
                    <div className="text-[11px] text-secondary flex items-center gap-1 pt-1 font-mono">
                      <span className="material-symbols-outlined text-[14px]">event</span>
                      <span>Target: {goal.deadline}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveGoal={handleSaveGoal}
      />
    </div>
  );
};
