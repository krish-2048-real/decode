import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { TriageChat } from './components/TriageChat';
import { SchemesMatcher } from './components/SchemesMatcher';
import { PhcMap } from './components/PhcMap';
import { AshaAlertsQueue } from './components/AshaAlertsQueue';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetupScreen } from './components/ProfileSetupScreen';
import { UserProfile } from './types/health';
import { 
  HeartPulse, 
  Loader2 
} from 'lucide-react';

function AppContent() {
  const { t } = useLanguage();
  const { userProfile: authProfile, saveProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('triage');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Default fallback object if authProfile is null
  const activeProfile: UserProfile = authProfile || {
    displayName: 'Citizen Patient',
    age: 32,
    income: 96000,
    state: 'Maharashtra',
    district: 'Pune Rural',
    village: '',
    isBPL: true,
    isPregnant: false,
    gender: 'Female'
  };

  const [userProfile, setUserProfileState] = useState<UserProfile>(activeProfile);

  // Sync userProfile state whenever authProfile in AuthContext changes
  useEffect(() => {
    if (authProfile) {
      setUserProfileState(authProfile);
    }
  }, [authProfile]);

  // Unified updater that updates local state AND persists to AuthContext / Firestore
  const handleSetUserProfile: React.Dispatch<React.SetStateAction<UserProfile>> = (action) => {
    setUserProfileState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      saveProfile(next);
      return next;
    });
  };

  // If logged in as ASHA worker, default to 'alerts' tab
  useEffect(() => {
    if (authProfile?.role === 'asha') {
      setActiveTab('alerts');
    }
  }, [authProfile?.role]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F5F1E8] dark:bg-[#0B0A0F] text-[#1A1816] dark:text-[#F3EFE6] flex flex-col font-sans transition-colors selection:bg-[#D4A24E] selection:text-slate-950">
      
      {/* Global Application Header */}
      <Header 
        userProfile={userProfile} 
        setUserProfile={handleSetUserProfile} 
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Body Layout with Collapsible Vertical Left Sidebar */}
      <div className="flex flex-1 min-h-0 w-full relative overflow-hidden">
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Independent Scrollable Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
            {activeTab === 'triage' && (
              <TriageChat
                userProfile={userProfile}
                onNavigateTab={(tab) => setActiveTab(tab as TabType)}
              />
            )}

            {activeTab === 'schemes' && (
              <SchemesMatcher
                userProfile={userProfile}
                setUserProfile={handleSetUserProfile}
              />
            )}

            {activeTab === 'map' && <PhcMap />}

            {activeTab === 'alerts' && <AshaAlertsQueue />}
          </main>

          {/* Global Footer */}
          <footer className="bg-[#FAFAF7] dark:bg-[#151318] border-t border-[#D4A24E]/20 py-4 mt-auto shrink-0">
            <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-600 dark:text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-[#D4A24E]" />
                <span className="font-bold text-stone-900 dark:text-stone-200">Arogya Sahayak MVP (Gold Edition)</span>
                <span>— AI Rural Healthcare & Triage Assistant</span>
              </div>
              <p>
                Emergency Helpline: <a href="tel:108" className="font-bold text-red-600 underline">108</a> • National Health Authority Compliant
              </p>
            </div>
          </footer>
        </div>
      </div>

    </div>
  );
}

function MainRouter() {
  const { user, userProfile, loading, needsProfileSetup, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">
          Connecting to Arogya Sahayak Authentication...
        </p>
      </div>
    );
  }

  // User is authenticated if firebase user exists, or guest mode is active, or userProfile exists (e.g. ASHA worker profile)
  const isAuthenticated = Boolean(user || isGuest || userProfile);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (needsProfileSetup && userProfile?.role !== 'asha') {
    return <ProfileSetupScreen />;
  }

  return <AppContent />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainRouter />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
