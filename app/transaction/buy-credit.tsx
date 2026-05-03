import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input, Card, OperatorBadge, ContactSelector } from '../../components';
import { Colors, Gradients, detectOperator, formatPhoneNumber, formatCurrency, CHAD_COUNTRY_CODE } from '../../constants';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { useApp } from '../../contexts/AppContext';

const quickAmounts = [500, 1000, 2000, 3000, 5000, 10000];

export default function BuyCreditScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [useWallet, setUseWallet] = useState(true);
  const [showContacts, setShowContacts] = useState(false);
  const { walletBalance } = useApp();
  const operator = detectOperator(phone);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 8) setPhone(cleaned);
  };

  const handleConfirm = () => {
    router.push({
      pathname: '/transaction/confirm',
      params: {
        type: 'credit',
        phone: CHAD_COUNTRY_CODE + phone,
        amount,
        operator: operator || '',
        useWallet: useWallet ? 'true' : 'false',
        walletDeduction: useWallet ? Math.min(walletBalance, Number(amount)).toString() : '0',
      },
    });
  };

  const isValid = phone.length === 8 && operator && Number(amount) >= 100;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[...Gradients.header]} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.hTitle}>Acheter du Crédit</Text>
        <Text style={s.hSub}>Rechargez n'importe quel numéro tchadien</Text>
      </LinearGradient>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Phone */}
        <Text style={s.label}>Numéro bénéficiaire</Text>
        <View style={s.phoneRow}>
          <View style={s.countryCode}>
            <Text style={s.flag}>🇹🇩</Text>
            <Text style={s.codeText}>+235</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Input
              value={formatPhoneNumber(phone)}
              onChangeText={handlePhoneChange}
              placeholder="6X XX XX XX"
              keyboardType="phone-pad"
              rightIcon="people"
              onRightIconPress={() => setShowContacts(true)}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
        </View>
        {operator && (
          <View style={s.opRow}>
            <OperatorBadge operator={operator} size="small" />
          </View>
        )}

        {/* Amount */}
        <Text style={[s.label, { marginTop: 24 }]}>Montant (XAF)</Text>
        <Input
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
          placeholder="Entrez le montant"
          keyboardType="numeric"
          leftIcon="cash-outline"
          containerStyle={{ marginBottom: 8 }}
        />
        <View style={s.quickGrid}>
          {quickAmounts.map((a) => (
            <TouchableOpacity
              key={a}
              style={[s.quickBtn, amount === a.toString() && s.quickBtnActive]}
              onPress={() => setAmount(a.toString())}
            >
              <Text style={[s.quickTxt, amount === a.toString() && s.quickTxtActive]}>
                {formatCurrency(a)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet toggle */}
        {walletBalance > 0 && (
          <Card style={s.walletCard}>
            <TouchableOpacity style={s.walletRow} onPress={() => setUseWallet(!useWallet)}>
              <View style={s.walletLeft}>
                <Ionicons name="wallet" size={20} color={Colors.primary} />
                <View>
                  <Text style={s.walletLabel}>Utiliser mon solde de remboursement</Text>
                  <Text style={s.walletBalance}>{formatCurrency(walletBalance)} disponible</Text>
                </View>
              </View>
              <View style={[s.toggle, useWallet && s.toggleActive]}>
                <View style={[s.toggleDot, useWallet && s.toggleDotActive]} />
              </View>
            </TouchableOpacity>
          </Card>
        )}

        {/* Fee info */}
        <View style={s.feeRow}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
          <Text style={s.feeText}>Frais Ondo : <Text style={s.feeZero}>0 XAF</Text></Text>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <Button
          title={amount ? `Payer ${formatCurrency(Number(amount))}` : 'Continuer'}
          onPress={handleConfirm}
          disabled={!isValid}
        />
      </View>

      <ContactSelector 
        visible={showContacts} 
        onClose={() => setShowContacts(false)} 
        onSelect={(p) => setPhone(p)} 
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: 12 },
  hTitle: { ...Typography.h2, color: Colors.white },
  hSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  label: { ...Typography.captionMedium, color: Colors.textSecondary, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', height: 52,
    paddingHorizontal: 12, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, backgroundColor: Colors.surface, gap: 6,
  },
  flag: { fontSize: 18 },
  codeText: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.textPrimary },
  opRow: { marginTop: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  quickTxt: { ...Typography.captionMedium, color: Colors.textSecondary },
  quickTxtActive: { color: Colors.primary },
  walletCard: { marginVertical: 16 },
  walletRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  walletLabel: { ...Typography.captionMedium, color: Colors.textPrimary },
  walletBalance: { ...Typography.small, color: Colors.textTertiary, marginTop: 2 },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: Colors.success },
  toggleDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white,
  },
  toggleDotActive: { alignSelf: 'flex-end' },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  feeText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  feeZero: { color: Colors.success, fontFamily: FontFamily.bold },
  bottom: { paddingHorizontal: 24, paddingBottom: 36 },
});
