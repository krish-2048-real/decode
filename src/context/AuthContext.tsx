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
        // Unauthenticated - only restore session if guest mode was explicitly active
        const storedSaved = localStorage.getItem('arogya_saved_profile');
        const storedIsGuest = localStorage.getItem('arogya_is_guest');
        if (storedIsGuest === 'true' && storedSaved) {
          try {
            const parsed = JSON.parse(storedSaved);
            if (parsed?.role === 'asha' || parsed?.role === 'citizen') {
              setUserProfile(parsed);
              setIsGuest(true);
              setNeedsProfileSetup(false);
            } else {
              setUserProfile(null);
              setNeedsProfileSetup(false);
            }
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

  const getRegisteredAshaUsers = (): Record<string, { pass: string; profile: UserProfile }> => {
    try {
      const stored = localStorage.getItem('arogya_registered_asha_users');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const loginAsAsha = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = (email || '').toLowerCase().trim();
    const regUsers = getRegisteredAshaUsers();
    const existingLocalUser = regUsers[cleanEmail];

    // 1. If account exists in local registry, verify password FIRST
    if (existingLocalUser && existingLocalUser.pass !== pass) {
      setLoading(false);
      throw new Error('Invalid password. Please enter the correct password for this ASHA account.');
    }

    // 2. Try Firebase sign-in
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      // Firebase sign-in succeeded - build profile and save
      const ashaProf: UserProfile = existingLocalUser?.profile || {
        uid: res.user.uid,
        displayName: 'ASHA Worker (' + cleanEmail.split('@')[0] + ')',
        email: cleanEmail,
        role: 'asha',
        district: 'Pune Rural',
        state: 'Maharashtra',
        village: 'Khed Sector',
        createdAt: new Date().toISOString()
      };
      ashaProf.uid = res.user.uid;
      ashaProf.role = 'asha';

      // Save ONLY after successful authentication
      regUsers[cleanEmail] = { pass, profile: ashaProf };
      localStorage.setItem('arogya_registered_asha_users', JSON.stringify(regUsers));
      localStorage.setItem('arogya_saved_profile', JSON.stringify(ashaProf));
      localStorage.setItem('arogya_is_guest', 'false');
      try { await setDoc(doc(db, 'users', res.user.uid), ashaProf, { merge: true }); } catch (fErr) {}
      setUserProfile(ashaProf);
      setNeedsProfileSetup(false);
      setLoading(false);
      return;
    } catch (err: any) {
      // Firebase sign-in failed
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        // If user exists in local registry with matching password, this means
        // Firebase has a different password - reject
        if (!existingLocalUser) {
          setLoading(false);
          throw new Error('Incorrect password. Please check your password or register a new account.');
        }
        // existingLocalUser password matched (checked above), so allow local-only login
      } else if (err.code === 'auth/user-not-found') {
        if (!existingLocalUser) {
          setLoading(false);
          throw new Error('No ASHA account found. Please register first by clicking "New ASHA Worker? Register Account".');
        }
      } else if (err.code === 'auth/invalid-email') {
        setLoading(false);
        throw new Error('Invalid email format. Please enter a valid email address.');
      } else {
        // Other Firebase errors - allow local-only login if registered locally
        if (!existingLocalUser) {
          setLoading(false);
          throw new Error('Authentication failed. Please register first or check your credentials.');
        }
      }
    }

    // 3. Local-only login (existingLocalUser with matching password, Firebase unavailable)
    const ashaProf: UserProfile = existingLocalUser!.profile;
    ashaProf.role = 'asha';
    localStorage.setItem('arogya_saved_profile', JSON.stringify(ashaProf));
    localStorage.setItem('arogya_is_guest', 'true');
    setIsGuest(true);
    setUserProfile(ashaProf);
    setNeedsProfileSetup(false);
    setLoading(false);
  };

  const createAshaAccount = async (email: string, pass: string) => {
    setLoading(true);
    if (!pass || pass.length < 6) {
      setLoading(false);
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoading(false);
      throw new Error('Please enter a valid email address.');
    }

    const regUsers = getRegisteredAshaUsers();
    if (regUsers[cleanEmail]) {
      setLoading(false);
      throw new Error('This email is already registered. Please switch to "Sign In" mode.');
    }

    const ashaProf: UserProfile = {
      uid: 'asha_local_' + Date.now(),
      displayName: 'ASHA Worker (' + cleanEmail.split('@')[0] + ')',
      email: cleanEmail,
      role: 'asha',
      district: 'Pune Rural',
      state: 'Maharashtra',
      village: 'Khed Sector',
      createdAt: new Date().toISOString()
    };

    // Try Firebase registration (but do NOT auto-login even if it succeeds)
    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      ashaProf.uid = res.user.uid;
      try { await setDoc(doc(db, 'users', res.user.uid), ashaProf, { merge: true }); } catch (fErr) {}
      // Sign out immediately so onAuthStateChanged doesn't auto-login
      await signOut(auth);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setLoading(false);
        throw new Error('This email is already registered on Firebase. Please use "Sign In" mode.');
      }
      // Other Firebase errors are fine - we still register locally
    }

    // Save to local registry only (no auto-login!)
    regUsers[cleanEmail] = { pass, profile: ashaProf };
    localStorage.setItem('arogya_registered_asha_users', JSON.stringify(regUsers));
    // Do NOT set arogya_saved_profile or isGuest here - user must sign in explicitly
    setLoading(false);
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
