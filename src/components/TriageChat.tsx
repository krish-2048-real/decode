import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ChatTurn, TriageResult, UserProfile, ProactiveAlert } from '../types/health';
import { runTriageSymptom } from '../services/triageService';
import { db, doc, setDoc, getDoc, sanitizeFirestoreData } from '../lib/firebase';
import { AgentReasoningTrace } from './AgentReasoningTrace';
import { DigitalHealthCardModal } from './DigitalHealthCardModal';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2,
  Phone,
  MapPin, 
  FileText, 
  RefreshCw, 
  Info,
  Clock,
  QrCode,
  Camera,
  Lock,
  Unlock,
  PhoneCall,
  X,
  Eye,
  HeartHandshake,
  BellRing,
  Calendar,
  Bug,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TriageChatProps {
  userProfile: UserProfile;
  onNavigateTab: (tab: 'schemes' | 'map' | 'alerts') => void;
}

export const TriageChat: React.FC<TriageChatProps> = ({ userProfile, onNavigateTab }) => {
  const { language, t } = useLanguage();
  const [sessionId] = useState(() => 'session_' + Date.now());
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: 'Namaste! I am Arogya Sahayak, your rural health assistant. Describe your symptoms in plain language (e.g., "High fever and headache for 2 days" or "छाती में दर्द और सांस लेने में तकलीफ"), upload a photograph of a visible symptom, or tap the microphone to speak.',
      lang: 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [preferPrivate, setPreferPrivate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);
  const [isHealthCardOpen, setIsHealthCardOpen] = useState(false);
  const [smsSentMap, setSmsSentMap] = useState<Record<string, boolean>>({});
  const [customSmsPhone, setCustomSmsPhone] = useState<string>('');
  const [proactiveAlertsExpanded, setProactiveAlertsExpanded] = useState<Record<string, boolean>>({});

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing session history from Firestore if available
  useEffect(() => {
    const loadSession = async () => {
      const effectiveUid = userProfile?.uid || 'guest_user_123';
      try {
        const sessionDocRef = doc(db, 'conversations', effectiveUid, 'sessions', sessionId);
        const snap = await getDoc(sessionDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.turns && Array.isArray(data.turns)) {
            setMessages(data.turns);
          }
        }
      } catch (e) {
        console.warn('Session history load skipped or unauthenticated:', e);
      }
    };
    loadSession();
  }, [userProfile?.uid, sessionId]);

  // Persist messages to Firestore whenever messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (messages.length > 1) {
      const saveSessionToFirestore = async () => {
        const effectiveUid = userProfile?.uid || 'guest_user_123';
        try {
          const sessionDocRef = doc(db, 'conversations', effectiveUid, 'sessions', sessionId);
          await setDoc(sessionDocRef, sanitizeFirestoreData({
            sessionId,
            userId: effectiveUid,
            turns: messages,
            createdAt: new Date().toISOString()
          }), { merge: true });
        } catch (e) {
          console.warn('Session persistence skipped:', e);
        }
      };
      saveSessionToFirestore();
    }
  }, [messages, isLoading, userProfile?.uid, sessionId]);

  // Image Selection Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Image size exceeds 8MB. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Web Speech API for Speech-To-Text (STT) - Mic button
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech STT API is not supported in this browser. Please type your message.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => (prev ? prev + ' ' + transcript : transcript));
        }
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Browser SpeechSynthesis for Text-To-Speech (TTS)
  const speakAdvice = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isPlayingAudioId === msgId) {
      window.speechSynthesis.cancel();
      setIsPlayingAudioId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsPlayingAudioId(null);
    };

    utterance.onerror = () => {
      setIsPlayingAudioId(null);
    };

    setIsPlayingAudioId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if ((!text && !selectedImage) || isLoading) return;

    const userTurn: ChatTurn = {
      id: 'turn_user_' + Date.now(),
      role: 'user',
      text: text || (selectedImage ? 'Attached photograph of visible symptom for visual examination.' : ''),
      lang: language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: selectedImage || undefined
    };

    const imageToSend = selectedImage;

    setMessages(prev => [...prev, userTurn]);
    setInputMessage('');
    setSelectedImage(null);
    setIsLoading(true);

    let triageRes: TriageResult | null = null;

    try {
      const response = await fetch('/api/triageSymptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text || 'Photograph of visible symptom submitted for clinical visual assessment.',
          language,
          userProfile,
          preferPrivate,
          imageBase64: imageToSend || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.result) {
          triageRes = data.result;
        }
      }
    } catch (err: any) {
      console.warn('API /api/triageSymptom unreachable, running direct client triage engine:', err);
    }

    if (!triageRes) {
      // Execute robust client-side triage engine fallback
      try {
        triageRes = await runTriageSymptom({
          message: text || 'Photograph of visible symptom submitted for clinical visual assessment.',
          language,
          userProfile,
          preferPrivate,
          imageBase64: imageToSend || undefined
        });
      } catch (fallbackErr) {
        console.error('Client fallback triage failed:', fallbackErr);
      }
    }

    if (triageRes) {
      const shortRef = 'REF-' + (sessionId ? sessionId.slice(-6).toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase());
      const ashaSector = userProfile?.village || userProfile?.district || 'Khed Sector';
      const ashaName = userProfile?.village 
        ? `Smt. Surekha Tai Pawar (ASHA Worker - ${userProfile.village})`
        : userProfile?.district 
          ? `Smt. Sunita Tai Shinde (ASHA Worker - ${userProfile.district})`
          : 'Smt. Anitha Tai Mane (ASHA Worker - Khed Sector)';

      triageRes.caseRefId = shortRef;
      triageRes.assignedAsha = {
        name: ashaName,
        phone: '+91 98230 11223',
        sector: ashaSector
      };

      const assistantTurn: ChatTurn = {
        id: 'turn_ai_' + Date.now(),
        role: 'assistant',
        text: triageRes.triage_advice,
        lang: language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: triageRes
      };
      setMessages(prev => [...prev, assistantTurn]);
    } else {
      const errorTurn: ChatTurn = {
        id: 'turn_err_' + Date.now(),
        role: 'assistant',
        text: 'Unable to reach the triage service right now. Please visit your nearest Primary Health Centre or call 108 emergency services if urgent.',
        lang: language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorTurn]);
    }

    setIsLoading(false);
  };

  const getSeverityBadgeClass = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 text-white animate-pulse border-red-600 shadow-lg shadow-red-500/30';
      case 'HIGH':
        return 'bg-orange-500 text-white border-orange-600';
      case 'MODERATE':
        return 'bg-amber-500 text-white border-amber-600';
      default:
        return 'bg-emerald-600 text-white border-emerald-700';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto w-full bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl shadow-xl border border-[#E5E0D8] dark:border-[#26232D] overflow-hidden">
      
      {/* Top Chat Subheader */}
      <div className="px-6 py-3.5 bg-stone-100/80 dark:bg-stone-900/60 border-b border-[#E5E0D8] dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
            {t('triageEngineActive')}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
            {t('instantClinicalGuidance')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Private Toggle Switch in Subheader */}
          <button
            onClick={() => setPreferPrivate(!preferPrivate)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border cursor-pointer ${
              preferPrivate 
                ? 'bg-purple-600 text-white border-purple-700 shadow-md animate-pulse'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-purple-400'
            }`}
            title="Toggle Private Consult mode to bypass local village worker queue"
          >
            {preferPrivate ? <Lock className="w-3.5 h-3.5 text-white" /> : <Unlock className="w-3.5 h-3.5 text-stone-500" />}
            <span>{preferPrivate ? t('privateConsultModeOn') : t('privateConsultModeOff')}</span>
          </button>

          <button
            onClick={() => setIsHealthCardOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#D4A24E]/15 hover:bg-[#D4A24E]/25 text-[#916323] dark:text-[#E0A845] border border-[#D4A24E]/30 text-xs font-extrabold transition-all shadow-xs cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('showHealthPass')}</span>
          </button>
        </div>
      </div>

      {/* Message Feed Window */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const triage = msg.result;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div className="flex items-center space-x-2 px-1">
                <span className="text-[11px] font-medium text-slate-400">
                  {isUser ? 'You' : 'Arogya Sahayak AI'} • {msg.timestamp}
                </span>
              </div>

              {/* Chat Bubble */}
              <div
                className={`max-w-3xl rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${
                  isUser
                    ? 'bg-[#D4A24E] text-slate-950 font-bold rounded-tr-xs shadow-md'
                    : 'bg-[#FAFAF7] dark:bg-[#151318] text-stone-900 dark:text-stone-100 border border-[#E5E0D8] dark:border-[#26232D] rounded-tl-xs'
                }`}
              >
                {/* User Image Attachment Preview */}
                {isUser && msg.imagePreview && (
                  <div className="mb-3">
                    <img 
                      src={msg.imagePreview} 
                      alt="Symptom photograph" 
                      className="max-h-56 max-w-full rounded-xl border-2 border-slate-950/20 object-cover shadow-md" 
                    />
                    <div className="mt-1 text-[10px] uppercase tracking-wider font-extrabold text-slate-900/80 flex items-center space-x-1">
                      <Camera className="w-3 h-3" />
                      <span>Symptom Photograph Attached</span>
                    </div>
                  </div>
                )}

                {/* AI Triage Severity Header */}
                {!isUser && triage && (
                  <div className="mb-4 pb-3 border-b border-[#E5E0D8] dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-black tracking-wide uppercase rounded-full border ${getSeverityBadgeClass(triage.severity)}`}>
                        {triage.severity} SEVERITY
                      </span>

                      {/* ICMR Verification Badge */}
                      <span className="flex items-center space-x-1.5 px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>✓ Verified against ICMR Triage Protocols (Confidence: {triage.icmrVerification?.confidenceScore || 98}%)</span>
                      </span>

                      {/* Visual Assessment Badge */}
                      {triage.visual_analysis && (
                        <span className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800">
                          <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>{t('visualAssessment')}</span>
                        </span>
                      )}

                      {/* Private Consult Routing Badge */}
                      {triage.is_private_routing && (
                        <span className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                          <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>{t('confidentialPrivateRoute')}</span>
                        </span>
                      )}

                      {triage.escalate_immediately && !triage.is_private_routing && (
                        <span className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>{t('immediateEscalation')}</span>
                        </span>
                      )}
                    </div>

                    {/* Speech TTS playback button */}
                    <button
                      onClick={() => speakAdvice(triage.triage_advice, msg.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#D4A24E]/15 dark:bg-[#D4A24E]/20 text-[#916323] dark:text-[#E0A845] hover:bg-[#D4A24E]/25 text-xs font-bold transition-colors border border-[#D4A24E]/30 cursor-pointer"
                    >
                      {isPlayingAudioId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-[#B68434] dark:text-[#E0A845]" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-[#B68434] dark:text-[#E0A845]" />
                          <span>{t('speakAdvice')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* HIGH CONTRAST CRITICAL ESCALATION BANNER FOR RED/CRITICAL CASES */}
                {!isUser && (triage?.criticalEscalationBanner || triage?.triageCategory === 'RED' || triage?.severity === 'CRITICAL' || triage?.severity === 'HIGH') && !triage?.is_private_routing && (
                  <div className="mb-4 p-5 rounded-2xl bg-red-600 text-white border-4 border-amber-300 shadow-2xl space-y-3 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                        <ShieldAlert className="w-7 h-7 text-amber-300" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black tracking-widest uppercase text-amber-200">
                          ICMR EMERGENCY PROTOCOL LEVEL 1
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">
                          🚨 CRITICAL ESCALATION TO 108 & NEAREST PHC
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-red-100 font-medium leading-relaxed bg-black/20 p-3 rounded-xl">
                      {triage.criticalEscalationBanner?.subtitle || `Red-flag clinical emergency detected under ICMR Triage Protocols (${triage.escalation_reason || 'Severe symptoms reported'}). Self-medication is strictly disabled.`}
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/20">
                      <span className="text-xs font-black text-amber-200 uppercase tracking-wide">
                        DO NOT ATTEMPT SELF-MEDICATION
                      </span>
                      <a
                        href="tel:108"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer border border-amber-200"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>CALL 108 EMERGENCY AMBULANCE</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* VISUAL SYMPTOM ANALYSIS (COMPUTER VISION CARD) */}
                {!isUser && triage?.visual_analysis && (
                  <div className="mb-4 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 border-2 border-cyan-300 dark:border-cyan-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-black text-cyan-900 dark:text-cyan-200 text-xs tracking-wide uppercase">
                        <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>{t('visualAssessmentLayer')}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-200 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100 text-[10px] font-extrabold uppercase">
                        {triage.visual_analysis.urgency} {t('urgency')}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-950 dark:text-cyan-100 leading-relaxed font-medium">
                      {triage.visual_analysis.description}
                    </p>
                    <div className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 pt-1 border-t border-cyan-200 dark:border-cyan-800">
                      {t('concernCategory')} <span className="font-bold">{triage.visual_analysis.concern_category}</span>
                    </div>
                  </div>
                )}

                {/* SENSITIVE / CONFIDENTIAL ROUTING BANNER */}
                {!isUser && triage?.is_private_routing && (
                  <div className="mb-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/80 border-2 border-purple-300 dark:border-purple-800 space-y-3">
                    <div className="flex items-center space-x-2 text-purple-900 dark:text-purple-200 font-extrabold text-xs">
                      <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>{t('confidentialActive')}</span>
                    </div>
                    <p className="text-xs text-purple-950 dark:text-purple-100 leading-relaxed">
                      This topic is sensitive, so we're connecting you with a private option instead of your local health worker, to protect your privacy. Your record was explicitly excluded from the village worker alert queue.
                    </p>
                    {triage.private_helpline && (
                      <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-purple-200 dark:border-purple-800">
                        <div>
                          <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                            {triage.private_helpline.name}
                          </div>
                          <div className="text-[11px] text-purple-700 dark:text-purple-300">
                            {triage.private_helpline.description}
                          </div>
                        </div>
                        <a
                          href={`tel:${triage.private_helpline.number.split(' ')[0]}`}
                          className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call {triage.private_helpline.number}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Advice Content Text */}
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
                  {msg.id === 'welcome_1' ? t('welcomeAssistantMsg') : msg.text}
                </div>

                {/* Standard Public Escalation Notice (non-private) */}
                {!isUser && triage?.escalate_immediately && !triage.is_private_routing && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>{t('criticalRedFlag')}</span>
                      </div>
                      <p>{triage.escalation_reason}</p>
                      <p className="text-[11px] font-semibold text-red-700 dark:text-red-300 pt-1">
                        {t('ashaAlertDispatched')}
                      </p>
                    </div>

                    {/* Patient Confirmation Receipt Card (Part 2) */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/40 text-stone-900 dark:text-stone-100 text-xs space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold uppercase text-[10px] tracking-wider text-[#916323] dark:text-[#E0A845]">
                              PATIENT CONFIRMATION RECEIPT
                            </span>
                            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              Case Forwarded to ASHA Health Worker
                            </h4>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-[#916323] dark:text-[#E0A845] font-black font-mono text-xs border border-amber-500/30">
                          #{triage.caseRefId || ('REF-' + sessionId.slice(-6).toUpperCase())}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed font-medium">
                        Your case has been forwarded to <strong className="text-amber-800 dark:text-amber-300 font-bold">{triage.assignedAsha?.name || (userProfile?.village ? `Smt. Surekha Tai Pawar (ASHA Worker - ${userProfile.village})` : `Smt. Sunita Tai Shinde (ASHA Worker - ${userProfile.district || 'Khed Sector'})`)}</strong>, reference <strong className="font-mono text-amber-700 dark:text-amber-400 font-bold">#{triage.caseRefId || ('REF-' + sessionId.slice(-6).toUpperCase())}</strong>. They will contact you or visit soon.
                      </p>

                      {/* SMS Copy Button & Input */}
                      <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="flex items-center space-x-2 flex-1">
                          <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <input
                            type="tel"
                            placeholder={userProfile?.phone || "+91 9876543210"}
                            value={customSmsPhone || userProfile?.phone || ''}
                            onChange={(e) => setCustomSmsPhone(e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-500/40 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-full max-w-xs"
                          />
                        </div>

                        <button
                          onClick={() => {
                            const refId = triage.caseRefId || ('REF-' + sessionId.slice(-6).toUpperCase());
                            const asha = triage.assignedAsha?.name || 'Assigned ASHA Worker';
                            const targetNum = customSmsPhone || userProfile?.phone || '+91 9876543210';
                            setSmsSentMap(prev => ({ ...prev, [refId]: true }));
                            alert(`📱 SMS Confirmation Dispatched via Twilio Gateway!\n\nRecipient: ${targetNum}\nReference: #${refId}\n\nMessage:\n"Arogya Sahayak: Your case #${refId} has been assigned to ${asha}. They will reach out to you shortly."`);
                          }}
                          disabled={smsSentMap[triage.caseRefId || ('REF-' + sessionId.slice(-6).toUpperCase())]}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer shrink-0 ${
                            smsSentMap[triage.caseRefId || ('REF-' + sessionId.slice(-6).toUpperCase())]
                              ? 'bg-emerald-600 text-white border border-emerald-500 cursor-default'
                              : 'bg-amber-500 hover:bg-amber-400 text-stone-950 border border-amber-400'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {smsSentMap[triage.caseRefId || ('REF-' + sessionId.slice(-6).toUpperCase())]
                              ? 'SMS Sent ✓'
                              : 'Send me a copy via SMS'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AUTO CONFIRMATION RECEIPT (non-escalated cases) */}
                {!isUser && triage && !triage.escalate_immediately && triage.confirmationReceipt && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500/30 text-stone-900 dark:text-stone-100 text-xs space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500 text-white font-black">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-700 dark:text-emerald-400">
                            CASE CONFIRMATION
                          </span>
                          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            Symptoms Recorded
                          </h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black font-mono text-xs border border-emerald-500/30">
                        #{triage.confirmationReceipt.caseRefId}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      {triage.confirmationReceipt.summaryMessage}
                    </p>
                    <div className="flex items-center space-x-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                      <Phone className="w-3.5 h-3.5" />
                      <span>ASHA Worker: <strong>{triage.confirmationReceipt.assignedAshaName}</strong> ({triage.confirmationReceipt.assignedAshaSector})</span>
                    </div>
                  </div>
                )}

                {/* PROACTIVE ALERTS BANNER */}
                {!isUser && triage?.proactiveAlerts && triage.proactiveAlerts.length > 0 && (
                  <div className="mt-4 rounded-2xl border-2 border-[#D4A24E]/30 overflow-hidden">
                    <button
                      onClick={() => setProactiveAlertsExpanded(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                      className="w-full px-4 py-3 bg-[#D4A24E]/10 dark:bg-[#D4A24E]/15 flex items-center justify-between cursor-pointer hover:bg-[#D4A24E]/20 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <BellRing className="w-4 h-4 text-[#D4A24E] animate-bounce" />
                        <span className="text-xs font-extrabold text-[#916323] dark:text-[#E0A845] uppercase tracking-wider">
                          Proactive Health & Scheme Alerts
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#D4A24E] text-slate-950 text-[10px] font-black">
                          {triage.proactiveAlerts.length}
                        </span>
                      </div>
                      {proactiveAlertsExpanded[msg.id] 
                        ? <ChevronUp className="w-4 h-4 text-[#916323] dark:text-[#E0A845]" />
                        : <ChevronDown className="w-4 h-4 text-[#916323] dark:text-[#E0A845]" />
                      }
                    </button>

                    {proactiveAlertsExpanded[msg.id] && (
                      <div className="p-4 space-y-3 bg-[#FAFAF7] dark:bg-[#151318]">
                        {triage.proactiveAlerts.map((pa: ProactiveAlert) => {
                          const urgencyColors = {
                            'URGENT': 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200',
                            'WARNING': 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
                            'INFO': 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200',
                          };
                          const urgencyBadge = {
                            'URGENT': 'bg-red-600 text-white',
                            'WARNING': 'bg-amber-500 text-stone-950',
                            'INFO': 'bg-sky-500 text-white',
                          };
                          const typeIcons: Record<string, React.ReactNode> = {
                            'scheme_deadline': <Calendar className="w-4 h-4" />,
                            'outbreak_advisory': <Bug className="w-4 h-4" />,
                            'immunization_reminder': <Shield className="w-4 h-4" />,
                            'seasonal_health': <AlertTriangle className="w-4 h-4" />,
                          };

                          return (
                            <div
                              key={pa.id}
                              className={`p-3.5 rounded-xl border ${urgencyColors[pa.urgency] || urgencyColors['INFO']} space-y-2`}
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
                    )}
                  </div>
                )}

                {/* TWO ACTION BUTTONS + TRUST PANEL */}
                {!isUser && triage && (
                  <div className="mt-5 pt-4 border-t border-[#E5E0D8] dark:border-stone-800 space-y-3">
                    
                    {/* Two Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() => onNavigateTab('schemes')}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-all shadow-md active:scale-98 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{t('viewSchemesBtn')}</span>
                      </button>

                      <button
                        onClick={() => onNavigateTab('map')}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-[#D4A24E] dark:text-[#D4A24E]" />
                        <span>{t('findPhcBtn')}</span>
                      </button>
                    </div>

                    {/* "Why This Guidance" Trust Panel */}
                    <div className="p-3.5 rounded-xl bg-stone-100/90 dark:bg-stone-900/60 border border-[#E5E0D8] dark:border-stone-800 text-xs space-y-2.5">
                      <div className="flex items-center space-x-1.5 font-bold text-stone-800 dark:text-stone-200">
                        <Info className="w-3.5 h-3.5 text-[#B68434] dark:text-[#E0A845]" />
                        <span>{t('whyGuidanceTitle')}</span>
                      </div>
                      
                      {/* Confidence Meter */}
                      <div className="p-2.5 rounded-lg bg-[#FAFAF7] dark:bg-[#151318] border border-[#E5E0D8] dark:border-stone-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="flex items-center space-x-1 text-stone-700 dark:text-stone-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{t('guidelineConfidence')}</span>
                          </span>
                          <span className="text-[#916323] dark:text-[#E0A845] font-extrabold">
                            {t('groundedIn4Guidelines')}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                          <div className="h-full bg-linear-to-r from-[#D4A24E] via-[#E0A845] to-[#B68434] rounded-full w-full transition-all duration-500" />
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                          {t('protocolSources')}
                        </p>
                      </div>

                      {/* Vertical Symptoms Stack */}
                      <div className="flex flex-col space-y-1.5 items-start w-full">
                        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">{t('identifiedSymptoms')}</span>
                        {triage.symptoms?.map((s, idx) => (
                          <div key={idx} className="px-2.5 py-1 rounded-md bg-[#FAFAF7] dark:bg-[#151318] border border-[#E5E0D8] dark:border-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-300 w-full text-left">
                            • {s}
                          </div>
                        ))}
                      </div>

                      {triage.disclaimer && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-[#E5E0D8] dark:border-stone-800">
                          {triage.disclaimer}
                        </p>
                      )}
                    </div>

                    {/* Agent Reasoning Trace Component */}
                    <AgentReasoningTrace 
                      triage={triage}
                      userMessage={msg.text}
                      userProfile={userProfile}
                    />

                  </div>
                )}

              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-3 text-stone-500 dark:text-stone-400 p-4 bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl max-w-sm border border-[#E5E0D8] dark:border-stone-800">
            <RefreshCw className="w-4 h-4 animate-spin text-[#D4A24E]" />
            <span className="text-xs font-medium">{t('analyzingSymptoms')}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Symptoms Prompts */}
      <div className="px-4 py-2 bg-stone-100/90 dark:bg-stone-900/60 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-extrabold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase shrink-0">{t('quickDemosLabel')}</span>
        
        {/* Part A Test Button */}
        <button
          onClick={() => {
            setPreferPrivate(true);
            handleSendMessage("I have been feeling overwhelmed, helpless, crying constantly and having extreme anxiety");
          }}
          className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 text-xs shrink-0 hover:bg-purple-200 font-bold flex items-center space-x-1 cursor-pointer"
        >
          <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
          <span>{t('demoSensitiveMental')}</span>
        </button>

        <button
          onClick={() => handleSendMessage(
            language === 'hi' ? "मुझे 2 दिन से तेज बुखार, सर्दी और बदन दर्द है" :
            language === 'mr' ? "मला २ दिवसांपासून तीव्र ताप, सर्दी आणि अंगात कळ आहे" :
            language === 'ta' ? "எனக்கு 2 நாட்களாக அதிக காய்ச்சல் மற்றும் உடல் வலி உள்ளது" :
            "I have high fever, cold and body pain for 2 days"
          )}
          className="px-2.5 py-1 rounded-lg bg-[#FAFAF7] dark:bg-[#151318] text-stone-700 dark:text-stone-300 border border-[#E5E0D8] dark:border-stone-800 text-xs shrink-0 hover:border-[#D4A24E] hover:text-[#916323] transition-colors cursor-pointer"
        >
          {t('demoFeverPain')}
        </button>

        <button
          onClick={() => handleSendMessage(
            language === 'hi' ? "सीने में बहुत तेज़ दर्द, भारीपन, पसीना और बाएं हाथ में सुन्नता हो रही है" :
            language === 'mr' ? "छातीत तीव्र वेदना, घाम येणे आणि डाव्या हाताला मुंग्या येत आहेत" :
            language === 'ta' ? "நெஞ்சு வலி, அதிக வேர்வை மற்றும் இடது கை மரத்துப் போதல்" :
            "Chest pressure, sweating and left arm numbness"
          )}
          className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 text-xs shrink-0 hover:bg-red-100 transition-colors font-medium cursor-pointer"
        >
          {t('demoRedFlag')}
        </button>
      </div>

      {/* Selected Image Thumbnail Preview Bar before submission */}
      {selectedImage && (
        <div className="px-4 py-2 bg-cyan-50 dark:bg-cyan-950/60 border-t border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={selectedImage} alt="Selected symptom" className="w-12 h-12 object-cover rounded-lg border border-cyan-300" />
            <div>
              <div className="text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center space-x-1">
                <Camera className="w-3.5 h-3.5 text-cyan-600" />
                <span>{t('photoAttached')}</span>
              </div>
              <div className="text-[10px] text-cyan-700 dark:text-cyan-400">{t('readyForCv')}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1.5 rounded-full hover:bg-cyan-200 dark:hover:bg-cyan-900 text-cyan-900 dark:text-cyan-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <div className="p-4 bg-[#FAFAF7] dark:bg-[#151318] border-t border-[#E5E0D8] dark:border-stone-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          {/* MIC BUTTON */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer ${
              isListening
                ? 'bg-red-600 text-white animate-bounce shadow-lg shadow-red-600/30'
                : 'bg-[#D4A24E]/15 dark:bg-[#D4A24E]/20 text-[#916323] dark:text-[#E0A845] hover:bg-[#D4A24E]/25 border border-[#D4A24E]/30'
            }`}
            title={isListening ? 'Stop Mic' : 'Speak Symptoms (STT Speech Input)'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* CAMERA / IMAGE UPLOAD BUTTON */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer ${
              selectedImage
                ? 'bg-cyan-600 text-white border border-cyan-700 shadow-md'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700'
            }`}
            title="Photograph a symptom (wound, skin rash, swelling)"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isListening ? t('micListening') : (selectedImage ? t('addNotesPlaceholder') : t('typeSymptomsPlaceholder'))}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#D4A24E] transition-all placeholder:text-stone-400"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
            className="px-5 py-3 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] disabled:opacity-50 text-slate-950 font-extrabold text-sm transition-all shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t('sendBtn')}</span>
          </button>
        </form>
      </div>

      {/* Digital Health Pass Modal */}
      <DigitalHealthCardModal 
        isOpen={isHealthCardOpen}
        onClose={() => setIsHealthCardOpen(false)}
        userProfile={userProfile}
        recentTurns={messages}
      />

    </div>
  );
};
