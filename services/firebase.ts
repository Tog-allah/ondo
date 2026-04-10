// Firebase Configuration - Ondo App (ondo-app-td)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyBLWruoq7T9GmlRr0VGiUgK7h1xPaho7DI',
  authDomain: 'ondo-app-td.firebaseapp.com',
  projectId: 'ondo-app-td',
  storageBucket: 'ondo-app-td.firebasestorage.app',
  messagingSenderId: '15795729641',
  appId: '1:15795729641:android:f324bc95054da7eedb6c78',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Functions
export const functions = getFunctions(app, 'europe-west1');

// Uncomment to use local emulator
// connectFunctionsEmulator(functions, "localhost", 5001);

export default app;
