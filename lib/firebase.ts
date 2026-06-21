import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCCNBzOcWafEqyI22DunPfS_yJ90tEFBwE",
  authDomain: "fanra-tech.firebaseapp.com",
  projectId: "fanra-tech",
  storageBucket: "fanra-tech.firebasestorage.app",
  messagingSenderId: "1009081208137",
  appId: "1:1009081208137:web:4aceea5440f28e96d11e98",
  measurementId: "G-5THCFL06L8"
};

// Initialize Firebase safely for Next.js SSR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
