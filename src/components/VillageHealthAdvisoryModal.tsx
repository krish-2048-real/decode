import React, { useState } from 'react';
import { VillageHealthAdvisory } from '../services/advisoryService';
import { 
  X, 
  Printer, 
  Sparkles, 
  Languages, 
  ShieldCheck, 
  FileText, 
  PhoneCall, 
  Building2, 
  CheckCircle2, 
  QrCode,
  Share2,
  Calendar,
  MapPin,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface VillageHealthAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  districtName?: string;
}

export const VillageHealthAdvisoryModal: React.FC<VillageHealthAdvisoryModalProps> = ({
  isOpen,
  onClose,
  districtName = 'Pune Rural (Khed Sector)'
}) => {
  const [advisory, setAdvisory] = useState<VillageHealthAdvisory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  const fetchAdvisory = async (lang: string = selectedLang) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generateAdvisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district: districtName, language: lang })
      });
      const data = await res.json();
      if (data.success && data.advisory) {
        setAdvisory(data.advisory);
      }
    } catch (err) {
      console.error('Error fetching village advisory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !advisory) {
      fetchAdvisory('en');
    }
  }, [isOpen]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    fetchAdvisory(newLang);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl border border-[#E5E0D8] dark:border-[#26232D] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Controls Header */}
        <div className="p-4 bg-[#151318] text-white flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-[#D4A24E]/20 text-[#E0A845]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-100 flex items-center space-x-2">
                <span>Village Health Advisory Generator</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  RAG Grounded
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                AI-Generated Weekly PHC Noticeboard Poster grounded in WHO IMCI & ICMR guidelines
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <div className="flex items-center space-x-1.5 bg-stone-900 border border-stone-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold">
              <Languages className="w-4 h-4 text-[#E0A845]" />
              <select
                value={selectedLang}
                onChange={handleLanguageChange}
                className="bg-transparent text-stone-200 outline-none cursor-pointer text-xs font-bold"
              >
                <option value="en" className="bg-stone-900 text-white">English</option>
                <option value="hi" className="bg-stone-900 text-white">Hindi (हिंदी)</option>
                <option value="mr" className="bg-stone-900 text-white">Marathi (मराठी)</option>
                <option value="ta" className="bg-stone-900 text-white">Tamil (தமிழ்)</option>
                <option value="te" className="bg-stone-900 text-white">Telugu (తెలుగు)</option>
                <option value="bn" className="bg-stone-900 text-white">Bengali (বাংলা)</option>
                <option value="gu" className="bg-stone-900 text-white">Gujarati (ગુજરાતી)</option>
              </select>
            </div>

            <button
              onClick={() => fetchAdvisory(selectedLang)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E0A845]" />
              <span>Regenerate</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!advisory || isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print A5 Poster</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Poster View */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100 dark:bg-stone-950 flex justify-center">
          
          {isLoading ? (
            <div className="py-20 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#D4A24E] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                Generating Plain-Language Village Advisory grounded in WHO IMCI & ICMR Guidelines...
              </p>
            </div>
          ) : advisory ? (
            
            /* Printable A5 Noticeboard Poster Card Container */
            <div 
              id="printable-advisory-poster"
              className="w-full max-w-2xl bg-white text-stone-900 p-8 rounded-2xl shadow-xl border-4 border-[#B68434] space-y-6 print:border-2 print:shadow-none print:max-w-none print:p-4"
            >
              {/* Header Official Seal Banner */}
              <div className="border-b-2 border-stone-800 pb-4 text-center space-y-2">
                <div className="flex items-center justify-center space-x-2 text-[#916323] font-black tracking-widest text-xs uppercase">
                  <Building2 className="w-4 h-4" />
                  <span>National Health Mission • Primary Health Centre</span>
                  <Building2 className="w-4 h-4" />
                </div>
                
                <h1 className="font-serif text-2xl font-black text-stone-950 tracking-tight leading-tight">
                  {advisory.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-600 font-bold">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B68434]" />
                    <span>Sector: {advisory.district}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#B68434]" />
                    <span>Date: {advisory.generatedAt}</span>
                  </span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-[#916323] text-[10px] uppercase font-black">
                    Language: {advisory.languageName}
                  </span>
                </div>
              </div>

              {/* Summary Notice for Noticeboard Read-Aloud */}
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-stone-900 font-medium text-xs leading-relaxed flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-[#916323] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#916323] uppercase text-[11px] block">Noticeboard Read-Aloud Summary:</span>
                  <span>"{advisory.summaryNoticeForBoard}"</span>
                </div>
              </div>

              {/* Top Local Health Trends Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border-b-2 border-[#B68434] pb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h2 className="font-serif text-base font-extrabold text-stone-900 uppercase tracking-wide">
                    1. Top Village Health Trends This Week
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {advisory.topTrends.map((trend, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-900">{trend.symptom}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          trend.urgencyLevel === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {trend.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 leading-snug font-medium">
                        {trend.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preventive Care Tips Grounded in RAG Corpus */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border-b-2 border-[#B68434] pb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <h2 className="font-serif text-base font-extrabold text-stone-900 uppercase tracking-wide">
                    2. Preventive Care Guidelines (WHO IMCI & ICMR Verified)
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {advisory.preventiveTips.map((tip, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <div className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{tip.topic}</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-snug font-medium pl-5">
                        {tip.actionableAdvice}
                      </p>
                      <div className="pl-5 pt-1 text-[10px] font-mono text-emerald-800 font-bold flex items-center space-x-1">
                        <FileText className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>{tip.sourceCitation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheme Announcements & Eligibility */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border-b-2 border-[#B68434] pb-1">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <h2 className="font-serif text-base font-extrabold text-stone-900 uppercase tracking-wide">
                    3. Government Health Scheme Announcements
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {advisory.schemeAnnouncements.map((scheme, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                      <div className="text-xs font-extrabold text-blue-950 flex items-center justify-between">
                        <span>{scheme.schemeName}</span>
                        <span className="text-[10px] font-mono text-blue-800 underline">Official Scheme</span>
                      </div>
                      <p className="text-xs font-bold text-stone-900">
                        Benefits: {scheme.benefitSummary}
                      </p>
                      <p className="text-[11px] text-stone-700">
                        <strong className="text-stone-900">Eligibility:</strong> {scheme.eligibilityNotice}
                      </p>
                      <div className="pt-1 text-[10px] font-bold text-blue-900 bg-white p-1.5 rounded border border-blue-100">
                        Action Required: {scheme.actionRequired}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contacts & Noticeboard Footer */}
              <div className="pt-4 border-t-2 border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-100 p-4 rounded-xl">
                <div className="space-y-1 text-left">
                  <div className="text-xs font-black text-stone-900 uppercase">
                    Facility: {advisory.emergencyContact.phcName}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-stone-700 font-bold">
                    <span className="flex items-center space-x-1 text-red-700">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Emergency Ambulance: 108</span>
                    </span>
                    <span>•</span>
                    <span>{advisory.emergencyContact.ashaWorkerContact}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="p-1.5 bg-white border border-stone-300 rounded-lg">
                    <QrCode className="w-10 h-10 text-stone-900" />
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono text-left">
                    <span>Arogya Sahayak Verified</span>
                    <br />
                    <span>RAG Document ID: WHO-IMCI-2026</span>
                  </div>
                </div>
              </div>

            </div>

          ) : null}

        </div>

      </div>
    </div>
  );
};
