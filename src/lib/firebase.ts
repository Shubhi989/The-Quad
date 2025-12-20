import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - Replace with your Firebase project config
const firebaseConfig = {
apiKey: "AIzaSyCJV4VOldlFNTY-nNBMl3zQAgDRH_x5F7s",
  authDomain: "the-quad-6a9ea.firebaseapp.com",
  projectId: "the-quad-6a9ea",
  storageBucket: "the-quad-6a9ea.firebasestorage.app",
  messagingSenderId: "110965676168",
  appId: "1:110965676168:web:32c9d75b89e9a0d2a5e73d"}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Allowed email domains for college authentication
export const ALLOWED_DOMAINS = ['srmist.edu.in'];

export const isCollegeEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return ALLOWED_DOMAINS.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
};

export default app;
