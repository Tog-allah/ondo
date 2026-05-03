import authModule, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { auth } from './firebase';

export type User = FirebaseAuthTypes.User;

const PHONE_KEY = 'ondo_user_phone';

// ── Authentication ──────────────────────────────────────────

/**
 * Sign in using Phone Authentication (Firebase).
 * @param verificationId The verification ID from standard signInWithPhoneNumber
 * @param code The 6-digit SMS code
 */
export const confirmPhoneOtp = async (verificationId: string, code: string): Promise<User> => {
  const credential = authModule.PhoneAuthProvider.credential(verificationId, code);
  const result = await auth.signInWithCredential(credential);
  return result.user;
};

/**
 * Sign out the current user and clear secure storage.
 */
export const signOut = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PHONE_KEY);
  await auth.signOut();
};

/**
 * Get the current authenticated user.
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Listen for authentication state changes.
 */
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return auth.onAuthStateChanged(callback);
};

// ── Phone Storage ───────────────────────────────────────────

/**
 * Save the user's phone number locally for quick access.
 */
export const savePhoneLocally = async (phone: string): Promise<void> => {
  await SecureStore.setItemAsync(PHONE_KEY, phone);
};

/**
 * Get the locally stored phone number.
 */
export const getStoredPhone = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(PHONE_KEY);
};

