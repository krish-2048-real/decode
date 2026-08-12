import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  HeartPulse, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  Building2
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { t } = useLanguage();
  const { loginWithGoogle, loginAsAsha, createAshaAccount, loginAsGuest } = useAuth();
  const [activeRole, setActiveRole] = useState<'citizen' | 'asha'>('citizen');
  const [ashaEmail, setAshaEmail] = useState('');
  const [ashaPassword, setAshaPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google Sign-in popup was blocked or closed. You can also click "Continue as Demo Guest" below.');
      } else {
        setErrorMessage(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAshaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ashaEmail || !ashaPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        await createAshaAccount(ashaEmail, ashaPassword);
        setSuccessMessage(`✓ ASHA Account registered successfully! Please click "Sign In as ASHA Worker" below.`);
        setIsRegisterMode(false);
      } else {
        await loginAsAsha(ashaEmail, ashaPassword);
      }
    } catch (err: any) {
      console.warn('ASHA login error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/80 shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AROGYA SAHAYAK
          </h1>
          <p className="text-xs text-slate-400">
            {t('appSubtitle')}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/60 text-xs font-bold">
          <button
            onClick={() => {
              setActiveRole('citizen');
              setErrorMessage('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeRole === 'citizen'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('citizenPatientTab')}</span>
          </button>

          <button
            onClick={() => {
              setActiveRole('asha');
              setErrorMessage('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeRole === 'asha'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('ashaWorkerTab')}</span>
          </button>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Success Feedback Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-start space-x-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug font-semibold">{successMessage}</p>
          </div>
        )}

        {/* CITIZEN OAUTH TAB */}
        {activeRole === 'citizen' && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              {t('citizenLoginDesc')}
            </p>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all shadow-lg flex items-center justify-center space-x-3 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? t('connectingGoogle') : t('signInWithGoogle')}</span>
            </button>

            {/* Quick Demo Guest Button */}
            <div className="pt-2 text-center">
              <button
                onClick={loginAsGuest}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline underline-offset-4 cursor-pointer"
              >
                {t('continueAsGuest')}
              </button>
            </div>
          </div>
        )}

        {/* ASHA WORKER LOGIN TAB */}
        {activeRole === 'asha' && (
          <form onSubmit={handleAshaSubmit} className="space-y-4 pt-2">
            <p className="text-xs text-slate-300">
              {isRegisterMode 
                ? t('createAshaAccountDesc')
                : t('ashaLoginDesc')}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('ashaEmailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={ashaEmail}
                  onChange={(e) => setAshaEmail(e.target.value)}
                  placeholder="asha.worker@phc.gov.in"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={ashaPassword}
                  onChange={(e) => setAshaPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isRegisterMode ? t('registerAshaAccountBtn') : t('signInAsAshaBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                {isRegisterMode ? t('alreadyHaveAccount') : t('newAshaWorker')}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
