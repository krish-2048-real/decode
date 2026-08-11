import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LanguageOption, UserProfile } from '../types/health';
import { LocationCascader } from './LocationCascader';
import { 
  HeartPulse, 
  Sun, 
  Moon, 
  Globe, 
  User, 
  PhoneCall, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  LogOut,
  Menu
} from 'lucide-react';

interface HeaderProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ userProfile, setUserProfile, setIsMobileOpen }) => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleTheme } = useTheme();
  const { user, userProfile: authProfile, logout, saveProfile } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSaveModalProfile = async () => {
    setShowProfileModal(false);
    if (saveProfile) {
      await saveProfile(userProfile);
    }
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-[#FAFAF7]/95 dark:bg-[#151318]/95 backdrop-blur-md border-b border-[#D4A24E]/20 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name + Mobile Hamburger */}
          <div className="flex items-center space-x-3">
            {setIsMobileOpen && (
              <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden p-2 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-[#D4A24E] cursor-pointer"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#D4A24E] text-slate-950 shadow-md shadow-[#D4A24E]/20 flex items-center justify-center shrink-0 my-auto">
                <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="flex flex-col justify-center my-auto">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 dark:text-stone-100 leading-snug">
                    {t('appName')}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full bg-[#D4A24E]/15 text-[#916323] dark:text-[#E0A845] border border-[#D4A24E]/30 shrink-0">
                    Gold Rural Health MVP
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block font-medium leading-tight mt-0.5">
                  {t('tagline')}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            
            {/* System Status Badge - Research Intelligence Pattern */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#D4A24E]/10 border border-[#D4A24E]/30 text-[10px] font-bold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AI TRIAGE: ONLINE</span>
            </div>

            {/* Emergency 108 Call Quick Badge */}
            <a 
              href="tel:108"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100 transition-colors text-xs font-bold"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Emergency 108</span>
            </a>

            {/* Patient Profile Drawer Trigger */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 hover:bg-stone-300/80 dark:hover:bg-stone-700 transition-colors text-xs font-medium cursor-pointer border border-stone-300/50 dark:border-stone-700/50"
            >
              <User className="w-4 h-4 text-[#D4A24E]" />
              <span className="hidden sm:inline">
                {userProfile.displayName || 'Profile'}
              </span>
              {userProfile.isBPL && (
                <span className="w-2 h-2 rounded-full bg-[#D4A24E]" title="BPL Active"></span>
              )}
            </button>

            {/* Language Selector Dropdown - NON-NEGOTIABLE */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-stone-400 absolute left-2.5 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                aria-label="Select Application Language"
                className="pl-8 pr-3 py-1.5 rounded-lg bg-stone-200/60 dark:bg-stone-800/80 text-stone-800 dark:text-stone-100 border border-stone-300/50 dark:border-stone-700/50 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#D4A24E] transition-colors cursor-pointer"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-stone-200/60 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-300/80 dark:hover:bg-stone-700 transition-colors cursor-pointer border border-stone-300/50 dark:border-stone-700/50"
              title="Toggle Dark / Light Mode"
            >
              {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>

      {/* Patient Profile Modal - Rendered via Portal directly on document.body */}
      {showProfileModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-[#FAFAF7] dark:bg-[#151318] text-stone-900 dark:text-stone-100 rounded-2xl max-w-md w-full border border-[#E5E0D8] dark:border-[#26232D] shadow-2xl p-6 relative my-auto max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8] dark:border-stone-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#D4A24E]/15 text-[#916323] dark:text-[#E0A845] border border-[#D4A24E]/30 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 leading-snug">
                    {t('profileTitle')}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Used to calculate scheme eligibility and tailor AI triage.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userProfile.displayName || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#D4A24E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  value={userProfile.age ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setUserProfile({ ...userProfile, age: isNaN(val) ? 0 : val });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#D4A24E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Annual Household Income (INR)
                </label>
                <input
                  type="number"
                  value={userProfile.income ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setUserProfile({ ...userProfile, income: isNaN(val) ? 0 : val });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#D4A24E]"
                />
              </div>

              <div>
                <LocationCascader
                  selectedState={userProfile.state || 'Maharashtra'}
                  selectedDistrict={userProfile.district || 'Pune Rural'}
                  selectedVillage={userProfile.village || ''}
                  onStateChange={(st) => setUserProfile({ ...userProfile, state: st })}
                  onDistrictChange={(dt) => setUserProfile({ ...userProfile, district: dt })}
                  onVillageChange={(vl) => setUserProfile({ ...userProfile, village: vl })}
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <label className="flex items-center space-x-2.5 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userProfile.isBPL ?? true}
                    onChange={(e) => setUserProfile({ ...userProfile, isBPL: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D4A24E] focus:ring-[#D4A24E] cursor-pointer"
                  />
                  <span>Holds BPL / Yellow Ration Card</span>
                </label>

                <label className="flex items-center space-x-2.5 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userProfile.isPregnant ?? false}
                    onChange={(e) => setUserProfile({ ...userProfile, isPregnant: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D4A24E] focus:ring-[#D4A24E] cursor-pointer"
                  />
                  <span>Currently Pregnant / Lactating Mother</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-end space-x-2 shrink-0">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalProfile}
                className="px-4 py-2 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Profile Settings</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

