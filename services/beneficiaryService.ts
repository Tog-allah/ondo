import firestoreModule, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from './firebase';

// ── Types ───────────────────────────────────────────────────

export type Timestamp = FirebaseFirestoreTypes.Timestamp;

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

  const docRef = await db.collection(BENEFICIARIES_COLLECTION).add({
    userId: data.userId,
    name: data.name,
    phone: data.phone,
    operator: data.operator,
    lastUsed: firestoreModule.FieldValue.serverTimestamp(),
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
  const snapshot = await db
    .collection(BENEFICIARIES_COLLECTION)
    .where('userId', '==', userId)
    .where('phone', '==', phone)
    .get();

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
  const snapshot = await db
    .collection(BENEFICIARIES_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('lastUsed', 'desc')
    .get();

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
  count: number = 5
): Promise<Beneficiary[]> => {
  const snapshot = await db
    .collection(BENEFICIARIES_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('lastUsed', 'desc')
    .limit(count)
    .get();

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
  const benRef = db.collection(BENEFICIARIES_COLLECTION).doc(benId);
  const snapshot = await benRef.get();

  if (snapshot.exists()) {
    const currentCount = snapshot.data()?.usageCount || 0;
    await benRef.update({
      lastUsed: firestoreModule.FieldValue.serverTimestamp(),
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
  await db.collection(BENEFICIARIES_COLLECTION).doc(benId).update({ name });
};

/**
 * Remove a beneficiary.
 */
export const removeBeneficiary = async (benId: string): Promise<void> => {
  await db.collection(BENEFICIARIES_COLLECTION).doc(benId).delete();
};
