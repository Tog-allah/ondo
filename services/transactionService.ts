import firestoreModule, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db, functions } from './firebase';

// ── Types ───────────────────────────────────────────────────

export type TransactionType = 'credit' | 'bundle' | 'transfer';
export type TransactionStatus = 'pending' | 'success' | 'failed';

export type Timestamp = FirebaseFirestoreTypes.Timestamp;

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  fee: number;
  beneficiaryPhone: string;
  beneficiaryName: string;
  operator: 'airtel' | 'moov';
  status: TransactionStatus;
  bundleName?: string;
  bundleValidity?: string;
  walletDeduction: number;
  airtelTxId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTransactionData {
  userId: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  beneficiaryPhone: string;
  beneficiaryName?: string;
  operator: 'airtel' | 'moov';
  bundleName?: string;
  bundleValidity?: string;
  walletDeduction?: number;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
}

// ── Transaction Operations ──────────────────────────────────

const TRANSACTIONS_COLLECTION = 'transactions';

/**
 * Create a new transaction in Firestore.
 * Returns the transaction ID.
 */
export const createTransaction = async (
  data: CreateTransactionData
): Promise<string> => {
  const txData = {
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    fee: data.fee ?? 0,
    beneficiaryPhone: data.beneficiaryPhone,
    beneficiaryName: data.beneficiaryName ?? data.beneficiaryPhone,
    operator: data.operator,
    status: 'pending' as TransactionStatus,
    bundleName: data.bundleName ?? null,
    bundleValidity: data.bundleValidity ?? null,
    walletDeduction: data.walletDeduction ?? 0,
    airtelTxId: null,
    createdAt: firestoreModule.FieldValue.serverTimestamp(),
    updatedAt: firestoreModule.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection(TRANSACTIONS_COLLECTION).add(txData);
  return docRef.id;
};

/**
 * Get a single transaction by ID.
 */
export const getTransaction = async (
  txId: string
): Promise<Transaction | null> => {
  const snapshot = await db.collection(TRANSACTIONS_COLLECTION).doc(txId).get();

  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Transaction;
};

/**
 * Get transactions for a user with optional filters.
 */
export const getTransactions = async (
  userId: string,
  filters?: TransactionFilters
): Promise<Transaction[]> => {
  let query: FirebaseFirestoreTypes.Query = db
    .collection(TRANSACTIONS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc');

  if (filters?.type) {
    query = query.where('type', '==', filters.type);
  }
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
};

/**
 * Get the most recent transactions for a user.
 */
export const getRecentTransactions = async (
  userId: string,
  count: number = 5
): Promise<Transaction[]> => {
  const snapshot = await db
    .collection(TRANSACTIONS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(count)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
};

/**
 * Update the status of a transaction.
 */
export const updateTransactionStatus = async (
  txId: string,
  status: TransactionStatus,
  airtelTxId?: string
): Promise<void> => {
  const updateData: Record<string, any> = {
    status,
    updatedAt: firestoreModule.FieldValue.serverTimestamp(),
  };

  if (airtelTxId) {
    updateData.airtelTxId = airtelTxId;
  }

  await db.collection(TRANSACTIONS_COLLECTION).doc(txId).update(updateData);
};

/**
 * Simulate a transaction completing (for MVP without real Airtel API).
 * Waits a short delay, then marks as success.
 */
export const simulateTransactionCompletion = async (
  txId: string
): Promise<TransactionStatus> => {
  // Simulate network delay (1-3 seconds)
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  );

  // 90% success rate for demo
  const isSuccess = Math.random() > 0.1;
  const status: TransactionStatus = isSuccess ? 'success' : 'failed';

  await updateTransactionStatus(txId, status);
  return status;
};

/**
 * Call the Firebase Cloud Function to process payment securely.
 */
export const processPaymentCloud = async (
  transactionId: string,
  phone: string,
  amount: number,
  operator: 'airtel' | 'moov',
  type: TransactionType
): Promise<any> => {
  const processPaymentFn = functions.httpsCallable('processPayment');
  const result = await processPaymentFn({
    transactionId,
    phone,
    amount,
    operator,
    type,
  });
  return result.data;
};
