import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Types ───────────────────────────────────────────────────

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  phone: string;
  operator: 'airtel' | 'moov';
  lastUsed: Timestamp;
  usageCount: number;
}

export interface CreateBeneficiaryData {
  userId: string;
  name: string;
  phone: string;
  operator: 'airtel' | 'moov';
}

// ── Beneficiary Operations ──────────────────────────────────

const BENEFICIARIES_COLLECTION = 'beneficiaries';

/**
 * Add a new beneficiary or update if phone already exists.
 */
export const addBeneficiary = async (
  data: CreateBeneficiaryData
): Promise<string> => {
  // Check if beneficiary already exists for this user + phone
  const existing = await findBeneficiaryByPhone(data.userId, data.phone);

  if (existing) {
    // Update usage count and last used time
    await updateBeneficiaryUsage(existing.id);
    return existing.id;
  }

  const docRef = await addDoc(collection(db, BENEFICIARIES_COLLECTION), {
    userId: data.userId,
    name: data.name,
    phone: data.phone,
    operator: data.operator,
    lastUsed: serverTimestamp(),
    usageCount: 1,
  });

  return docRef.id;
};

/**
 * Find a beneficiary by phone number for a given user.
 */
export const findBeneficiaryByPhone = async (
  userId: string,
  phone: string
): Promise<Beneficiary | null> => {
  const q = query(
    collection(db, BENEFICIARIES_COLLECTION),
    where('userId', '==', userId),
    where('phone', '==', phone)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Beneficiary;
};

/**
 * Get all beneficiaries for a user, ordered by usage.
 */
export const getBeneficiaries = async (
  userId: string
): Promise<Beneficiary[]> => {
  const q = query(
    collection(db, BENEFICIARIES_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastUsed', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Beneficiary[];
};

/**
 * Get recent beneficiaries (most frequently used).
 */
export const getRecentBeneficiaries = async (
  userId: string,
  limit: number = 5
): Promise<Beneficiary[]> => {
  const q = query(
    collection(db, BENEFICIARIES_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastUsed', 'desc'),
    firestoreLimit(limit)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Beneficiary[];
};

/**
 * Update the usage stats when a beneficiary is used.
 */
export const updateBeneficiaryUsage = async (
  benId: string
): Promise<void> => {
  const benRef = doc(db, BENEFICIARIES_COLLECTION, benId);
  const snapshot = await getDocs(
    query(collection(db, BENEFICIARIES_COLLECTION), where('__name__', '==', benId))
  );

  if (!snapshot.empty) {
    const currentCount = snapshot.docs[0].data().usageCount || 0;
    await updateDoc(benRef, {
      lastUsed: serverTimestamp(),
      usageCount: currentCount + 1,
    });
  }
};

/**
 * Update a beneficiary's name.
 */
export const updateBeneficiaryName = async (
  benId: string,
  name: string
): Promise<void> => {
  const benRef = doc(db, BENEFICIARIES_COLLECTION, benId);
  await updateDoc(benRef, { name });
};

/**
 * Remove a beneficiary.
 */
export const removeBeneficiary = async (benId: string): Promise<void> => {
  const benRef = doc(db, BENEFICIARIES_COLLECTION, benId);
  await deleteDoc(benRef);
};
