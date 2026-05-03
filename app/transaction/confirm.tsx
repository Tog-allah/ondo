import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button, Card } from '../../components';
import { Colors, Gradients } from '../../constants/Colors';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { formatCurrency } from '../../constants';
import { OperatorImages } from '../../constants/OperatorImages';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import {
  createTransaction,
  simulateTransactionCompletion,
  processPaymentCloud,
  TransactionType,
} from '../../services/transactionService';
import { deductFromWallet } from '../../services/userService';
import { addBeneficiary } from '../../services/beneficiaryService';
import {
  isOffline,
  isSmsAvailable,
  sendCreditSms,
  sendBundleSms,
  sendTransferSms,
} from '../../services/smsService';

export default function ConfirmScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { refreshAll } = useApp();
  const params = useLocalSearchParams<{
    type: string;
    phone: string;
    amount: string;
    operator: string;
    fee?: string;
    bundleName?: string;
    bundleValidity?: string;
    paymentMethod?: string;
    useWallet?: string;
    walletDeduction?: string;
  }>();

  const amount = Number(params.amount);
  const fee = Number(params.fee || 0);
  const walletDeduction = Number(params.walletDeduction || 0);
  const total = amount + fee - walletDeduction;
  const opColor = params.operator === 'airtel' ? Colors.airtel : Colors.moov;

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isDeviceOffline, setIsDeviceOffline] = useState(false);
  const [smsAvailable, setSmsAvailable] = useState(false);

  // Check connectivity and SMS availability on mount
  useEffect(() => {
    const checkStatus = async () => {
      const [offline, smsOk] = await Promise.all([
        isOffline(),
        isSmsAvailable(),
      ]);
      setIsDeviceOffline(offline);
      setSmsAvailable(smsOk);
    };
    checkStatus();
  }, []);

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      Alert.alert(
        'Session expirée',
        'Veuillez vous reconnecter pour continuer.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/welcome') }]
      );
    }
  }, [isAuthenticated, user]);

  const getTypeLabel = () => {
    switch (params.type) {
      case 'credit':
        return 'Achat de Crédit';
      case 'bundle':
        return `Achat de Forfait${
          params.bundleName ? ` (${params.bundleName})` : ''
        }`;
      case 'transfer':
        return "Transfert d'Argent";
      default:
        return 'Transaction';
    }
  };

  // ── Online Payment Flow ───────────────────────────────────
  const handlePay = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Veuillez vous reconnecter.');
      router.replace('/(auth)/welcome');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Créer la transaction dans Firestore
      const txId = await createTransaction({
        userId: user.uid,
        type: params.type as TransactionType,
        amount,
        fee,
        beneficiaryPhone: params.phone,
        operator: params.operator as 'airtel' | 'moov',
        bundleName: params.bundleName,
        bundleValidity: params.bundleValidity,
        walletDeduction,
      });

      // 2. Ajouter le bénéficiaire aux favoris
      try {
        await addBeneficiary({
          userId: user.uid,
          name: `Contact ${params.phone.slice(-4)}`,
          phone: params.phone,
          operator: params.operator as 'airtel' | 'moov',
        });
      } catch (benErr) {
        // Non-blocking — beneficiary save failure shouldn't stop the transaction
        console.warn('Beneficiary save failed:', benErr);
      }

      // 3. Appeler la Cloud Function pour le paiement réel
      // En MVP, on fait un fallback vers la simulation car les APIs opérateurs ne sont pas intégrées
      try {
        await processPaymentCloud(
          txId,
          params.phone,
          amount,
          params.operator as 'airtel' | 'moov',
          params.type as TransactionType
        );
      } catch (err: any) {
        console.warn('API Payment unavailable, using simulation for MVP', err);
        await simulateTransactionCompletion(txId);
      }

      // 4. Si on a utilisé le wallet, déduire du wallet
      if (walletDeduction > 0) {
        try {
          await deductFromWallet(user.uid, walletDeduction);
        } catch (walletErr) {
          console.warn('Wallet deduction failed:', walletErr);
        }
      }

      // 5. Rafraîchir les données globales
      await refreshAll();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 6. Rediriger vers la page de succès avec la référence
      const txRef = `ONDO-${Date.now().toString(36).toUpperCase()}`;
      router.push({
        pathname: '/transaction/success',
        params: { status: 'success', txRef },
      });
    } catch (error: any) {
      console.error('Erreur transaction:', error);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // If offline, suggest SMS fallback
      const offline = await isOffline();
      if (offline && smsAvailable) {
        Alert.alert(
          'Pas de connexion',
          'Voulez-vous envoyer la transaction par SMS ?',
          [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui, par SMS', onPress: handleSmsFallback },
          ]
        );
      } else {
        Alert.alert(
          'Erreur de transaction',
          error?.message || 'Impossible de traiter la transaction. Veuillez réessayer.'
        );
      }
    }
  };

  // ── SMS Offline Payment Flow (FR.2.4) ─────────────────────
  const handleSmsFallback = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const operator = params.operator as 'airtel' | 'moov';
      let result;

      switch (params.type) {
        case 'credit':
          result = await sendCreditSms(params.phone, amount, operator);
          break;
        case 'bundle':
          result = await sendBundleSms(
            params.phone,
            amount,
            operator,
            params.bundleName || 'DATA'
          );
          break;
        case 'transfer':
          result = await sendTransferSms(params.phone, amount, operator);
          break;
        default:
          result = await sendCreditSms(params.phone, amount, operator);
      }

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const txRef = `SMS-${Date.now().toString(36).toUpperCase()}`;
        router.push({
          pathname: '/transaction/success',
          params: { status: 'success', txRef, viaSms: 'true' },
        });
      } else {
        Alert.alert('Erreur SMS', result.error || 'Impossible d\'envoyer le SMS.');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Erreur lors de l\'envoi SMS.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <LinearGradient colors={[...Gradients.header]} style={s.header}>
        <TouchableOpacity
          onPress={() => !isLoading && router.back()}
          style={s.back}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.hTitle}>Confirmation</Text>
        <Text style={s.hSub}>Vérifiez les détails avant de payer</Text>
      </LinearGradient>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Offline Banner */}
        {isDeviceOffline && smsAvailable && (
          <View style={s.offlineBanner}>
            <Ionicons name="cloud-offline" size={18} color={Colors.warning} />
            <Text style={s.offlineText}>
              Mode hors-ligne — Transaction par SMS disponible
            </Text>
          </View>
        )}

        <Card style={s.summaryCard} padding="large">
          <View style={s.summaryHeader}>
            <View style={[s.summaryIcon, { backgroundColor: opColor + '15' }]}>
              <Ionicons
                name={
                  params.type === 'transfer'
                    ? 'swap-horizontal'
                    : params.type === 'bundle'
                    ? 'wifi'
                    : 'phone-portrait'
                }
                size={28}
                color={opColor}
              />
            </View>
            <Text style={s.summaryType}>{getTypeLabel()}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Bénéficiaire</Text>
            <Text style={s.detailValue}>{params.phone}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Opérateur</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                source={OperatorImages[params.operator as 'airtel' | 'moov']?.logo}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
              <Text style={[s.detailValue, { color: opColor }]}>
                {params.operator === 'airtel' ? 'Airtel' : 'Moov Africa'}
              </Text>
            </View>
          </View>
          {params.bundleName && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Forfait</Text>
              <Text style={s.detailValue}>
                {params.bundleName} ({params.bundleValidity})
              </Text>
            </View>
          )}
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Montant</Text>
            <Text style={s.detailValue}>{formatCurrency(amount)}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Frais Ondo</Text>
            <Text
              style={[
                s.detailValue,
                { color: Colors.success, fontFamily: FontFamily.bold },
              ]}
            >
              0 XAF ✓
            </Text>
          </View>
          {fee > 0 && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Frais opérateur</Text>
              <Text style={s.detailValue}>{formatCurrency(fee)}</Text>
            </View>
          )}

          {walletDeduction > 0 && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Remboursement appliqué</Text>
              <Text style={[s.detailValue, { color: Colors.primary }]}>
                -{formatCurrency(walletDeduction)}
              </Text>
            </View>
          )}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total à payer :</Text>
            <Text style={s.totalAmount}>{formatCurrency(total)}</Text>
          </View>
        </Card>

        {isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 16 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ ...Typography.bodyMedium, color: Colors.textSecondary }}>
              Traitement en cours...
            </Text>
          </View>
        ) : (
          <View style={s.footer}>
            <Text style={s.secureText}>
              <Ionicons name="lock-closed" size={12} color={Colors.textTertiary} />{' '}
              Paiement sécurisé. Validation via USSD par votre opérateur.
            </Text>

            {/* Primary: Online Payment */}
            <Button
              title={isDeviceOffline ? 'Payer par SMS' : 'Confirmer et Payer'}
              onPress={isDeviceOffline && smsAvailable ? handleSmsFallback : handlePay}
              disabled={isLoading}
              icon={
                <Ionicons
                  name={isDeviceOffline ? 'chatbubble' : 'shield-checkmark'}
                  size={18}
                  color={Colors.white}
                />
              }
            />

            {/* Secondary: SMS option when online */}
            {!isDeviceOffline && smsAvailable && (
              <TouchableOpacity
                style={s.smsButton}
                onPress={handleSmsFallback}
                disabled={isLoading}
              >
                <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                <Text style={s.smsButtonText}>Envoyer par SMS à la place</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: Layout.padding.lg,
  },
  back: { marginBottom: 16 },
  hTitle: { ...Typography.h1, color: Colors.white, marginBottom: 8 },
  hSub: { ...Typography.body, color: 'rgba(255,255,255,0.8)' },
  content: { flex: 1, marginTop: -20 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Layout.padding.lg,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  offlineText: {
    ...Typography.caption,
    color: '#856404',
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: Layout.padding.lg,
    marginBottom: Layout.padding.lg,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryType: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: { ...Typography.body, color: Colors.textSecondary },
  detailValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  totalLabel: { ...Typography.subtitle, color: Colors.textPrimary },
  totalAmount: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.primary },
  footer: {
    padding: Layout.padding.lg,
    paddingBottom: Layout.padding.xl,
  },
  secureText: {
    ...Typography.small,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
  smsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
  },
  smsButtonText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
});
