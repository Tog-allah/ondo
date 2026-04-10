import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

// ── Types ───────────────────────────────────────────────────

export type TransactionType = 'credit' | 'bundle' | 'transfer';
export type TransactionStatus = 'pending' | 'success' | 'failed';

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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), txData);
  return docRef.id;
};

/**
 * Get a single transaction by ID.
 */
export const getTransaction = async (
  txId: string
): Promise<Transaction | null> => {
  const txRef = doc(db, TRANSACTIONS_COLLECTION, txId);
  const snapshot = await getDoc(txRef);

  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Transaction;
};

/**
 * Get transactions for a user with optional filters.
 */
export const getTransactions = async (
  userId: string,
  filters?: TransactionFilters
): Promise<Transaction[]> => {
  const constraints: any[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ];

  if (filters?.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  const q = query(collection(db, TRANSACTIONS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

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
  limit: number = 5
): Promise<Transaction[]> => {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );

  const snapshot = await getDocs(q);
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
  const txRef = doc(db, TRANSACTIONS_COLLECTION, txId);
  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (airtelTxId) {
    updateData.airtelTxId = airtelTxId;
  }

  await updateDoc(txRef, updateData);
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
  const processPaymentFn = httpsCallable(functions, 'processPayment');
  const result = await processPaymentFn({
    transactionId,
    phone,
    amount,
    operator,
    type,
  });
  return result.data;
};

