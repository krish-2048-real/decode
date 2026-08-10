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
            setNeedsProfileSetup(true);
            setUserProfile({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: 'citizen',
              age: 30,
              income: 96000,
              state: 'Maharashtra',
              district: 'Pune District',
              isBPL: true,
              isPregnant: false,
              gender: 'Female'
            });
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
          setNeedsProfileSetup(true);
        }
      } else {
        if (!isGuest) {
          setUserProfile(null);
          setNeedsProfileSetup(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isGuest]);

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
      console.error('ASHA Login error:', err);
      setLoading(false);
      throw err;
    }
  };

  const createAshaAccount = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = res.user.uid;
      const ashaProfile: UserProfile = {
        uid,
        displayName: 'ASHA Worker (' + email.split('@')[0] + ')',
        email,
        role: 'asha',
        district: 'Pune District',
        state: 'Maharashtra',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', uid), ashaProfile);
      setUserProfile(ashaProfile);
      setNeedsProfileSetup(false);
    } catch (err: any) {
      console.error('ASHA Registration error:', err);
      setLoading(false);
      throw err;
    }
  };

  const saveProfile = async (data: Partial<UserProfile>) => {
    if (user) {
      const updated: UserProfile = {
        ...(userProfile || {}),
        ...data,
        uid: user.uid,
        displayName: data.displayName || userProfile?.displayName || user.displayName || 'Citizen Patient',
        email: userProfile?.email || user.email || '',
        createdAt: userProfile?.createdAt || new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      setUserProfile(updated);
      setNeedsProfileSetup(false);
    } else if (isGuest) {
      const updated: UserProfile = {
        ...(userProfile || {}),
        ...data,
        uid: 'guest_user_123'
      };
      setUserProfile(updated);
      setNeedsProfileSetup(false);
    }
  };

  const logout = async () => {
    setIsGuest(false);
    setUser(null);
    setUserProfile(null);
    await signOut(auth);
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    const guestProfile: UserProfile = {
      uid: 'guest_user_123',
      displayName: 'Guest Citizen',
      email: 'guest@arogyasahayak.in',
      role: 'citizen',
      age: 32,
      income: 96000,
      state: 'Maharashtra',
      district: 'Pune District',
      isBPL: true,
      isPregnant: false,
      gender: 'Female'
    };
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
