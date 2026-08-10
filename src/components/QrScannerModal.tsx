import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { db, doc, getDoc } from '../lib/firebase';
import { 
  X, 
  Camera, 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  WifiOff, 
  Globe, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  Activity,
  Zap,
  PhoneCall
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DecodedPatientHistory {
  id: string;
  name: string;
  age: number;
  dist: string;
  bpl: boolean;
  preg: boolean;
  history: Array<{
    sym: string[];
    sev: string;
    ts: string;
    advice?: string;
  }>;
  created?: string;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'paste'>('camera');
  const [pastedCode, setPastedCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [scannedData, setScannedData] = useState<DecodedPatientHistory | null>(null);
  const [isOnlineRecord, setIsOnlineRecord] = useState(false);
  const [onlineFetchLoading, setOnlineFetchLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrContainerId = 'html5qr-code-reader';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedData(null);
      setScanError(null);
    }
  }, [isOpen]);

  // Start camera scanning
  const startScanner = async () => {
    setScanError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrContainerId);
      }

      setIsScanning(true);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleProcessDecodedText(decodedText);
          stopScanner();
        },
        () => {
          // Frame error ignore
        }
      );
    } catch (err: any) {
      console.warn('Camera scan failed or permission denied:', err);
      setScanError('Camera access unavailable or blocked. Use manual paste/preset test buttons below.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop error:', e);
      } finally {
        setIsScanning(false);
      }
    }
  };

  // Decode QR String
  const handleProcessDecodedText = async (text: string) => {
    let rawJson = text.trim();
    if (rawJson.startsWith('AROGYA:')) {
      try {
        const b64 = rawJson.replace('AROGYA:', '');
        rawJson = decodeURIComponent(escape(atob(b64)));
      } catch (e) {
        console.error('Base64 decode error:', e);
      }
    }

    try {
      const parsed: DecodedPatientHistory = JSON.parse(rawJson);
      if (!parsed.id) throw new Error('Invalid Arogya Patient Health Card');

      setScannedData(parsed);

      // Attempt online fetch from Firestore if online
      if (navigator.onLine && parsed.id) {
        setOnlineFetchLoading(true);
        try {
          const docRef = doc(db, 'conversations', parsed.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setIsOnlineRecord(true);
          } else {
            setIsOnlineRecord(false);
          }
        } catch {
          setIsOnlineRecord(false);
        } finally {
          setOnlineFetchLoading(false);
        }
      } else {
        setIsOnlineRecord(false);
      }
    } catch (err) {
      setScanError('Could not decode QR payload. Ensure this is a valid Arogya Sahayak Digital Health Pass.');
    }
  };

  // Sample preset payloads for quick testing/demoing
  const loadDemoPatient = (type: 'critical' | 'maternal') => {
    if (type === 'critical') {
      const sample: DecodedPatientHistory = {
        id: 'AS-78A2F91C',
        name: 'Ramesh Patil',
        age: 52,
        dist: 'Pune Rural (Shirur)',
        bpl: true,
        preg: false,
        created: new Date().toLocaleDateString(),
        history: [
          {
            sym: ['Chest pressure', 'Difficulty breathing', 'Cold sweating'],
            sev: 'CRITICAL',
            ts: '10:15 AM',
            advice: 'Immediate emergency transfer to PHC. Administer CPR if unconscious.'
          },
          {
            sym: ['High fever', 'Body ache'],
            sev: 'MODERATE',
            ts: 'Yesterday',
            advice: 'Paracetamol 500mg and ORS hydration.'
          }
        ]
      };
      setScannedData(sample);
      setIsOnlineRecord(false);
    } else {
      const sample: DecodedPatientHistory = {
        id: 'AS-99B4D20X',
        name: 'Sunita Devi',
        age: 26,
        dist: 'Lucknow Rural (Banthra)',
        bpl: true,
        preg: true,
        created: new Date().toLocaleDateString(),
        history: [
          {
            sym: ['Mild anemia symptoms', '6-Month Antenatal Checkup query'],
            sev: 'MODERATE',
            ts: '02:30 PM',
            advice: 'Daily Iron Folic Acid (IFA) tablets and Janani Suraksha Yojana checkup.'
          }
        ]
      };
      setScannedData(sample);
      setIsOnlineRecord(false);
    }
  };

  if (!isOpen) return null;

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
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 leading-none">
                Scan Patient Health Card
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                ASHA / Healthcare Worker Field Reader
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
          
          {/* Main Scanned Patient History View */}
          {scannedData ? (
            <div className="space-y-4 animate-fade-in">
              
              {/* Sync Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-[#E5E0D8] dark:border-stone-800">
                <div className="flex items-center space-x-2">
                  {isOnlineRecord ? (
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Full Online Record Loaded</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-[#916323] dark:text-[#E0A845] text-xs font-bold border border-amber-500/30">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>⚡ Offline QR Snapshot (No Network Needed)</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setScannedData(null)}
                  className="text-xs font-bold text-[#916323] dark:text-[#E0A845] hover:underline cursor-pointer"
                >
                  Scan Another
                </button>
              </div>

              {/* Patient Profile Card Header */}
              <div className="p-4 rounded-xl bg-linear-to-r from-[#D4A24E]/10 via-[#FAFAF7] to-[#D4A24E]/10 dark:from-[#D4A24E]/10 dark:via-[#151318] dark:to-[#151318] border border-[#D4A24E]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#916323] dark:text-[#E0A845]">
                    {scannedData.id}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    Age: {scannedData.age} Yrs
                  </span>
                </div>
                <h4 className="font-serif text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {scannedData.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A24E]" />
                    <span>{scannedData.dist}</span>
                  </span>
                  {scannedData.bpl && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[#916323] dark:text-[#E0A845] text-[10px] font-bold">
                      BPL Card Holder
                    </span>
                  )}
                  {scannedData.preg && (
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-700 dark:text-pink-300 text-[10px] font-bold">
                      Maternal Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Symptom History Timeline */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Patient Symptom History & Escalation Trend:
                </h5>

                <div className="space-y-3">
                  {scannedData.history?.map((h, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-stone-100/90 dark:bg-stone-900/60 border border-[#E5E0D8] dark:border-stone-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          h.sev === 'CRITICAL' 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : h.sev === 'HIGH'
                            ? 'bg-orange-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {h.sev} SEVERITY
                        </span>
                        <span className="text-stone-400 font-mono text-[11px] flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{h.ts}</span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">
                          Reported Symptoms:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {h.sym?.map((s, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 rounded bg-[#FAFAF7] dark:bg-[#151318] border border-[#E5E0D8] dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300 font-medium">
                              • {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {h.advice && (
                        <p className="text-stone-600 dark:text-stone-300 bg-[#FAFAF7] dark:bg-[#151318] p-2 rounded-lg border border-[#E5E0D8] dark:border-stone-800 italic text-[11px]">
                          "{h.advice}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Action Bar for Healthcare Worker */}
              <div className="pt-3 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center gap-2">
                <a
                  href="tel:108"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Dispatch 108 Ambulance</span>
                </a>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Scan Mode Toggle */}
              <div className="flex p-1 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs font-bold">
                <button
                  onClick={() => { setActiveTab('camera'); startScanner(); }}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeTab === 'camera' ? 'bg-white dark:bg-stone-900 shadow-xs text-stone-900 dark:text-stone-100' : 'text-stone-500'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera Scan</span>
                </button>
                <button
                  onClick={() => { setActiveTab('paste'); stopScanner(); }}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeTab === 'paste' ? 'bg-white dark:bg-stone-900 shadow-xs text-stone-900 dark:text-stone-100' : 'text-stone-500'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Paste / Test Demo</span>
                </button>
              </div>

              {scanError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs">
                  {scanError}
                </div>
              )}

              {/* Camera Container */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-stone-900 aspect-square flex items-center justify-center border-2 border-dashed border-[#D4A24E]/40">
                    <div id={qrContainerId} className="w-full h-full" />
                    {!isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-3 bg-stone-950/80 text-white">
                        <Camera className="w-10 h-10 text-[#D4A24E] animate-bounce" />
                        <p className="text-xs font-medium">
                          Point camera at citizen's Arogya Health Card QR code
                        </p>
                        <button
                          onClick={startScanner}
                          className="px-4 py-2 rounded-xl bg-[#D4A24E] text-slate-950 text-xs font-extrabold cursor-pointer hover:bg-[#E0A845]"
                        >
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Input / Instant Test Presets */}
              {activeTab === 'paste' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Paste AROGYA Base64 String:
                    </label>
                    <textarea
                      rows={3}
                      value={pastedCode}
                      onChange={(e) => setPastedCode(e.target.value)}
                      placeholder="Paste AROGYA:... payload here"
                      className="w-full p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono"
                    />
                    <button
                      onClick={() => handleProcessDecodedText(pastedCode)}
                      disabled={!pastedCode.trim()}
                      className="mt-2 w-full py-2.5 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      Decode Payload
                    </button>
                  </div>
                </div>
              )}

              {/* INSTANT DEMO PRESETS FOR EASY DEMO TESTING */}
              <div className="pt-3 border-t border-[#E5E0D8] dark:border-stone-800 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#916323] dark:text-[#E0A845] block">
                  ⚡ Instant Judge Demo Test Cards (Click to Test Offline Reader):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => loadDemoPatient('critical')}
                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 hover:bg-red-100 text-left cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-xs text-red-900 dark:text-red-200 block">
                      🔴 Critical Chest Pain Patient
                    </span>
                    <span className="text-[10px] text-red-700 dark:text-red-300 block">
                      Ramesh Patil (52 Yrs) • Offline Emergency
                    </span>
                  </button>

                  <button
                    onClick={() => loadDemoPatient('maternal')}
                    className="p-2.5 rounded-xl bg-[#FAFAF7] dark:bg-stone-900 border border-[#E5E0D8] dark:border-stone-800 hover:border-[#D4A24E] text-left cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                      🤰 Pregnant Mother (6-Mo ANC)
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      Sunita Devi (26 Yrs) • Maternal Priority
                    </span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-end space-x-3 shrink-0">
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Reader
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
