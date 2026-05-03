/**
 * SMS Offline Transaction Service (FR.2.4)
 *
 * Allows users to initiate transactions via SMS when there is no internet
 * connection. Composes operator-specific USSD/SMS commands and opens
 * the device's SMS app with the pre-filled message.
 *
 * Supported operators:
 * - Airtel Chad (Airtel Money)
 * - Moov Africa Chad (Moov Money)
 */
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ───────────────────────────────────────────────────

export type SmsTransactionType = 'credit' | 'bundle' | 'transfer';

export interface SmsTransaction {
  id: string;
  type: SmsTransactionType;
  phone: string;
  amount: number;
  operator: 'airtel' | 'moov';
  bundleName?: string;
  smsBody: string;
  shortcode: string;
  createdAt: string; // ISO date string
  synced: boolean;
}

export interface SmsTransactionResult {
  success: boolean;
  transaction?: SmsTransaction;
  error?: string;
}

// ── Operator Configuration ──────────────────────────────────

/**
 * Operator-specific shortcodes and SMS formats for Chad.
 * These are the standard Airtel Money / Moov Money SMS shortcodes.
 */
const OPERATOR_CONFIG = {
  airtel: {
    shortcode: '222',
    creditFormat: (phone: string, amount: number) =>
      `CREDIT ${phone} ${amount}`,
    transferFormat: (phone: string, amount: number) =>
      `TRANSFER ${phone} ${amount}`,
    bundleFormat: (phone: string, bundleCode: string) =>
      `FORFAIT ${bundleCode} ${phone}`,
    name: 'Airtel Money',
  },
  moov: {
    shortcode: '155',
    creditFormat: (phone: string, amount: number) =>
      `CREDIT ${phone} ${amount}`,
    transferFormat: (phone: string, amount: number) =>
      `ENVOI ${phone} ${amount}`,
    bundleFormat: (phone: string, bundleCode: string) =>
      `PASS ${bundleCode} ${phone}`,
    name: 'Moov Money',
  },
} as const;

// ── Storage Key ─────────────────────────────────────────────

const OFFLINE_TX_KEY = 'ondo_offline_transactions';

// ── Public API ──────────────────────────────────────────────

/**
 * Check if SMS is available on this device.
 */
export const isSmsAvailable = async (): Promise<boolean> => {
  return await SMS.isAvailableAsync();
};

/**
 * Check if the device is currently offline.
 * Uses a lightweight fetch to Google's generate_204 endpoint.
 */
export const isOffline = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return false; // Online
  } catch {
    return true; // Offline
  }
};

/**
 * Compose and send an SMS for a credit purchase transaction.
 */
export const sendCreditSms = async (
  phone: string,
  amount: number,
  operator: 'airtel' | 'moov'
): Promise<SmsTransactionResult> => {
  const config = OPERATOR_CONFIG[operator];
  const smsBody = config.creditFormat(phone, amount);

  return await sendOperatorSms({
    type: 'credit',
    phone,
    amount,
    operator,
    smsBody,
    shortcode: config.shortcode,
  });
};

/**
 * Compose and send an SMS for a bundle purchase.
 */
export const sendBundleSms = async (
  phone: string,
  amount: number,
  operator: 'airtel' | 'moov',
  bundleName: string
): Promise<SmsTransactionResult> => {
  const config = OPERATOR_CONFIG[operator];
  const bundleCode = bundleName.toUpperCase().replace(/\s+/g, '');
  const smsBody = config.bundleFormat(phone, bundleCode);

  return await sendOperatorSms({
    type: 'bundle',
    phone,
    amount,
    operator,
    smsBody,
    shortcode: config.shortcode,
    bundleName,
  });
};

/**
 * Compose and send an SMS for a P2P transfer.
 */
export const sendTransferSms = async (
  phone: string,
  amount: number,
  operator: 'airtel' | 'moov'
): Promise<SmsTransactionResult> => {
  const config = OPERATOR_CONFIG[operator];
  const smsBody = config.transferFormat(phone, amount);

  return await sendOperatorSms({
    type: 'transfer',
    phone,
    amount,
    operator,
    smsBody,
    shortcode: config.shortcode,
  });
};

/**
 * Get all pending offline transactions that haven't been synced.
 */
export const getPendingOfflineTransactions = async (): Promise<SmsTransaction[]> => {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_TX_KEY);
    if (!stored) return [];
    const all: SmsTransaction[] = JSON.parse(stored);
    return all.filter((tx) => !tx.synced);
  } catch {
    return [];
  }
};

/**
 * Get all offline transactions (synced and pending).
 */
export const getAllOfflineTransactions = async (): Promise<SmsTransaction[]> => {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_TX_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

/**
 * Mark an offline transaction as synced (after reconnecting and saving to Firestore).
 */
export const markTransactionSynced = async (txId: string): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_TX_KEY);
    if (!stored) return;
    const all: SmsTransaction[] = JSON.parse(stored);
    const updated = all.map((tx) =>
      tx.id === txId ? { ...tx, synced: true } : tx
    );
    await AsyncStorage.setItem(OFFLINE_TX_KEY, JSON.stringify(updated));
  } catch {
    console.warn('Failed to mark offline transaction as synced');
  }
};

/**
 * Clear all synced offline transactions from local storage.
 */
export const clearSyncedTransactions = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_TX_KEY);
    if (!stored) return;
    const all: SmsTransaction[] = JSON.parse(stored);
    const pending = all.filter((tx) => !tx.synced);
    await AsyncStorage.setItem(OFFLINE_TX_KEY, JSON.stringify(pending));
  } catch {
    console.warn('Failed to clear synced offline transactions');
  }
};

// ── Internal Helpers ────────────────────────────────────────

interface SendSmsParams {
  type: SmsTransactionType;
  phone: string;
  amount: number;
  operator: 'airtel' | 'moov';
  smsBody: string;
  shortcode: string;
  bundleName?: string;
}

/**
 * Core function that composes and sends the SMS, then stores it locally.
 */
async function sendOperatorSms(params: SendSmsParams): Promise<SmsTransactionResult> {
  // 1. Check SMS availability
  const available = await isSmsAvailable();
  if (!available) {
    return {
      success: false,
      error: 'SMS non disponible sur cet appareil.',
    };
  }

  // 2. Create the transaction record
  const transaction: SmsTransaction = {
    id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: params.type,
    phone: params.phone,
    amount: params.amount,
    operator: params.operator,
    bundleName: params.bundleName,
    smsBody: params.smsBody,
    shortcode: params.shortcode,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  try {
    // 3. Open the SMS app with pre-filled message
    const { result } = await SMS.sendSMSAsync(
      [params.shortcode],
      params.smsBody
    );

    if (result === 'sent' || result === 'unknown') {
      // 'unknown' is returned on Android when the SMS app is opened
      // (we can't guarantee delivery, but the intent was fired)

      // 4. Store locally for later sync
      await storeOfflineTransaction(transaction);

      return { success: true, transaction };
    } else {
      return {
        success: false,
        error: 'SMS annulé par l\'utilisateur.',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erreur lors de l\'envoi du SMS.',
    };
  }
}

/**
 * Persist an offline transaction to AsyncStorage.
 */
async function storeOfflineTransaction(tx: SmsTransaction): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_TX_KEY);
    const existing: SmsTransaction[] = stored ? JSON.parse(stored) : [];
    existing.push(tx);
    // Keep only last 50 transactions to avoid storage bloat
    const trimmed = existing.slice(-50);
    await AsyncStorage.setItem(OFFLINE_TX_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn('Failed to store offline transaction');
  }
}
