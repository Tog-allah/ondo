import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Native Firebase Auth used via services/firebase

import { Button, Input, OperatorBadge } from '../../components';
import {
  Colors,
  Gradients,
  detectOperator,
  formatPhoneNumber,
  CHAD_COUNTRY_CODE,
} from '../../constants';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';

import { auth } from '../../services/firebase';

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const operator = detectOperator(phone);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 8) {
      setPhone(cleaned);
      setError('');
    }
  };

  const handleSendOtp = async () => {
    if (phone.length !== 8) {
      setError('Veuillez saisir un numéro à 8 chiffres (ex: 6X XX XX XX)');
      return;
    }
    if (!operator) {
      setError('Veuillez saisir un numéro Airtel (6...) ou Moov (9...)');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const fullPhoneNumber = CHAD_COUNTRY_CODE + phone;

      const confirmationResult = await auth.signInWithPhoneNumber(fullPhoneNumber);

      // Successfully sent SMS — store verificationId and navigate
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: fullPhoneNumber,
          verificationId: confirmationResult.verificationId,
        },
      });
    } catch (err: any) {
      console.error('Phone Auth Error:', err?.message || 'No message', err?.code || 'No code', err);

      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/invalid-phone-number' || message.includes('invalid')) {
        setError('Numéro de téléphone invalide. Vérifiez le format (+235XXXXXXXX).');
      } else if (code === 'auth/too-many-requests' || message.includes('throttle')) {
        setError('Trop de tentatives. Veuillez réessayer dans quelques minutes.');
      } else if (code === 'auth/quota-exceeded') {
        setError('Quota SMS dépassé. Réessayez plus tard.');
      } else if (message.includes('reCAPTCHA') || message.includes('verify')) {
        setError('Vérification de sécurité échouée. Réessayez.');
      } else {
        const rawErr = err?.message || JSON.stringify(err);
        setError(`Erreur technique: ${rawErr}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Native SDK handles verification directly without WebView */}

      {/* Header */}
      <LinearGradient
        colors={[...Gradients.header]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Votre numéro</Text>
          <Text style={styles.headerSubtitle}>
            Entrez votre numéro de téléphone tchadien
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.phoneInputContainer}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇹🇩</Text>
            <Text style={styles.codeText}>{CHAD_COUNTRY_CODE}</Text>
          </View>
          <View style={styles.phoneInputWrapper}>
            <Input
              value={formatPhoneNumber(phone)}
              onChangeText={handlePhoneChange}
              placeholder="6X XX XX XX"
              keyboardType="phone-pad"
              maxLength={11}
              error={error}
              containerStyle={{ marginBottom: 0, flex: 1 }}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Operator Detection */}
        {operator && (
          <View style={styles.operatorDetected}>
            <OperatorBadge operator={operator} size="large" />
            <Text style={styles.detectedText}>
              Numéro {operator === 'airtel' ? 'Airtel' : 'Moov Africa'} détecté
            </Text>
          </View>
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Nous allons vous envoyer un code par SMS pour vérifier votre numéro.
            La vérification de sécurité est automatique.
          </Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomSection}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Envoi du code SMS...</Text>
          </View>
        ) : (
          <Button
            title="Recevoir le code"
            onPress={handleSendOtp}
            disabled={phone.length < 8}
            icon={
              <Ionicons name="chatbubble-ellipses" size={18} color={Colors.white} />
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Layout.padding.lg,
    borderBottomLeftRadius: Layout.radius.xl,
    borderBottomRightRadius: Layout.radius.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.white,
  },
  headerSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.spacing.xl,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Layout.radius.md,
    backgroundColor: Colors.surface,
    gap: 6,
    marginTop: 0,
  },
  flag: {
    fontSize: 20,
  },
  codeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  operatorDetected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detectedText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.primary + '08',
    borderRadius: Layout.radius.md,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: Layout.padding.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    marginTop: 8,
  },
});
