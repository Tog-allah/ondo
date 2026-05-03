import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// We import User from authService which now uses Native SDK types
import {
  confirmPhoneOtp,
  signOut,
  onAuthStateChanged,
  savePhoneLocally,
  getStoredPhone,
  User,
} from '../services/authService';
import {
  createUserProfile,
  getUserProfile,
  UserProfile,
  CreateUserData,
} from '../services/userService';
import { detectOperator } from '../constants';

// ── Types ───────────────────────────────────────────────────

interface AuthContextType {
  // State
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  loginWithOtp: (verificationId: string, code: string, phone: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.warn('Failed to load user profile:', err);
        }
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Complete login flow:
   * 1. Confirm OTP with Firebase
   * 2. Create/update user profile in Firestore
   * 3. Store phone locally
   */
  const loginWithOtp = useCallback(async (verificationId: string, code: string, phone: string, displayName?: string) => {
    try {
      setIsLoading(true);

      // Strip the + prefix for storage, keep digits
      const cleanPhone = phone.replace(/\s/g, '');
      const operator = detectOperator(cleanPhone) || 'airtel';

      // Confirm OTP — this is the critical step
      const firebaseUser = await confirmPhoneOtp(verificationId, code);

      // Set user immediately so the app can navigate
      setUser(firebaseUser);

      // Create user profile in Firestore (non-blocking)
      // If Firestore is temporarily offline, auth still works
      const profileData: CreateUserData = {
        displayName: displayName || `Utilisateur ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        operator,
      };

      try {
        await createUserProfile(firebaseUser.uid, profileData);
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } catch (firestoreErr) {
        console.warn('Firestore profile sync failed (will retry later):', firestoreErr);
        // Set a minimal local profile so the UI can render
        setUserProfile({
          displayName: profileData.displayName,
          phone: cleanPhone,
          operator,
          walletBalance: 0,
        } as UserProfile);
      }

      // Save phone locally (non-blocking)
      try {
        await savePhoneLocally(cleanPhone);
      } catch (storageErr) {
        console.warn('Local phone save failed:', storageErr);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout and clear all local data.
   */
  const logout = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, []);

  /**
   * Refresh user profile from Firestore.
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  }, [user]);

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    loginWithOtp,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
