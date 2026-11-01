import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { RADIOACTIVE_LOGO } from '../../assets/logo';

interface HeaderProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useAuth();
  const { streak } = useData();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-14 bg-surface-container-lowest z-40 flex items-center justify-between px-4 sm:px-6 border-b border-outline-variant">
      {/* Breadcrumb Navigation & Date */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand emblem */}
        <div className="flex md:hidden items-center gap-1.5 mr-1">
          <img
            src={RADIOACTIVE_LOGO}
            alt="Radioactive"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('radioactive-logo.png') && !target.src.includes('radioactive-logo.jpg')) {
                target.src = '/radioactive-logo.png';
              } else if (target.src.includes('radioactive-logo.png')) {
                target.src = '/radioactive-logo.jpg';
              } else {
                target.onerror = null;
              }
            }}
            className="w-6 h-6 rounded object-contain bg-white border border-outline-variant shrink-0"
          />
          <span className="font-heading text-xs font-extrabold text-primary uppercase">Radioactive</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
          <span className="text-primary font-semibold">Workspace</span>
          <span>/</span>
          <span className="capitalize text-secondary">{activeTab}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 border border-outline-variant px-2.5 py-1 rounded bg-surface">
          <span className="material-symbols-outlined text-[15px] text-secondary">calendar_month</span>
          <span className="font-mono text-xs text-secondary">{formattedDate}</span>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-outline-variant bg-surface text-xs font-mono text-primary font-medium">
          <span className="material-symbols-outlined text-[14px]">timer</span>
          <span>{streak.currentStreak}D</span>
        </div>

        {/* Quick Log Action Button */}
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('nutrition')}
            className="h-8 px-2.5 sm:px-3 flex items-center gap-1 border border-outline-variant rounded bg-surface-container-lowest hover:bg-surface hover:text-primary text-secondary transition-colors text-xs font-medium"
            title="Log Meal or Activity"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span className="hidden sm:inline">Log Entry</span>
          </button>
        )}

        <div className="h-4 w-px bg-outline-variant" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs text-primary font-medium leading-none truncate max-w-[120px]">
                {currentUser?.name || 'Athlete'}
              </div>
              <div className="font-mono text-[10px] text-secondary leading-none mt-1">
                Athlete Pro
              </div>
            </div>

            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-outline-variant"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl p-3 z-50 space-y-3">
              {/* Account Info */}
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-outline-variant">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-outline-variant"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                    {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-primary truncate">
                    {currentUser?.name}
                  </div>
                  <div className="font-mono text-[10px] text-secondary truncate">
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="bg-surface p-2 rounded border border-outline-variant text-[11px] font-mono space-y-1 text-secondary">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="text-primary font-medium">Local + Cloud Sync</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Streak:</span>
                  <span className="text-primary font-medium">{streak.currentStreak} Days</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                className="w-full py-1.5 px-3 rounded text-xs font-medium text-error hover:bg-error-container/30 border border-outline-variant transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
