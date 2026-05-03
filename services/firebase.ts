import app from '@react-native-firebase/app';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import { getFunctions } from '@react-native-firebase/functions';

// ⚠️ We are using the Native SDK now!
// No firebaseConfig object is needed because it uses google-services.json automatically.

// Initialize Auth
export const auth = authModule();

// Initialize Firestore
export const db = firestoreModule();

// Initialize Functions (europe-west1 region)
// Use getFunctions with undefined app (will use default) and region
export const functions = getFunctions(undefined, 'europe-west1');

export default app;
