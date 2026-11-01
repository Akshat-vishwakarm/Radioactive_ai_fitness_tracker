import React from 'react';
import { RADIOACTIVE_LOGO } from '../../assets/logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
  { id: 'habits', label: 'Habit Tracker', icon: 'check_circle' },
  { id: 'workout', label: 'Gym & Workout', icon: 'fitness_center' },
  { id: 'nutrition', label: 'Nutrition Tracker', icon: 'restaurant' },
  { id: 'progress', label: 'Body Progress', icon: 'monitoring' },
  { id: 'goals', label: 'Goals', icon: 'flag' },
  { id: 'calendar', label: 'Calendar & Notes', icon: 'calendar_today' },
  { id: 'ai', label: 'AI Insights', icon: 'smart_toy', badge: 'ML' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[260px] bg-surface z-50 flex-col border-r border-outline-variant">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-2.5">
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
            className="w-7 h-7 rounded object-contain bg-white border border-outline-variant shrink-0"
          />
          <span className="font-heading text-sm text-primary tracking-tight font-extrabold uppercase">
            Radioactive
          </span>
        </div>
        <span className="font-mono text-[10px] text-secondary border border-outline-variant px-1.5 py-0.5 rounded bg-surface-container-lowest font-medium uppercase">
          OS
        </span>
      </div>

      {/* Navigation Links */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="px-3 py-1 font-mono text-[11px] text-secondary uppercase tracking-wider font-medium">
          Navigation
        </div>

        <nav className="mt-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-medium text-left ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-none'
                    : 'text-secondary hover:bg-surface-container hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'border-on-primary/30 text-on-primary bg-on-primary/10'
                        : 'border-outline-variant text-secondary bg-surface-container-lowest'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-outline-variant">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[11px] text-secondary">v2.4.0 Engine</span>
          </div>
          <span className="font-mono text-[11px] text-secondary">Sync OK</span>
        </div>
      </div>
    </aside>
  );
};
