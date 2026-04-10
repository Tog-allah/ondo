/**
 * Airtel Money API Service
 * ────────────────────────
 * Handles all communication with the Airtel Money Open API for Chad.
 *
 * API Flow:
 *  1. Authenticate with OAuth2 to get access token
 *  2. (Optional) Get RSA encryption key for PIN encryption
 *  3. Initiate a collection (Push USSD to subscriber)
 *  4. Check transaction status
 *
 * Reference: Airtel Money Open API Documentation
 */

import axios, { AxiosInstance } from 'axios';
import * as forge from 'node-forge';

// ── Types ───────────────────────────────────────────────────

interface AuthResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
}

interface CollectionRequest {
  msisdn: string;
  amount: number;
  reference: string;
  country: string;
  currency: string;
}

interface CollectionResponse {
  data: {
    transaction: {
      id: string;
      status: string;
    };
  };
  status: {
    code: string;
    message: string;
    result_code: string;
    success: boolean;
  };
}

interface TransactionStatusResponse {
  data: {
    transaction: {
      airtel_money_id: string;
      id: string;
      message: string;
      status: string; // 'TS' = success, 'TF' = failed, 'TA' = ambiguous
    };
  };
  status: {
    code: string;
    message: string;
    result_code: string;
    success: boolean;
  };
}

interface EncryptionKeyResponse {
  data: {
    key: string;
  };
  status: {
    code: string;
    message: string;
    success: boolean;
  };
}

// ── Service ─────────────────────────────────────────────────

export class AirtelService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private httpClient: AxiosInstance;

  constructor(baseUrl: string, clientId: string, clientSecret: string) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
    });
  }

  // ── Authentication ──────────────────────────────────────

  /**
   * Authenticate with Airtel OAuth2 API.
   * Caches the token until it expires.
   */
  async authenticate(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.httpClient.post<AuthResponse>(
        '/auth/oauth2/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry with 5-minute buffer
      this.tokenExpiry = Date.now() + (parseInt(response.data.expires_in) - 300) * 1000;

      return this.accessToken as string;
    } catch (error: any) {
      console.error('Airtel Auth Error:', error.response?.data || error.message);
      throw new Error('Échec de l\'authentification Airtel Money');
    }
  }

  // ── Encryption ──────────────────────────────────────────

  /**
   * Get RSA public key for PIN encryption.
   */
  async getEncryptionKey(): Promise<string> {
    const token = await this.authenticate();

    try {
      const response = await this.httpClient.get<EncryptionKeyResponse>(
        '/v1/rsa/encryption-keys',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data.data.key;
    } catch (error: any) {
      console.error('Encryption key error:', error.response?.data || error.message);
      throw new Error('Impossible de récupérer la clé de chiffrement');
    }
  }

  /**
   * Encrypt a PIN using RSA public key from Airtel.
   */
  encryptPin(pin: string, publicKeyPem: string): string {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(pin, 'RSAES-PKCS1-V1_5');
    return forge.util.encode64(encrypted);
  }

  // ── Collections (Receive Money) ─────────────────────────

  /**
   * Initiate a collection (Push USSD).
   * This sends a USSD prompt to the subscriber's phone.
   * The subscriber enters their PIN on the USSD menu to confirm.
   */
  async initiateCollection(request: CollectionRequest): Promise<any> {
    const token = await this.authenticate();

    try {
      const response = await this.httpClient.post<CollectionResponse>(
        '/merchant/v2/payments/',
        {
          reference: request.reference,
          subscriber: {
            country: request.country,
            currency: request.currency,
            msisdn: request.msisdn,
          },
          transaction: {
            amount: request.amount,
            country: request.country,
            currency: request.currency,
            id: request.reference,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Country': request.country,
            'X-Currency': request.currency,
          },
        }
      );

      if (!response.data.status.success) {
        throw new Error(
          response.data.status.message || 'La transaction a échoué côté Airtel.'
        );
      }

      return response.data.data;
    } catch (error: any) {
      if (error.response) {
        console.error('Airtel Collection Error:', error.response.data);
        const msg = error.response.data?.status?.message || 'Erreur Airtel Money';
        throw new Error(msg);
      }
      throw error;
    }
  }

  // ── Transaction Status ──────────────────────────────────

  /**
   * Check the status of a transaction.
   * Returns: TS (success), TF (failed), TA (ambiguous/pending)
   */
  async checkTransactionStatus(transactionId: string): Promise<{
    status: string;
    message: string;
    airtelMoneyId?: string;
  }> {
    const token = await this.authenticate();

    try {
      const response = await this.httpClient.get<TransactionStatusResponse>(
        `/standard/v2/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Country': 'TD',
            'X-Currency': 'XAF',
          },
        }
      );

      const txData = response.data.data.transaction;

      return {
        status: txData.status,
        message: txData.message || '',
        airtelMoneyId: txData.airtel_money_id,
      };
    } catch (error: any) {
      console.error('Status check error:', error.response?.data || error.message);
      throw new Error('Impossible de vérifier le statut de la transaction');
    }
  }
}
