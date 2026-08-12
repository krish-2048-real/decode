import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile, ChatTurn } from '../types/health';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  QrCode, 
  Download, 
  ShieldCheck, 
  Copy, 
  Check, 
  Share2, 
  HeartPulse,
  User,
  MapPin,
  Activity,
  Calendar,
  WifiOff
} from 'lucide-react';

interface DigitalHealthCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  recentTurns?: ChatTurn[];
}

export const DigitalHealthCardModal: React.FC<DigitalHealthCardModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  recentTurns = []
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Extract recent triage summaries from turns
  const triageHistory = recentTurns
    .filter(t => t.result)
    .slice(-3)
    .map(t => ({
      sym: t.result?.symptoms || ['General checkup'],
      sev: t.result?.severity || 'MILD',
      ts: t.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      advice: t.result?.triage_advice?.substring(0, 80) + '...'
    }));

  const patientHash = userProfile.uid 
    ? 'AS-' + userProfile.uid.substring(0, 8).toUpperCase()
    : 'AS-89F3A12C';

  // Compact payload for offline QR scanning
  const qrPayloadData = {
    ver: '1.0',
    id: patientHash,
    name: userProfile.displayName || 'Anonymous Patient',
    age: userProfile.age || 30,
    dist: userProfile.state || 'Maharashtra (Pune)',
    bpl: userProfile.isBPL ?? true,
    preg: userProfile.isPregnant ?? false,
    history: triageHistory,
    created: new Date().toLocaleDateString()
  };

  const jsonString = JSON.stringify(qrPayloadData);
  const base64Payload = 'AROGYA:' + btoa(unescape(encodeURIComponent(jsonString)));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(base64Payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAFAF7] dark:bg-[#151318] text-stone-900 dark:text-stone-100 rounded-2xl max-w-lg w-full border border-[#E5E0D8] dark:border-[#26232D] shadow-2xl p-6 relative my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8] dark:border-stone-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#D4A24E] text-slate-950 shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 leading-none">
                  {t('digitalPassHeader')}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {t('offlineSyncReady')}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t('scanAshaDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Card Body */}
        <div className="py-5 overflow-y-auto space-y-5 flex-1 pr-1">
          
          {/* Printable Health Card Box */}
          <div className="bg-linear-to-br from-stone-900 via-stone-950 to-[#1D1823] text-white rounded-2xl p-6 border border-[#D4A24E]/40 shadow-xl relative overflow-hidden space-y-4">
            
            {/* Background Decorative Graphic */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <HeartPulse className="w-48 h-48 text-[#D4A24E]" />
            </div>

            {/* Top Bar of Card */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-[#D4A24E] text-slate-950">
                  <HeartPulse className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <span className="font-serif font-bold text-sm text-[#E0A845] block leading-none">
                    AROGYA SAHAYAK
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono tracking-wider uppercase">
                    {t('nationalHealthPass')}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono text-[#D4A24E] bg-[#D4A24E]/15 px-2 py-0.5 rounded border border-[#D4A24E]/30 font-bold">
                {patientHash}
              </span>
            </div>

            {/* Card Content Row: Details + QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              
              {/* Left Column: Demographics */}
              <div className="sm:col-span-7 space-y-2.5 text-xs text-stone-300">
                <div className="flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-[#D4A24E] shrink-0" />
                  <span className="font-bold text-white text-sm truncate">
                    {userProfile.displayName || 'Anonymous Citizen'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                  <div>
                    <span className="text-stone-500 block text-[9px] uppercase">{t('ageGender')}</span>
                    <span className="text-stone-200 font-bold">{userProfile.age || 30} Yrs • {userProfile.gender || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[9px] uppercase">{t('districtSector')}</span>
                    <span className="text-stone-200 font-bold">
                      {userProfile.district || userProfile.state || 'Maharashtra'}
                      {userProfile.village ? ` (${userProfile.village})` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[#E0A845] border border-amber-500/30 text-[10px] font-bold">
                    {userProfile.isBPL ? t('bplHolder') : t('generalCategory')}
                  </span>
                  {userProfile.isPregnant && (
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold">
                      {t('maternalPriority')}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: High Contrast QR Code Display */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-white text-slate-950 shadow-inner space-y-2">
                <QRCodeSVG
                  value={base64Payload}
                  size={128}
                  level="M"
                  marginSize={1}
                  fgColor="#0F172A"
                  bgColor="#FFFFFF"
                />
                <span className="text-[9px] font-mono font-black text-stone-700 tracking-wider uppercase">
                  {t('scanForOfflineHistory')}
                </span>
              </div>

            </div>

            {/* Offline Health Snapshot Included Badge */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
              <span className="flex items-center space-x-1">
                <WifiOff className="w-3 h-3 text-emerald-400" />
                <span>{t('encodedPayload')} {triageHistory.length} {t('recentSessions')}</span>
              </span>
              <span className="font-mono text-stone-500">{new Date().toLocaleDateString()}</span>
            </div>

          </div>

          {/* Encoded Encrypted Data String Preview */}
          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-[#E5E0D8] dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('base64StringLabel')}</span>
              </span>
              <button
                onClick={handleCopyCode}
                className="px-2 py-1 rounded bg-[#D4A24E]/15 hover:bg-[#D4A24E]/25 text-[#916323] dark:text-[#E0A845] text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? t('copiedBtn') : t('copyTextBtn')}</span>
              </button>
            </div>
            <div className="p-2 rounded bg-[#FAFAF7] dark:bg-[#151318] text-[10px] font-mono break-all text-stone-600 dark:text-stone-400 border border-[#E5E0D8] dark:border-stone-800">
              {base64Payload}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-end space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {t('closeBtn')}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
