import React, { useEffect, useState } from 'react';
import { INDIA_LOCATION_DATA, getDistrictsForState } from '../data/indiaLocationData';

interface LocationCascaderProps {
  selectedState: string;
  selectedDistrict: string;
  selectedVillage?: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  onVillageChange?: (village: string) => void;
  darkTheme?: boolean;
}

export const LocationCascader: React.FC<LocationCascaderProps> = ({
  selectedState,
  selectedDistrict,
  selectedVillage = '',
  onStateChange,
  onDistrictChange,
  onVillageChange,
  darkTheme = false
}) => {
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Update districts whenever state changes
  useEffect(() => {
    const currentState = selectedState || 'Maharashtra';
    const districts = getDistrictsForState(currentState);
    setAvailableDistricts(districts);

    // If current selectedDistrict isn't in new state's districts, auto-select first district
    if (districts.length > 0 && !districts.includes(selectedDistrict)) {
      onDistrictChange(districts[0]);
    }
  }, [selectedState]);

  const selectBgClass = darkTheme 
    ? 'bg-slate-900 border-slate-700 text-white focus:ring-amber-500' 
    : 'bg-stone-100 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-[#D4A24E]';

  const labelClass = darkTheme
    ? 'block text-xs font-semibold text-slate-300 mb-1'
    : 'block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1';

  return (
    <div className="space-y-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. State Dropdown */}
        <div>
          <label className={labelClass}>
            State / Union Territory
          </label>
          <select
            value={selectedState || 'Maharashtra'}
            onChange={(e) => {
              const newState = e.target.value;
              onStateChange(newState);
              const newDistricts = getDistrictsForState(newState);
              if (newDistricts.length > 0) {
                onDistrictChange(newDistricts[0]);
              }
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-hidden focus:ring-2 cursor-pointer ${selectBgClass}`}
          >
            {INDIA_LOCATION_DATA.map((loc) => (
              <option key={loc.state} value={loc.state}>
                {loc.state}
              </option>
            ))}
          </select>
        </div>

        {/* 2. District Cascading Dropdown */}
        <div>
          <label className={labelClass}>
            District
          </label>
          <select
            value={selectedDistrict || availableDistricts[0] || 'Pune Rural'}
            onChange={(e) => onDistrictChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-hidden focus:ring-2 cursor-pointer ${selectBgClass}`}
          >
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Village / Gram Panchayat Free Text Field */}
      {onVillageChange && (
        <div>
          <label className={labelClass}>
            Village / Taluka / Gram Panchayat (Free Text)
          </label>
          <input
            type="text"
            value={selectedVillage}
            onChange={(e) => onVillageChange(e.target.value)}
            placeholder="e.g. Khed, Junnar, or Village Name"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-hidden focus:ring-2 ${selectBgClass}`}
          />
        </div>
      )}
    </div>
  );
};
