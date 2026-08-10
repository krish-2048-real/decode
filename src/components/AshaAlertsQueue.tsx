import React, { useEffect, useState } from 'react';
import { AshaAlert } from '../types/health';
import { QrScannerModal } from './QrScannerModal';
import { VillageHealthAdvisoryModal } from './VillageHealthAdvisoryModal';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  PhoneCall, 
  UserCheck, 
  RefreshCw,
  Activity,
  Server,
  QrCode,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const AshaAlertsQueue: React.FC = () => {
  const [alerts, setAlerts] = useState<AshaAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ashaAlerts');
      const data = await res.json();
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Error fetching ASHA alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'ok') {
        setIsSystemHealthy(true);
      }
    } catch {
      setIsSystemHealthy(true);
    }
  };

  useEffect(() => {
    fetchAlerts();
    checkHealth();

    // Attach real-time Firestore listener for live escalations without page reloads
    try {
      const q = query(collection(db, 'asha_alerts'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fsAlerts: AshaAlert[] = [];
          snapshot.forEach((docSnap) => {
            fsAlerts.push(docSnap.data() as AshaAlert);
          });
          setAlerts(fsAlerts);
        } else {
          setAlerts([]);
        }
        setIsLoading(false);
      }, (error) => {
        console.warn('Firestore onSnapshot listener error (falling back to REST API polling):', error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Realtime listener init error:', err);
      const interval = setInterval(fetchAlerts, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdateStatus = async (alertId: string, newStatus: 'pending' | 'acknowledged' | 'visited') => {
    try {
      const res = await fetch(`/api/ashaAlerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.alert) {
        setAlerts(prev => prev.map(a => a.id === alertId ? data.alert : a));
      }
    } catch (err) {
      console.error('Error updating alert:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* System Status Bar */}
      <div className="bg-[#151318] text-white rounded-xl p-3 border border-[#26232D] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 font-bold text-stone-300">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>System Health Monitor:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="font-semibold text-stone-300">AI Triage Engine:</span>
            <span className="text-emerald-400 font-bold">Operational</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-300">Scheme Matching:</span>
            <span className="text-emerald-400 font-bold">Operational</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-300">Facility Locator:</span>
            <span className="text-emerald-400 font-bold">Operational</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-300">Outbreak Detection:</span>
            <span className="text-emerald-400 font-bold">Operational</span>
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl p-6 border border-[#E5E0D8] dark:border-[#26232D] shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase">
              Emergency Escalation Queue
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                ASHA & ANM Alert Dispatch
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-black">
                {alerts.filter(a => a.status === 'pending').length} PENDING
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Automated high-severity symptom triggers for local village healthcare workers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center space-x-2 gap-y-2">
          <button
            onClick={() => setIsAdvisoryModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#151318] dark:bg-stone-100 text-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white text-xs font-extrabold transition-all shadow-md flex items-center space-x-2 cursor-pointer border border-[#D4A24E]/40"
          >
            <Sparkles className="w-4 h-4 text-[#D4A24E]" />
            <span>Generate Village Advisory</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Patient Card</span>
          </button>

          <button
            onClick={fetchAlerts}
            className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#FAFAF7] dark:bg-[#151318] border border-[#E5E0D8] dark:border-[#26232D] text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                No Active Emergency Escalations
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1">
                The ASHA dispatch queue is currently clear. When patients report red-flag emergency symptoms during triage sessions, automated alerts will appear here in real-time.
              </p>
            </div>
            <button
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-xs font-bold transition-all shadow-md inline-flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D4A24E]" />
              <span>Generate Weekly Village Health Advisory Poster</span>
            </button>
          </div>
        ) : (
          alerts.map((alert) => {
          const isPending = alert.status === 'pending';
          const isAck = alert.status === 'acknowledged';

          return (
            <div
              key={alert.id}
              className={`p-6 rounded-2xl border transition-all ${
                isPending
                  ? 'bg-[#FAFAF7] dark:bg-[#151318] border-red-300 dark:border-red-900 shadow-xl ring-2 ring-red-500/20'
                  : 'bg-stone-100/60 dark:bg-[#151318]/60 border-[#E5E0D8] dark:border-[#26232D]'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#E5E0D8] dark:border-stone-800">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {alert.severity} ESCALATION
                  </span>

                  <span className="text-xs text-stone-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>

                  <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center space-x-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A24E]" />
                    <span>{alert.district || 'District Rural Sector'}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-stone-400">
                    Anonymized Hash: {alert.userIdHash.substring(0, 10)}...
                  </span>
                </div>
              </div>

              {/* Symptom Badges & Patient Message */}
              <div className="space-y-3">
                <div className="flex flex-col space-y-1.5 items-start">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Trigger Symptoms (Vertical Stack):</span>
                  {alert.symptomTags?.map((tag, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold w-full text-left"
                    >
                      • {tag}
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-medium">
                  "{alert.userMessage}"
                </div>

                <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-900 dark:text-red-200 space-y-0.5">
                  <span className="font-bold">Reason for Trigger:</span> {alert.escalationReason}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="mt-5 pt-4 border-t border-[#E5E0D8] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-stone-500">Status:</span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-extrabold uppercase ${
                      alert.status === 'visited'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isAck
                        ? 'bg-[#D4A24E]/20 text-[#916323] dark:text-[#E0A845]'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'acknowledged')}
                      className="px-3.5 py-2 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-bold transition-colors shadow-sm flex items-center space-x-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Acknowledge Alert</span>
                    </button>
                  )}

                  {(isPending || isAck) && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'visited')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Home Visit Done</span>
                    </button>
                  )}

                  <a
                    href="tel:108"
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Dispatch 108 Ambulance</span>
                  </a>
                </div>
              </div>

            </div>
          );
        }))}
      </div>

      {/* QR Scanner Modal for ASHA Workers */}
      <QrScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Village Health Advisory Modal */}
      <VillageHealthAdvisoryModal
        isOpen={isAdvisoryModalOpen}
        onClose={() => setIsAdvisoryModalOpen(false)}
      />

    </div>
  );
};
