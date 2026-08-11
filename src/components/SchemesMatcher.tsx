import React, { useEffect, useState } from 'react';
import { SchemeMatchResult, UserProfile } from '../types/health';
import { matchSchemes } from '../../backend/services/schemesService';
import { 
  FileCheck2, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles, 
  IndianRupee, 
  HeartHandshake, 
  ArrowRight 
} from 'lucide-react';

interface SchemesMatcherProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const SchemesMatcher: React.FC<SchemesMatcherProps> = ({ userProfile, setUserProfile }) => {
  const [matches, setMatches] = useState<SchemeMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const calculateMatches = async () => {
    setIsLoading(true);
    let matchedData: SchemeMatchResult[] | null = null;
    const calcAge = userProfile.age !== undefined ? userProfile.age : 32;
    const calcIncome = userProfile.income !== undefined ? userProfile.income : 96000;
    const calcState = userProfile.state || 'Maharashtra';
    const calcPreg = Boolean(userProfile.isPregnant);
    const calcBPL = userProfile.isBPL ?? true;

    try {
      const response = await fetch('/api/matchSchemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: calcAge,
          income: calcIncome,
          state: calcState,
          is_pregnant: calcPreg,
          is_bpl: calcBPL
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.matches)) {
          matchedData = data.matches;
        }
      }
    } catch (err) {
      console.warn('API route /api/matchSchemes failed, executing direct clinical scheme service fallback:', err);
    }

    if (matchedData) {
      setMatches(matchedData);
    } else {
      // Execute robust client-side scheme match engine fallback
      const localMatches = matchSchemes({
        age: calcAge,
        income: calcIncome,
        state: calcState,
        is_pregnant: calcPreg,
        is_bpl: calcBPL
      });
      setMatches(localMatches);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    calculateMatches();
  }, [userProfile]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Profile Filter Bar */}
      <div className="bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl p-6 border border-[#E5E0D8] dark:border-[#26232D] shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#D4A24E]/15 dark:bg-[#D4A24E]/20 text-[#916323] dark:text-[#E0A845]">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase">
                Government Benefit Schemes
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                Health Subsidies & Cash Assistance
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Automated eligibility calculation against Ayushman Bharat (PM-JAY), JSY, RSBY, PMMVY & NHM.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Criteria Inputs Controls */}
        <div className="p-4 rounded-xl bg-stone-100/90 dark:bg-stone-900/60 border border-[#E5E0D8] dark:border-stone-800 grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
          <div>
            <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
              Age (Years)
            </label>
            <input
              type="number"
              value={userProfile.age ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setUserProfile({ ...userProfile, age: isNaN(val) ? 0 : val });
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-[#FAFAF7] dark:bg-[#151318] border border-[#E5E0D8] dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-[#D4A24E]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
              Annual Income (₹)
            </label>
            <input
              type="number"
              value={userProfile.income ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setUserProfile({ ...userProfile, income: isNaN(val) ? 0 : val });
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-[#FAFAF7] dark:bg-[#151318] border border-[#E5E0D8] dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-[#D4A24E]"
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <input
              type="checkbox"
              id="bplCheck"
              checked={userProfile.isBPL ?? true}
              onChange={(e) => setUserProfile({ ...userProfile, isBPL: e.target.checked })}
              className="w-4 h-4 rounded text-[#D4A24E] focus:ring-[#D4A24E] cursor-pointer"
            />
            <label htmlFor="bplCheck" className="text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
              BPL Ration Card
            </label>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <input
              type="checkbox"
              id="pregCheck"
              checked={userProfile.isPregnant ?? false}
              onChange={(e) => setUserProfile({ ...userProfile, isPregnant: e.target.checked })}
              className="w-4 h-4 rounded text-[#D4A24E] focus:ring-[#D4A24E] cursor-pointer"
            />
            <label htmlFor="pregCheck" className="text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
              Pregnant / Lactating
            </label>
          </div>

          <button
            onClick={calculateMatches}
            className="px-4 py-2 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            Re-calculate
          </button>
        </div>
      </div>

      {/* Schemes Grid Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map((item) => {
          const { scheme, matched, qualificationReason, matchedCriteria } = item;

          return (
            <div
              key={scheme.id}
              className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                matched
                  ? 'bg-[#FAFAF7] dark:bg-[#151318] border-[#D4A24E]/60 dark:border-[#D4A24E]/40 shadow-lg ring-1 ring-[#D4A24E]/20'
                  : 'bg-stone-100/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D4A24E]/15 text-[#916323] dark:text-[#E0A845] border border-[#D4A24E]/30">
                      {scheme.shortName}
                    </span>
                    <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mt-2">
                      {scheme.name}
                    </h3>
                  </div>

                  {matched ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold flex items-center space-x-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>QUALIFIED</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400 text-xs font-bold shrink-0">
                      PARTIAL MATCH
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Benefits highlight card */}
                <div className="p-3.5 rounded-xl bg-[#D4A24E]/10 dark:bg-[#D4A24E]/15 border border-[#D4A24E]/25 text-xs space-y-1 mb-4">
                  <div className="font-bold text-[#916323] dark:text-[#E0A845] flex items-center space-x-1">
                    <IndianRupee className="w-3.5 h-3.5 text-[#B68434] dark:text-[#E0A845]" />
                    <span>Coverage & Cash Benefits:</span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 font-medium">
                    {scheme.benefits}
                  </p>
                </div>

                {/* HUMAN READABLE WHY YOU QUALIFY EXPLANATION */}
                <div className="p-3.5 rounded-xl bg-stone-100/90 dark:bg-stone-900/60 border border-[#E5E0D8] dark:border-stone-800 text-xs space-y-2">
                  <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A24E]" />
                    <span>Why You Qualify (Matched Criteria):</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                    {qualificationReason}
                  </p>

                  {matchedCriteria.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#916323] dark:text-[#E0A845] font-semibold pt-1">
                      {matchedCriteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Action Apply Button */}
              <div className="mt-5 pt-4 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  {scheme.category}
                </span>
                <button
                  onClick={() => alert(`To enroll in ${scheme.shortName}, present your BPL card or Aadhaar card at your nearest PHC Helpdesk or Kiosk.`)}
                  className="flex items-center space-x-1 text-xs font-bold text-[#916323] dark:text-[#E0A845] hover:text-[#B68434] dark:hover:text-[#E0A845] transition-colors cursor-pointer"
                >
                  <span>PHC Enrollment Instructions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
