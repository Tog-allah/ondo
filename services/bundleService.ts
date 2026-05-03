import firestoreModule, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from './firebase';

// ── Types ───────────────────────────────────────────────────

export type BundleCategory = 'data' | 'voice' | 'sms' | 'combo';

export type Timestamp = FirebaseFirestoreTypes.Timestamp;

export interface Bundle {
  id: string;
  operator: 'airtel' | 'moov';
  name: string;
  description: string;
  price: number;
  validity: string;
  category: BundleCategory;
  dataAmount?: string; // e.g. "1 Go", "500 Mo"
  voiceMinutes?: number;
  smsCount?: number;
  isPromo?: boolean;
  updatedAt: Timestamp;
}

// ── Constants ───────────────────────────────────────────────

const BUNDLES_COLLECTION = 'bundles';

/**
 * Default bundles catalogue for seeding Firestore.
 * In production, these would be synced via Cloud Functions from operator APIs.
 */
export const DEFAULT_BUNDLES: Omit<Bundle, 'id' | 'updatedAt'>[] = [
  // ── Airtel Data ──
  {
    operator: 'airtel',
    name: 'Journalier 100 Mo',
    description: '100 Mo valable 24h',
    price: 100,
    validity: '1 jour',
    category: 'data',
    dataAmount: '100 Mo',
  },
  {
    operator: 'airtel',
    name: 'Journalier 250 Mo',
    description: '250 Mo valable 24h',
    price: 200,
    validity: '1 jour',
    category: 'data',
    dataAmount: '250 Mo',
  },
  {
    operator: 'airtel',
    name: 'Hebdo 1 Go',
    description: '1 Go valable 7 jours',
    price: 500,
    validity: '7 jours',
    category: 'data',
    dataAmount: '1 Go',
  },
  {
    operator: 'airtel',
    name: 'Mensuel 3 Go',
    description: '3 Go valable 30 jours',
    price: 2000,
    validity: '30 jours',
    category: 'data',
    dataAmount: '3 Go',
  },
  {
    operator: 'airtel',
    name: 'Mensuel 5 Go',
    description: '5 Go valable 30 jours',
    price: 3000,
    validity: '30 jours',
    category: 'data',
    dataAmount: '5 Go',
  },
  {
    operator: 'airtel',
    name: 'Mega 10 Go',
    description: '10 Go valable 30 jours',
    price: 5000,
    validity: '30 jours',
    category: 'data',
    dataAmount: '10 Go',
    isPromo: true,
  },
  // ── Airtel Voice ──
  {
    operator: 'airtel',
    name: 'Appels 30 min',
    description: '30 minutes d\'appels toutes directions',
    price: 300,
    validity: '3 jours',
    category: 'voice',
    voiceMinutes: 30,
  },
  {
    operator: 'airtel',
    name: 'Appels 120 min',
    description: '120 minutes d\'appels toutes directions',
    price: 1000,
    validity: '30 jours',
    category: 'voice',
    voiceMinutes: 120,
  },
  // ── Moov Data ──
  {
    operator: 'moov',
    name: 'Pass Jour 150 Mo',
    description: '150 Mo valable 24h',
    price: 100,
    validity: '1 jour',
    category: 'data',
    dataAmount: '150 Mo',
  },
  {
    operator: 'moov',
    name: 'Pass Semaine 1.5 Go',
    description: '1.5 Go valable 7 jours',
    price: 500,
    validity: '7 jours',
    category: 'data',
    dataAmount: '1.5 Go',
  },
  {
    operator: 'moov',
    name: 'Pass Mois 4 Go',
    description: '4 Go valable 30 jours',
    price: 2000,
    validity: '30 jours',
    category: 'data',
    dataAmount: '4 Go',
  },
  {
    operator: 'moov',
    name: 'Mega Pass 8 Go',
    description: '8 Go valable 30 jours',
    price: 4000,
    validity: '30 jours',
    category: 'data',
    dataAmount: '8 Go',
    isPromo: true,
  },
  // ── Moov Voice ──
  {
    operator: 'moov',
    name: 'Forfait Appels 60 min',
    description: '60 minutes d\'appels Moov',
    price: 500,
    validity: '7 jours',
    category: 'voice',
    voiceMinutes: 60,
  },
];

// ── Bundle Operations ───────────────────────────────────────

/**
 * Get all bundles, optionally filtered by operator and/or category.
 */
export const getBundles = async (
  operatorFilter?: 'airtel' | 'moov',
  categoryFilter?: BundleCategory
): Promise<Bundle[]> => {
  let query: FirebaseFirestoreTypes.Query = db.collection(BUNDLES_COLLECTION);

  if (operatorFilter) {
    query = query.where('operator', '==', operatorFilter);
  }
  if (categoryFilter) {
    query = query.where('category', '==', categoryFilter);
  }

  query = query.orderBy('price', 'asc');

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Bundle[];
};

/**
 * Seed the Firestore bundles collection with default data.
 * Only creates documents that don't already exist.
 */
export const seedBundles = async (): Promise<number> => {
  let created = 0;

  for (const bundle of DEFAULT_BUNDLES) {
    const docId = `${bundle.operator}_${bundle.name.toLowerCase().replace(/\s+/g, '_')}`;
    const docRef = db.collection(BUNDLES_COLLECTION).doc(docId);

    await docRef.set(
      {
        ...bundle,
        updatedAt: firestoreModule.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    created++;
  }

  return created;
};
