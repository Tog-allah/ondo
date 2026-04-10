import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Types ───────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  phone: string;
  operator: 'airtel' | 'moov';
  walletBalance: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateUserData {
  displayName: string;
  phone: string;
  operator: 'airtel' | 'moov';
}

// ── User Profile Operations ─────────────────────────────────

/**
 * Create a new user profile in Firestore.
 * Called after successful authentication.
 */
export const createUserProfile = async (
  userId: string,
  data: CreateUserData
): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  // Check if profile already exists
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    // Update existing profile
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // Create new profile with initial wallet balance for demo
  await setDoc(userRef, {
    ...data,
    walletBalance: 3500, // Solde initial de démo (XAF)
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Get a user's profile from Firestore.
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
};

/**
 * Update a user's profile.
 */
export const updateUserProfile = async (
  userId: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'phone' | 'operator'>>
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ── Wallet Operations ───────────────────────────────────────

/**
 * Get the user's wallet balance.
 */
export const getWalletBalance = async (userId: string): Promise<number> => {
  const profile = await getUserProfile(userId);
  return profile?.walletBalance ?? 0;
};

/**
 * Update the user's wallet balance.
 * Can be used to add (positive) or deduct (negative) from the balance.
 */
export const updateWalletBalance = async (
  userId: string,
  newBalance: number
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    walletBalance: newBalance,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Deduct from wallet balance and return the new balance.
 * Returns the amount actually deducted (may be less if insufficient balance).
 */
export const deductFromWallet = async (
  userId: string,
  amount: number
): Promise<{ deducted: number; newBalance: number }> => {
  const currentBalance = await getWalletBalance(userId);
  const deducted = Math.min(currentBalance, amount);
  const newBalance = currentBalance - deducted;

  await updateWalletBalance(userId, newBalance);

  return { deducted, newBalance };
};
