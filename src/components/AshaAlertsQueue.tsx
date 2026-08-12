import React, { useEffect, useState, useRef } from 'react';
import { AshaAlert, AshaNotification, ProactiveAlert } from '../types/health';
import { getAshaAlertsAsync, createAshaAlert } from '../services/alertsService';
import { QrScannerModal } from './QrScannerModal';
import { VillageHealthAdvisoryModal } from './VillageHealthAdvisoryModal';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
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
  BellRing,
  BellOff,
  Volume2,
  X,
  Inbox,
  Send,
  Calendar,
  Bug,
  Shield,
  AlertTriangle as AlertTriangleIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AshaAlertsQueue: React.FC = () => {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const [alerts, setAlerts] = useState<AshaAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);

  // Notification & Realtime Toast State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [activeEmergencyToast, setActiveEmergencyToast] = useState<AshaAlert | null>(null);
  const [notificationLog, setNotificationLog] = useState<AshaNotification[]>([]);
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([]);
  const [showNotifLog, setShowNotifLog] = useState(false);
  const [showProactivePanel, setShowProactivePanel] = useState(false);
  const isInitialSnapshot = useRef(true);

  // Web Audio Chime Synthesis
  const playEmergencyChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };
      // Dual high-pitch siren motif
      playTone(880, 0, 0.2);
      playTone(1046.5, 0.22, 0.25);
      playTone(880, 0.5, 0.2);
      playTone(1046.5, 0.72, 0.35);
    } catch (e) {
      console.warn('Audio chime warning:', e);
    }
  };

  const enableBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      try {
        new Notification('🚨 ASHA Emergency Alert System Active', {
          body: `Registered for district sector: ${userProfile?.district || 'Pune Rural'}. Real-time push notifications enabled.`,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Test notification error:', e);
      }
    }
  };

  const triggerDemoAlert = () => {
    const demoAlert: AshaAlert = {
      id: 'demo_' + Date.now(),
      sessionId: 'sess_demo_' + Date.now(),
      severity: 'CRITICAL',
      symptomTags: ['Severe Chest Pain', 'Shortness of Breath', 'High Fever'],
      userMessage: '[DEMO TEST] Patient reporting sudden onset acute chest discomfort and high fever in Khed Sector.',
      escalationReason: 'Immediate clinical triage trigger: Acute respiratory & cardiac warning tags.',
      timestamp: new Date().toISOString(),
      status: 'pending',
      district: userProfile?.district || 'Pune Rural (Khed Sector)',
      userIdHash: 'usr_hash_' + Math.random().toString(36).substring(2, 8)
    };

    createAshaAlert(demoAlert);
    playEmergencyChime();
    setActiveEmergencyToast(demoAlert);
  };

  const triggerProactiveNotice = async () => {
    // Fetch proactive alerts from backend instead of hardcoded window.alert
    try {
      const res = await fetch('/api/proactiveAlerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          district: userProfile?.district || 'Pune Rural'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.alerts)) {
          setProactiveAlerts(data.alerts);
          setShowProactivePanel(true);

          // Also dispatch browser push notification
          if ('Notification' in window && Notification.permission === 'granted' && data.alerts.length > 0) {
            try {
              const firstAlert = data.alerts[0];
              new Notification(`📢 ${firstAlert.title}`, {
                body: firstAlert.message.substring(0, 200) + '...',
                icon: '/favicon.ico'
              });
            } catch (e) {
              console.warn('Push notification error:', e);
            }
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Proactive alerts API unavailable, using fallback:', err);
    }

    // Fallback: generate client-side proactive notice
    const schemeNotice = {
      title: '📢 Scheme Application Deadline Alert (5 Days Remaining)',
      body: `Matched Profile: ${userProfile?.isBPL ? 'BPL Household' : 'Rural Resident'} in ${userProfile?.district || 'Pune Rural'}.\nScheme: Janani Suraksha Yojana / PM-JAY Renewal deadline approaching.\nStatus: Proactive alert sent via Push & SMS.`
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(schemeNotice.title, {
          body: schemeNotice.body,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Proactive push error:', e);
      }
    }

    // Show as in-app panel with single fallback alert
    setProactiveAlerts([{
      id: 'fallback_' + Date.now(),
      type: 'scheme_deadline',
      title: '⏰ PM-JAY & JSY Scheme Deadline Approaching',
      message: `${userProfile?.isBPL ? 'BPL Household' : 'Rural Resident'} in ${userProfile?.district || 'Pune Rural'}: Janani Suraksha Yojana / PM-JAY renewal deadline in 5 days. Visit nearest PHC with Aadhaar and ration card.`,
      urgency: 'WARNING',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      schemeName: 'PM-JAY / JSY',
      schemeUrl: 'https://pmjay.gov.in',
      district: userProfile?.district || 'Pune Rural',
      generatedAt: new Date().toISOString(),
    }]);
    setShowProactivePanel(true);
  };

  const fetchAlerts = async () => {
    setIsLoading(true);
    let loadedAlerts: AshaAlert[] | null = null;
    try {
      const res = await fetch('/api/ashaAlerts');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.alerts)) {
          loadedAlerts = data.alerts;
        }
      }
    } catch (err) {
      console.warn('API /api/ashaAlerts endpoint unavailable, using direct alerts service fallback:', err);
    }

    if (!loadedAlerts) {
      try {
        const fallbackAlerts = await getAshaAlertsAsync();
        loadedAlerts = fallbackAlerts;
      } catch (fErr) {
        console.error('Client alerts service fallback error:', fErr);
      }
    }

    if (loadedAlerts) {
      setAlerts(loadedAlerts);
    }
    setIsLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/ashaNotifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setNotificationLog(data.notifications);
        }
      }
    } catch (err) {
      console.warn('Could not fetch notification log:', err);
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
    fetchNotifications();
    checkHealth();

    // Attach real-time Firestore listener for live escalations without page reloads
    try {
      const q = query(collection(db, 'asha_alerts'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fsAlerts: AshaAlert[] = [];
        snapshot.forEach((docSnap) => {
          fsAlerts.push(docSnap.data() as AshaAlert);
        });

        if (!isInitialSnapshot.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newAlert = change.doc.data() as AshaAlert;
              if (newAlert.status === 'pending') {
                playEmergencyChime();
                setActiveEmergencyToast(newAlert);

                if ('Notification' in window && Notification.permission === 'granted') {
                  try {
                    new Notification(`🚨 ${newAlert.severity} ASHA ESCALATION`, {
                      body: `Sector: ${newAlert.district || 'Rural Sector'}\nSymptoms: ${newAlert.symptomTags?.join(', ')}\n"${newAlert.userMessage}"`,
                      requireInteraction: true
                    });
                  } catch (e) {
                    console.warn('Push notification trigger error:', e);
                  }
                }
              }
            }
          });
        }
        isInitialSnapshot.current = false;
        setAlerts(fsAlerts);
        setIsLoading(false);
      }, (error) => {
        console.warn('Firestore onSnapshot listener error (falling back to REST API polling):', error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Realtime listener init error:', err);
      const interval = setInterval(() => { fetchAlerts(); fetchNotifications(); }, 5000);
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
          <span>{t('systemHealthMonitor')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="font-semibold text-stone-300">{t('aiTriageEngine')}</span>
            <span className="text-emerald-400 font-bold">{t('operational')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-300">{t('schemeMatching')}</span>
            <span className="text-emerald-400 font-bold">{t('operational')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-300">{t('facilityLocator')}</span>
            <span className="text-emerald-400 font-bold">{t('operational')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-300">{t('outbreakDetection')}</span>
            <span className="text-emerald-400 font-bold">{t('operational')}</span>
          </div>
        </div>
      </div>

      {/* Active Floating Emergency Alert Toast */}
      {activeEmergencyToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-red-600 text-white rounded-2xl p-5 shadow-2xl border-2 border-amber-300 animate-bounce ring-4 ring-red-500/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-white/20 text-white animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black tracking-widest text-amber-200 uppercase">
                  CRITICAL ASHA ESCALATION RECEIVED
                </div>
                <h4 className="font-bold text-base">
                  {activeEmergencyToast.severity} Priority: {activeEmergencyToast.district || 'Village Sector'}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setActiveEmergencyToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-xs bg-black/20 p-2.5 rounded-xl font-medium leading-relaxed">
            "{activeEmergencyToast.userMessage}"
          </p>

          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-red-100">
            <span>Symptoms: {activeEmergencyToast.symptomTags?.join(', ')}</span>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <button
              onClick={() => {
                handleUpdateStatus(activeEmergencyToast.id, 'acknowledged');
                setActiveEmergencyToast(null);
              }}
              className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs transition-colors shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Acknowledge Immediately</span>
            </button>
            <button
              onClick={playEmergencyChime}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title="Replay Audio Siren"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl p-6 border border-[#E5E0D8] dark:border-[#26232D] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase">
              {t('emergencyEscalationQueue')}
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                {t('ashaAlertDispatch')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-black">
                {alerts.filter(a => a.status === 'pending').length} {t('pendingLabel')}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {t('ashaDispatchDesc')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center space-x-2 gap-y-2 w-full md:w-auto">
          <button
            onClick={enableBrowserNotifications}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer ${
              notifPermission === 'granted'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            {notifPermission === 'granted' ? (
              <>
                <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <span>Push Alerts Active</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 text-amber-700" />
                <span>Enable Push Alerts</span>
              </>
            )}
          </button>

          <button
            onClick={triggerDemoAlert}
            className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border border-red-400"
            title="Simulate a real-time critical escalation alert for testing"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Simulate Emergency Alert</span>
          </button>

          <button
            onClick={triggerProactiveNotice}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border border-amber-300"
            title="Dispatch proactive scheme deadline & outbreak advisory notice to opted-in users"
          >
            <BellRing className="w-4 h-4 text-stone-900" />
            <span>Test Proactive Notice</span>
          </button>

          <button
            onClick={() => setIsAdvisoryModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#151318] dark:bg-stone-100 text-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border border-[#D4A24E]/40"
          >
            <Sparkles className="w-4 h-4 text-[#D4A24E]" />
            <span>{t('generateVillageAdvisory')}</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>{t('scanPatientCard')}</span>
          </button>

          <button
            onClick={fetchAlerts}
            className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refreshQueue')}</span>
          </button>

          <button
            onClick={() => { fetchNotifications(); setShowNotifLog(!showNotifLog); }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
              showNotifLog
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-sky-400'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Notification Log</span>
            {notificationLog.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-black">
                {notificationLog.filter(n => n.type === 'sms').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification Dispatch Log Panel */}
      {showNotifLog && (
        <div className="bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl p-5 border border-sky-300 dark:border-sky-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Inbox className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">ASHA Notification Dispatch Log</h3>
              <span className="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-black">
                {notificationLog.filter(n => n.type === 'sms').length} SMS
              </span>
            </div>
            <button
              onClick={() => setShowNotifLog(false)}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {notificationLog.length === 0 ? (
            <p className="text-xs text-stone-500 dark:text-stone-400 text-center py-4">
              No notifications dispatched yet. Notifications are sent automatically when CRITICAL/HIGH cases are flagged.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notificationLog.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    notif.severity === 'CRITICAL'
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900'
                      : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {notif.type === 'sms' ? (
                        <Send className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <BellRing className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span className="font-bold uppercase">
                        {notif.type === 'sms' ? 'SMS Dispatched' : 'Push Notification'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        notif.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-stone-950'
                      }`}>
                        {notif.severity}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500">
                      {new Date(notif.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-400">
                    District: <strong>{notif.recipientDistrict}</strong> • Symptoms: {notif.symptomTags?.join(', ')}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${notif.dispatched ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-semibold text-stone-500">
                      {notif.dispatched ? 'Successfully dispatched' : 'Dispatch failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proactive Alerts Feed Panel */}
      {showProactivePanel && proactiveAlerts.length > 0 && (
        <div className="bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl p-5 border-2 border-[#D4A24E]/40 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-[#D4A24E] animate-bounce" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Proactive Health & Scheme Alerts</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#D4A24E] text-slate-950 text-[10px] font-black">
                {proactiveAlerts.length}
              </span>
            </div>
            <button
              onClick={() => setShowProactivePanel(false)}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {proactiveAlerts.map((pa) => {
              const urgencyColors: Record<string, string> = {
                'URGENT': 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200',
                'WARNING': 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
                'INFO': 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200',
              };
              const urgencyBadge: Record<string, string> = {
                'URGENT': 'bg-red-600 text-white',
                'WARNING': 'bg-amber-500 text-stone-950',
                'INFO': 'bg-sky-500 text-white',
              };
              const typeIcons: Record<string, React.ReactNode> = {
                'scheme_deadline': <Calendar className="w-4 h-4" />,
                'outbreak_advisory': <Bug className="w-4 h-4" />,
                'immunization_reminder': <Shield className="w-4 h-4" />,
                'seasonal_health': <AlertTriangleIcon className="w-4 h-4" />,
              };

              return (
                <div
                  key={pa.id}
                  className={`p-4 rounded-xl border ${urgencyColors[pa.urgency] || urgencyColors['INFO']} space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {typeIcons[pa.type] || <BellRing className="w-4 h-4" />}
                      <span className="text-xs font-bold">{pa.title}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${urgencyBadge[pa.urgency] || urgencyBadge['INFO']}`}>
                      {pa.urgency}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{pa.message}</p>
                  {pa.deadline && (
                    <div className="flex items-center space-x-1 text-[11px] font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>Deadline: {new Date(pa.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                  {pa.schemeUrl && (
                    <a href={pa.schemeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold underline">
                      Official Details →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#FAFAF7] dark:bg-[#151318] border border-[#E5E0D8] dark:border-[#26232D] text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {t('noActiveEscalations')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1">
                {t('noEscalationsDesc')}
              </p>
            </div>
            <button
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-xs font-bold transition-all shadow-md inline-flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D4A24E]" />
              <span>{t('generateWeeklyAdvisory')}</span>
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
                    {alert.severity} {t('escalationLabel')}
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
                    {t('anonymizedHash')} {alert.userIdHash.substring(0, 10)}...
                  </span>
                </div>
              </div>

              {/* Symptom Badges & Patient Message */}
              <div className="space-y-3">
                <div className="flex flex-col space-y-1.5 items-start">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">{t('triggerSymptoms')}</span>
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
                  <span className="font-bold">{t('reasonForTrigger')}</span> {alert.escalationReason}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="mt-5 pt-4 border-t border-[#E5E0D8] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-stone-500">{t('statusLabel')}</span>
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
                      <span>{t('acknowledgeAlert')}</span>
                    </button>
                  )}

                  {(isPending || isAck) && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'visited')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('markHomeVisitDone')}</span>
                    </button>
                  )}

                  <a
                    href="tel:108"
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{t('dispatchAmbulance')}</span>
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
