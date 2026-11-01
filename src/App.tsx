import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { LoginScreen } from './components/auth/LoginScreen';

import { DashboardPage } from './pages/DashboardPage';
import { HabitsPage } from './pages/HabitsPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { NutritionPage } from './pages/NutritionPage';
import { ProgressPage } from './pages/ProgressPage';
import { GoalsPage } from './pages/GoalsPage';
import { CalendarPage } from './pages/CalendarPage';
import { AIPage } from './pages/AIPage';
import { SettingsPage } from './pages/SettingsPage';
import { RADIOACTIVE_LOGO } from './assets/logo';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const { loading: dataLoading } = useData();

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
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
            className="w-10 h-10 rounded-lg object-contain bg-white border border-outline-variant p-1 animate-pulse"
          />
          <div className="font-mono text-xs text-secondary uppercase tracking-wider">
            Loading Radioactive OS...
          </div>
        </div>
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'habits':
        return <HabitsPage />;
      case 'workout':
        return <WorkoutPage />;
      case 'nutrition':
        return <NutritionPage />;
      case 'progress':
        return <ProgressPage />;
      case 'goals':
        return <GoalsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'ai':
        return <AIPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary font-sans flex flex-col antialiased relative">
      {/* Fixed Fullscreen Background Logo Watermark across all pages */}
      <div
        className="fixed inset-0 md:left-[260px] flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={RADIOACTIVE_LOGO}
          alt=""
          className="w-[520px] h-[520px] sm:w-[720px] sm:h-[720px] lg:w-[880px] lg:h-[880px] max-w-none object-contain opacity-[0.16] mix-blend-multiply filter contrast-125"
        />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Shell with desktop offset */}
      <div className="md:pl-[260px] flex flex-col min-h-screen relative z-10">
        {/* Header Bar */}
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Page Content */}
        <main className="flex-1 pt-14 pb-20 md:pb-8">
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const AuthGuard: React.FC = () => {
  const { currentUser, loading: authLoading, loginAsGuest } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
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
            className="w-10 h-10 rounded-lg object-contain bg-white border border-outline-variant p-1 animate-pulse"
          />
          <div className="font-mono text-xs text-secondary uppercase tracking-wider">
            Verifying Authentication...
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLocalGuestLogin={loginAsGuest} />;
  }

  return (
    <DataProvider>
      <MainLayout />
    </DataProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}

export default App;
