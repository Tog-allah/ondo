import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Input } from '../../components';
import { Colors, Gradients } from '../../constants';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { useAuth } from '../../contexts/AuthContext';

export default function OtpScreen() {
  const router = useRouter();
  const { phone, verificationId } = useLocalSearchParams<{ phone: string; verificationId: string }>();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginWithOtp } = useAuth();

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setCode(cleaned);
      setError('');
      
      // Auto-submit if exact length
      if (cleaned.length === 6) {
        verifyCode(cleaned);
      }
    }
  };

  const verifyCode = async (otpCode: string) => {
    if (otpCode.length !== 6 || !verificationId || !phone) {
      setError('Code invalide. Veuillez réessayer.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Attempt login via AuthContext
      await loginWithOtp(verificationId, otpCode, phone);

      // Success -> AuthContext state will update and `app/index.tsx` will redirect to tabs
      router.replace('/(tabs)');
      
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Le code de vérification est incorrect.');
      } else if (err.code === 'auth/code-expired') {
        setError('Le code a expiré. Veuillez retourner pour demander un nouveau code.');
      } else {
        setError('Une erreur est survenue lors de la vérification.');
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
      {/* Header */}
      <LinearGradient
        colors={[...Gradients.header]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Vérification</Text>
          <Text style={styles.headerSubtitle}>
            Un code à 6 chiffres a été envoyé au {phone}
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Code SMS</Text>
          <Input
            value={code}
            onChangeText={handleCodeChange}
            placeholder="• • • • • •"
            keyboardType="number-pad"
            maxLength={6}
            error={error}
            editable={!isLoading}
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
          />
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Entrez le code reçu par SMS pour sécuriser votre compte.
          </Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomSection}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Vérification...</Text>
          </View>
        ) : (
          <Button
            title="Vérifier"
            onPress={() => verifyCode(code)}
            disabled={code.length < 6}
            icon={
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
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
  inputContainer: {
    marginVertical: 20,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
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
