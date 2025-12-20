import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isCollegeEmail } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'mentor' | 'club';
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  photoURL?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          // Convert Firestore Timestamp to Date if needed
          const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date();
          setProfile({ ...data, createdAt } as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!isCollegeEmail(email)) {
        return { error: 'Please use a valid college email address' };
      }
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      if (!isCollegeEmail(email)) {
        return { error: 'Please use a valid college email address' };
      }
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        name,
        role: 'student',
        skills: [],
        createdAt: new Date()
      };
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      setProfile(userProfile);
      
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      
      if (!email || !isCollegeEmail(email)) {
        await signOut(auth);
        return { error: 'Please use a valid college email address' };
      }

      // Check if profile exists, if not create one
      const profileDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!profileDoc.exists()) {
        const userProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email!,
          name: result.user.displayName || 'User',
          role: 'student',
          skills: [],
          photoURL: result.user.photoURL || undefined,
          createdAt: new Date()
        };
        await setDoc(doc(db, 'users', result.user.uid), userProfile);
        setProfile(userProfile);
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { ...profile, ...data }, { merge: true });
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithEmail, 
      signUpWithEmail,
      signInWithGoogle, 
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
