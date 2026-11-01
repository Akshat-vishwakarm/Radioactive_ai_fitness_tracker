import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { progressService } from '../services/progressService';
import { ProgressCharts } from '../components/progress/ProgressCharts';
import { LogProgressModal } from '../components/progress/LogProgressModal';
import type { ProgressEntry } from '../types';

export const ProgressPage: React.FC = () => {
  const { progressEntries, refreshData } = useData();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveProgress = async (entry: Omit<ProgressEntry, 'id' | 'created_at'>) => {
    await progressService.addProgressEntry(entry);
    await refreshData();
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Delete progress entry?')) {
      await progressService.deleteProgressEntry(id, currentUser?.id);
      await refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary tracking-tight">
            Body Progress &amp; Analytics
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Log weight and body measurements to plot real progress trajectories over time.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-4 bg-primary text-on-primary text-xs font-medium rounded hover:bg-neutral-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Log Measurements</span>
        </button>
      </div>

      {/* Trajectory Charts */}
      <ProgressCharts
        entries={progressEntries}
        onLogClick={() => setIsModalOpen(true)}
        onDeleteEntry={handleDeleteEntry}
      />

      {/* Modal */}
      {currentUser && (
        <LogProgressModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveProgress={handleSaveProgress}
          userId={currentUser.id}
        />
      )}
    </div>
  );
};
