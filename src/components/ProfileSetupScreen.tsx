import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types/health';
import { LocationCascader } from './LocationCascader';
import { 
  UserCheck, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  HeartPulse 
} from 'lucide-react';

export const ProfileSetupScreen: React.FC = () => {
  const { user, userProfile, saveProfile } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [age, setAge] = useState<number>(userProfile?.age !== undefined ? userProfile.age : 32);
  const [gender, setGender] = useState<string>(userProfile?.gender || 'Female');
  const [state, setState] = useState<string>(userProfile?.state || 'Maharashtra');
  const [district, setDistrict] = useState<string>(userProfile?.district || 'Pune Rural');
  const [village, setVillage] = useState<string>(userProfile?.village || '');
  const [phone, setPhone] = useState<string>(userProfile?.phone || '');
  const [income, setIncome] = useState<number>(userProfile?.income !== undefined ? userProfile.income : 96000);
  const [isBPL, setIsBPL] = useState<boolean>(userProfile?.isBPL ?? true);
  const [isPregnant, setIsPregnant] = useState<boolean>(userProfile?.isPregnant ?? false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      console.log('Submitting user profile from ProfileSetupScreen...');
      await saveProfile({
        displayName,
        age,
        gender,
        state,
        district,
        village,
        phone,
        income,
        isBPL,
        isPregnant,
        role: 'citizen'
      });
      console.log('Profile saved successfully from ProfileSetupScreen.');
    } catch (err) {
      console.error('Error saving profile in ProfileSetupScreen:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      <div className="max-w-lg w-full bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-slate-700/80 shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
          <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Complete Your Patient Profile
            </h2>
            <p className="text-xs text-slate-400">
              Required for government health scheme eligibility matching.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sunita Patil"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Location Selector Cascade */}
          <LocationCascader
            selectedState={state}
            selectedDistrict={district}
            selectedVillage={village}
            onStateChange={setState}
            onDistrictChange={setDistrict}
            onVillageChange={setVillage}
            darkTheme={true}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Annual Household Income (₹)
              </label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isBPL}
                onChange={(e) => setIsBPL(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span>Holds BPL / Yellow Ration Card</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span>Currently Pregnant / Lactating Mother</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving Profile to Firestore...' : 'Save Profile & Enter Portal'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
