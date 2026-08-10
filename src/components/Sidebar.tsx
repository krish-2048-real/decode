import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  MessageSquare, 
  FileText, 
  MapPin, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';

export type TabType = 'triage' | 'schemes' | 'map' | 'alerts';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'triage' as TabType,
      label: t('tabTriage'),
      icon: MessageSquare,
      description: 'AI Multilingual Diagnosis & Guidance'
    },
    {
      id: 'schemes' as TabType,
      label: t('tabSchemes'),
      icon: FileText,
      description: 'Government Benefits & Subsidies'
    },
    {
      id: 'map' as TabType,
      label: t('tabMap'),
      icon: MapPin,
      description: 'Locate Nearest Medical Centers'
    },
    {
      id: 'alerts' as TabType,
      label: t('tabAlerts'),
      icon: ShieldAlert,
      description: 'ASHA Field Worker Dashboard'
    }
  ];

  const handleSelect = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          bg-[#FAFAF7] dark:bg-[#151318] border-r border-[#E5E0D8] dark:border-[#D4A24E]/20 text-stone-900 dark:text-stone-100
          flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out shadow-lg md:shadow-none
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Sidebar Header with Collapse Toggle */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E5E0D8] dark:border-stone-800/80">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#D4A24E] flex items-center justify-center shrink-0 shadow-md text-slate-950 font-bold my-auto">
              <Sparkles className="w-4 h-4" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-serif font-bold text-sm tracking-wide text-stone-900 dark:text-[#E0A845] truncate leading-none my-auto">
                Navigation
              </span>
            )}
          </div>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-stone-500 hover:text-[#D4A24E] dark:text-stone-400 dark:hover:text-[#E0A845] hover:bg-stone-200/80 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Eyebrow header */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-5 pt-4 pb-1 text-[10px] font-bold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase">
            Quick Actions
          </div>
        )}

        {/* Navigation Item List */}
        <div className="flex-1 py-2 px-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left font-bold transition-all group cursor-pointer relative
                  ${isActive 
                    ? 'bg-[#D4A24E]/15 dark:bg-[#D4A24E]/20 text-[#916323] dark:text-[#E0A845] border-l-4 border-[#D4A24E] shadow-2xs' 
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`
                  p-2 rounded-lg shrink-0 transition-colors
                  ${isActive 
                    ? 'bg-[#D4A24E] text-slate-950 shadow-md shadow-[#D4A24E]/20' 
                    : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-[#D4A24E]'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>

                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Info */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-3 m-2 rounded-xl bg-stone-200/60 dark:bg-stone-900/80 border border-[#D4A24E]/20 text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
            <div className="font-bold text-[#916323] dark:text-[#E0A845] flex items-center space-x-1">
              <span>Arogya Sahayak MVP</span>
            </div>
            <p className="text-[10px] leading-tight text-stone-500 dark:text-stone-400">
              Gold Edition • Connected to Cloud Firestore
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
