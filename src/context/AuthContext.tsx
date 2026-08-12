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
            setNeedsProfileSetup(profileData.role !== 'asha' && !profileData.displayName);
          } else {
            // Check if local saved profile was set for ASHA role
            const localSaved = localStorage.getItem('arogya_saved_profile');
            const parsedLocal = localSaved ? JSON.parse(localSaved) : null;
            const isAshaRole = parsedLocal?.role === 'asha';

            const initialProf: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || parsedLocal?.displayName || (isAshaRole ? 'ASHA Worker (' + (firebaseUser.email?.split('@')[0] || 'PHC') + ')' : ''),
              email: firebaseUser.email || parsedLocal?.email || '',
              role: isAshaRole ? 'asha' : 'citizen',
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

            if (isAshaRole) {
              setNeedsProfileSetup(false);
              try { setDoc(doc(db, 'users', firebaseUser.uid), initialProf, { merge: true }); } catch (e) {}
            } else {
              setNeedsProfileSetup(true);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
          const localSaved = localStorage.getItem('arogya_saved_profile');
          const parsedLocal = localSaved ? JSON.parse(localSaved) : null;
          if (parsedLocal?.role === 'asha') {
            setUserProfile(parsedLocal);
            setNeedsProfileSetup(false);
          } else {
            setNeedsProfileSetup(true);
          }
        }
      } else {
        // Unauthenticated - check if guest or local session was saved
        const storedSaved = localStorage.getItem('arogya_saved_profile');
        const storedIsGuest = localStorage.getItem('arogya_is_guest');
        if (storedSaved) {
          try {
            const parsed = JSON.parse(storedSaved);
            setUserProfile(parsed);
            setIsGuest(storedIsGuest === 'true');
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
    const ashaProf: UserProfile = {
      uid: 'asha_user_' + Date.now(),
      displayName: 'ASHA Worker (' + (email ? email.split('@')[0] : 'PHC') + ')',
      email: email || 'asha.worker@phc.gov.in',
      role: 'asha',
      district: 'Pune Rural',
      state: 'Maharashtra',
      village: 'Khed Sector',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('arogya_saved_profile', JSON.stringify(ashaProf));
    localStorage.setItem('arogya_is_guest', 'true');
    setIsGuest(true);
    setUserProfile(ashaProf);
    setNeedsProfileSetup(false);

    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      ashaProf.uid = res.user.uid;
      try { await setDoc(doc(db, 'users', res.user.uid), ashaProf, { merge: true }); } catch (fErr) {}
    } catch (err: any) {
      console.warn('Firebase ASHA sign in fallback (auto-registering or creating local session):', err);
      try {
        const createRes = await createUserWithEmailAndPassword(auth, email, pass);
        ashaProf.uid = createRes.user.uid;
        try { await setDoc(doc(db, 'users', createRes.user.uid), ashaProf, { merge: true }); } catch (fErr) {}
      } catch (cErr) {
        console.warn('Firebase ASHA auto-create fallback:', cErr);
      }
    } finally {
      setUserProfile(ashaProf);
      setNeedsProfileSetup(false);
      setLoading(false);
    }
  };

  const createAshaAccount = async (email: string, pass: string) => {
    setLoading(true);
    const ashaProf: UserProfile = {
      uid: 'asha_user_' + Date.now(),
      displayName: 'ASHA Worker (' + (email ? email.split('@')[0] : 'PHC') + ')',
      email: email || 'asha.worker@phc.gov.in',
      role: 'asha',
      district: 'Pune Rural',
      state: 'Maharashtra',
      village: 'Khed Sector',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('arogya_saved_profile', JSON.stringify(ashaProf));
    localStorage.setItem('arogya_is_guest', 'true');
    setIsGuest(true);
    setUserProfile(ashaProf);
    setNeedsProfileSetup(false);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      ashaProf.uid = res.user.uid;
      try { await setDoc(doc(db, 'users', res.user.uid), ashaProf, { merge: true }); } catch (fErr) {}
    } catch (err: any) {
      console.warn('Firebase ASHA registration fallback (auto signing-in or local session):', err);
      try {
        const signRes = await signInWithEmailAndPassword(auth, email, pass);
        ashaProf.uid = signRes.user.uid;
        try { await setDoc(doc(db, 'users', signRes.user.uid), ashaProf, { merge: true }); } catch (fErr) {}
      } catch (sErr) {
        console.warn('Firebase ASHA sign-in fallback:', sErr);
      }
    } finally {
      setUserProfile(ashaProf);
      setNeedsProfileSetup(false);
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
