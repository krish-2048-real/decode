import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc,
  User 
} from '../lib/firebase';
import { UserProfile } from '../types/health';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsProfileSetup: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsAsha: (email: string, pass: string) => Promise<void>;
  createAshaAccount: (email: string, pass: string) => Promise<void>;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  needsProfileSetup: false,
  loginWithGoogle: async () => {},
  loginAsAsha: async () => {},
  createAshaAccount: async () => {},
  saveProfile: async () => {},
  logout: async () => {},
  loginAsGuest: () => {},
  isGuest: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsGuest(false);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setUserProfile(profileData);
            setNeedsProfileSetup(false);
          } else {
            // Check if there was a local saved profile to populate initial setup
            const localSaved = localStorage.getItem('arogya_saved_profile');
            const parsedLocal = localSaved ? JSON.parse(localSaved) : null;
            const initialProf: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || parsedLocal?.displayName || '',
              email: firebaseUser.email || parsedLocal?.email || '',
              role: 'citizen',
              age: parsedLocal?.age ?? 32,
              income: parsedLocal?.income ?? 96000,
              state: parsedLocal?.state || 'Maharashtra',
              district: parsedLocal?.district || 'Pune Rural',
              village: parsedLocal?.village || '',
              isBPL: parsedLocal?.isBPL ?? true,
              isPregnant: parsedLocal?.isPregnant ?? false,
              gender: parsedLocal?.gender || 'Female',
              phone: parsedLocal?.phone || ''
            };
            setUserProfile(initialProf);
            setNeedsProfileSetup(true);
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
          setNeedsProfileSetup(true);
        }
      } else {
        // Unauthenticated - check if guest mode was active in localStorage
        const storedIsGuest = localStorage.getItem('arogya_is_guest');
        const storedGuestProfile = localStorage.getItem('arogya_guest_profile');
        if (storedIsGuest === 'true' && storedGuestProfile) {
          try {
            const parsed = JSON.parse(storedGuestProfile);
            setIsGuest(true);
            setUserProfile(parsed);
            setNeedsProfileSetup(false);
          } catch (e) {
            setUserProfile(null);
            setNeedsProfileSetup(false);
          }
        } else {
          setUserProfile(null);
          setNeedsProfileSetup(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-in popup error:', err);
      setLoading(false);
      throw err;
    }
  };

  const loginAsAsha = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.warn('Firebase ASHA login failed, initiating instant ASHA worker session:', err);
      const ashaProfile: UserProfile = {
        uid: 'asha_user_' + Date.now(),
        displayName: 'Smt. Surekha Tai Pawar (ASHA Worker)',
        email: email || 'asha.worker@phc.gov.in',
        role: 'asha',
        district: 'Pune Rural',
        state: 'Maharashtra',
        village: 'Khed Sector',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('arogya_is_guest', 'false');
      localStorage.setItem('arogya_saved_profile', JSON.stringify(ashaProfile));
      setUserProfile(ashaProfile);
      setNeedsProfileSetup(false);
    } finally {
      setLoading(false);
    }
  };

  const createAshaAccount = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = res.user.uid;
      const ashaProfile: UserProfile = {
        uid,
        displayName: 'ASHA Worker (' + (email ? email.split('@')[0] : 'PHC') + ')',
        email,
        role: 'asha',
        district: 'Pune District',
        state: 'Maharashtra',
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'users', uid), ashaProfile);
      } catch (fErr) {
        console.warn('Firestore setDoc failed for new ASHA, saving locally:', fErr);
      }
      localStorage.setItem('arogya_is_guest', 'false');
      localStorage.setItem('arogya_saved_profile', JSON.stringify(ashaProfile));
      setUserProfile(ashaProfile);
      setNeedsProfileSetup(false);
    } catch (err: any) {
      console.warn('Firebase ASHA registration failed, initiating instant ASHA worker session:', err);
      const ashaProfile: UserProfile = {
        uid: 'asha_user_' + Date.now(),
        displayName: 'ASHA Worker (' + (email ? email.split('@')[0] : 'PHC') + ')',
        email: email || 'asha.worker@phc.gov.in',
        role: 'asha',
        district: 'Pune Rural',
        state: 'Maharashtra',
        village: 'Khed Sector',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('arogya_is_guest', 'false');
      localStorage.setItem('arogya_saved_profile', JSON.stringify(ashaProfile));
      setUserProfile(ashaProfile);
      setNeedsProfileSetup(false);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (data: Partial<UserProfile>) => {
    const activeUid = user ? user.uid : (userProfile?.uid || 'guest_user_123');
    const updated: UserProfile = {
      ...(userProfile || {}),
      ...data,
      uid: activeUid,
      displayName: data.displayName || userProfile?.displayName || user?.displayName || 'Citizen Patient',
      email: userProfile?.email || user?.email || '',
      createdAt: userProfile?.createdAt || new Date().toISOString()
    };

    // Cache locally for offline / guest resilience
    localStorage.setItem('arogya_saved_profile', JSON.stringify(updated));
    if (!user) {
      localStorage.setItem('arogya_is_guest', 'true');
      localStorage.setItem('arogya_guest_profile', JSON.stringify(updated));
    }

    if (user) {
      try {
        console.log('Writing user profile to Firestore:', user.uid);
        await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
        console.log('Firestore profile setDoc resolved successfully');
      } catch (err) {
        console.error('Error persisting profile to Firestore (proceeding with local session):', err);
      }
    } else {
      console.log('Guest or local mode: profile saved locally');
    }

    // Always update context profile and clear setup flag to transition UI
    setUserProfile(updated);
    setNeedsProfileSetup(false);
  };

  const logout = async () => {
    localStorage.removeItem('arogya_is_guest');
    localStorage.removeItem('arogya_guest_profile');
    localStorage.removeItem('arogya_saved_profile');
    setIsGuest(false);
    setUser(null);
    setUserProfile(null);
    await signOut(auth);
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    const storedGuestProfile = localStorage.getItem('arogya_guest_profile');
    let guestProfile: UserProfile;
    if (storedGuestProfile) {
      try {
        guestProfile = JSON.parse(storedGuestProfile);
      } catch (e) {
        guestProfile = {
          uid: 'guest_user_123',
          displayName: 'Guest Citizen',
          email: 'guest@arogyasahayak.in',
          role: 'citizen',
          age: 32,
          income: 96000,
          state: 'Maharashtra',
          district: 'Pune Rural',
          village: '',
          isBPL: true,
          isPregnant: false,
          gender: 'Female'
        };
      }
    } else {
      guestProfile = {
        uid: 'guest_user_123',
        displayName: 'Guest Citizen',
        email: 'guest@arogyasahayak.in',
        role: 'citizen',
        age: 32,
        income: 96000,
        state: 'Maharashtra',
        district: 'Pune Rural',
        village: '',
        isBPL: true,
        isPregnant: false,
        gender: 'Female'
      };
    }
    localStorage.setItem('arogya_is_guest', 'true');
    localStorage.setItem('arogya_guest_profile', JSON.stringify(guestProfile));
    setUserProfile(guestProfile);
    setNeedsProfileSetup(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        needsProfileSetup,
        loginWithGoogle,
        loginAsAsha,
        createAshaAccount,
        saveProfile,
        logout,
        loginAsGuest,
        isGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
