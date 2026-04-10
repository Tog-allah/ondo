/**
 * Ondo Firebase Cloud Functions
 * ─────────────────────────────
 * Handles server-side logic for payment processing with Airtel Money and Moov Money.
 * These functions are triggered by HTTPS calls from the mobile app.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AirtelService } from './airtelService';

admin.initializeApp();
const db = admin.firestore();

// ── Configuration ───────────────────────────────────────────

const config = {
  airtel: {
    baseUrl: functions.config().airtel?.base_url || 'https://openapiuat.airtel.africa',
    clientId: functions.config().airtel?.client_id || '',
    clientSecret: functions.config().airtel?.client_secret || '',
    country: 'TD', // Chad
    currency: 'XAF',
  },
};

// ── processPayment ──────────────────────────────────────────

/**
 * Initiate a payment transaction via Airtel Money Push USSD.
 * The user receives a USSD prompt on their phone to confirm with their PIN.
 *
 * Expected body:
 *  - transactionId: string (Firestore transaction doc ID)
 *  - phone: string (subscriber MSISDN without country code)
 *  - amount: number
 *  - operator: 'airtel' | 'moov'
 *  - type: 'credit' | 'bundle'
 */
export const processPayment = functions
  .region('europe-west1')
  .https.onCall(async (data: any, context: any) => {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Vous devez être connecté pour effectuer un paiement.'
      );
    }

    const { transactionId, phone, amount, operator, type } = data;

    // Validation
    if (!transactionId || !phone || !amount || !operator) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Paramètres manquants: transactionId, phone, amount, operator sont requis.'
      );
    }

    if (amount < 100) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le montant minimum est de 100 XAF.'
      );
    }

    try {
      // Update transaction status to 'processing'
      await db.collection('transactions').doc(transactionId).update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (operator === 'airtel') {
        // ── Airtel Money Flow ──
        const airtel = new AirtelService(
          config.airtel.baseUrl,
          config.airtel.clientId,
          config.airtel.clientSecret
        );

        // 1. Get OAuth token
        await airtel.authenticate();

        // 2. Initiate collection (Push USSD)
        const reference = `ONDO_${transactionId}_${Date.now()}`;
        const result = await airtel.initiateCollection({
          msisdn: phone,
          amount: amount,
          reference: reference,
          country: config.airtel.country,
          currency: config.airtel.currency,
        });

        // 3. Update transaction with Airtel reference
        await db.collection('transactions').doc(transactionId).update({
          status: 'pending', // Waiting for user USSD confirmation
          airtelTxId: result.transaction?.id || reference,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          message: 'Veuillez confirmer le paiement sur votre téléphone.',
          reference: reference,
          airtelTxId: result.transaction?.id,
        };
      } else {
        // ── Moov Money Flow ── (Placeholder for future implementation)
        // For MVP: simulate the transaction
        await db.collection('transactions').doc(transactionId).update({
          status: 'pending',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          message: 'Transaction Moov initiée (mode démo).',
          reference: `MOOV_${transactionId}`,
        };
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);

      // Mark transaction as failed
      await db.collection('transactions').doc(transactionId).update({
        status: 'failed',
        errorMessage: error.message || 'Erreur inconnue',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du traitement du paiement. Veuillez réessayer.'
      );
    }
  });

// ── checkPaymentStatus ──────────────────────────────────────

/**
 * Check the status of an Airtel Money transaction.
 *
 * Expected body:
 *  - transactionId: string (Firestore transaction doc ID)
 */
export const checkPaymentStatus = functions
  .region('europe-west1')
  .https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non authentifié.');
    }

    const { transactionId } = data;

    // Get the transaction from Firestore
    const txDoc = await db.collection('transactions').doc(transactionId).get();
    if (!txDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Transaction introuvable.');
    }

    const txData = txDoc.data()!;

    // If already completed, return directly
    if (txData.status === 'success' || txData.status === 'failed') {
      return { status: txData.status };
    }

    // Check with Airtel API
    if (txData.operator === 'airtel' && txData.airtelTxId) {
      try {
        const airtel = new AirtelService(
          config.airtel.baseUrl,
          config.airtel.clientId,
          config.airtel.clientSecret
        );
        await airtel.authenticate();

        const status = await airtel.checkTransactionStatus(txData.airtelTxId);

        // Map Airtel status to our status
        let newStatus: string;
        if (status.status === 'TS') {
          newStatus = 'success';
        } else if (status.status === 'TF') {
          newStatus = 'failed';
        } else {
          newStatus = 'pending';
        }

        // Update Firestore
        if (newStatus !== 'pending') {
          await db.collection('transactions').doc(transactionId).update({
            status: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        return { status: newStatus };
      } catch (error) {
        console.error('Status check error:', error);
        return { status: 'pending' };
      }
    }

    return { status: txData.status };
  });

// ── calculateFees ───────────────────────────────────────────

/**
 * Calculate transaction fees.
 * Ondo absorbs all fees - returns 0 for the user.
 *
 * Expected body:
 *  - amount: number
 *  - operator: 'airtel' | 'moov'
 *  - type: 'credit' | 'bundle' | 'transfer'
 */
export const calculateFees = functions
  .region('europe-west1')
  .https.onCall(async (data: any, context: any) => {
    const { amount, operator, type } = data;

    // Ondo doesn't charge any fees to the user
    // Internal cost tracking for business analytics
    let internalCost = 0;

    if (type === 'transfer') {
      // P2P transfer may have operator fees
      if (amount <= 5000) internalCost = 50;
      else if (amount <= 20000) internalCost = 100;
      else if (amount <= 50000) internalCost = 200;
      else internalCost = 300;
    }

    return {
      userFee: 0, // Always free for the user
      totalAmount: amount, // User pays exact amount
      internalCost: internalCost, // What Ondo absorbs
      currency: 'XAF',
    };
  });

// ── syncBundles ─────────────────────────────────────────────

/**
 * Scheduled function to sync bundle catalogs from operators.
 * Runs daily at 6:00 AM Africa/Ndjamena time.
 */
export const syncBundles = functions
  .region('europe-west1')
  .pubsub.schedule('0 6 * * *')
  .timeZone('Africa/Ndjamena')
  .onRun(async (context: any) => {
    console.log('Starting bundle sync...');

    // In production, this would call Airtel/Moov APIs to get current bundles
    // For now, we ensure the default bundles exist in Firestore

    const bundlesRef = db.collection('bundles');
    const snapshot = await bundlesRef.get();

    if (snapshot.empty) {
      console.log('No bundles found, seeding defaults...');
      // Default bundles would be seeded here
      // This is handled by the client-side seedBundles() for MVP
    }

    console.log(`Bundle sync complete. ${snapshot.size} bundles in catalog.`);
    return null;
  });

// ── handleRefund ────────────────────────────────────────────

/**
 * Process a refund for a failed transaction.
 * Credits the user's wallet balance in Firestore.
 *
 * Expected body:
 *  - transactionId: string
 */
export const handleRefund = functions
  .region('europe-west1')
  .https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non authentifié.');
    }

    const { transactionId } = data;

    const txDoc = await db.collection('transactions').doc(transactionId).get();
    if (!txDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Transaction introuvable.');
    }

    const txData = txDoc.data()!;

    // Only refund failed transactions
    if (txData.status !== 'failed') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Seules les transactions échouées peuvent être remboursées.'
      );
    }

    // Check if already refunded
    if (txData.refunded) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Cette transaction a déjà été remboursée.'
      );
    }

    // Credit user's wallet
    const userRef = db.collection('users').doc(txData.userId);
    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');

      const currentBalance = userDoc.data()!.walletBalance || 0;
      const refundAmount = txData.walletDeduction || txData.amount;

      transaction.update(userRef, {
        walletBalance: currentBalance + refundAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(db.collection('transactions').doc(transactionId), {
        refunded: true,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      message: 'Remboursement effectué sur votre portefeuille Ondo.',
    };
  });
