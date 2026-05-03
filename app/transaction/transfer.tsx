import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input, Card, OperatorSelector, ContactSelector } from '../../components';
import { Colors, Gradients, detectOperator, formatPhoneNumber, formatCurrency, CHAD_COUNTRY_CODE } from '../../constants';
import { Typography, FontFamily } from '../../constants/Typography';
import { OperatorImages } from '../../constants/OperatorImages';

export default function TransferScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'airtel' | 'moov' | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const operator = detectOperator(phone);

  const fee = Number(amount) > 0 ? Math.round(Number(amount) * 0.01) : 0; // 1% operator fee
  const total = Number(amount) + fee;

  const handleConfirm = () => {
    if (!operator || !paymentMethod) return;
    router.push({
      pathname: '/transaction/confirm',
      params: {
        type: 'transfer', phone: CHAD_COUNTRY_CODE + phone,
        amount, operator: operator, fee: fee.toString(),
        paymentMethod, useWallet: 'false', walletDeduction: '0',
      },
    });
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[...Gradients.header]} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.hTitle}>Transférer de l'Argent</Text>
        <Text style={s.hSub}>Envoyez de l'argent entre Airtel et Moov</Text>
      </LinearGradient>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.label}>Numéro destinataire</Text>
        <View style={s.phoneRow}>
          <View style={s.cc}><Text style={{fontSize:18}}>🇹🇩</Text><Text style={s.ccTxt}>+235</Text></View>
          <View style={{flex:1}}>
            <Input value={formatPhoneNumber(phone)}
              onChangeText={t => setPhone(t.replace(/\D/g,'').slice(0,8))}
              placeholder="6X XX XX XX" keyboardType="phone-pad"
              rightIcon="people" 
              onRightIconPress={() => setShowContacts(true)}
              containerStyle={{marginBottom:0}} />
          </View>
        </View>
        {operator && (
          <View style={s.opDetected}>
            <Image
              source={OperatorImages[operator].money}
              style={{width:22,height:22}}
              resizeMode="contain"
            />
            <Text style={s.opText}>
              Compte {operator==='airtel'?'Airtel Money':'Moov Money'} détecté
            </Text>
          </View>
        )}

        <Text style={[s.label,{marginTop:24}]}>Montant à envoyer (XAF)</Text>
        <Input value={amount} onChangeText={t => setAmount(t.replace(/\D/g,''))}
          placeholder="Entrez le montant" keyboardType="numeric" leftIcon="cash-outline" />

        {Number(amount) > 0 && (
          <Card style={s.feeCard}>
            <View style={s.feeRow}>
              <Text style={s.feeLabel}>Montant</Text>
              <Text style={s.feeValue}>{formatCurrency(Number(amount))}</Text>
            </View>
            <View style={s.feeDivider} />
            <View style={s.feeRow}>
              <Text style={s.feeLabel}>Frais Ondo</Text>
              <Text style={[s.feeValue,{color:Colors.success}]}>0 XAF</Text>
            </View>
            <View style={s.feeRow}>
              <Text style={s.feeLabel}>Frais opérateur (estimé)</Text>
              <Text style={s.feeValue}>{formatCurrency(fee)}</Text>
            </View>
            <View style={s.feeDivider} />
            <View style={s.feeRow}>
              <Text style={[s.feeLabel,{fontFamily:FontFamily.bold}]}>Total</Text>
              <Text style={[s.feeValue,{fontFamily:FontFamily.bold, fontSize:18}]}>
                {formatCurrency(total)}
              </Text>
            </View>
          </Card>
        )}

        <Text style={[s.label,{marginTop:20}]}>Payer avec</Text>
        <OperatorSelector selected={paymentMethod} onSelect={setPaymentMethod} />

        <View style={{height:30}} />
      </ScrollView>

      <View style={s.bottom}>
        <Button
          title={amount ? `Envoyer ${formatCurrency(Number(amount))}` : 'Continuer'}
          onPress={handleConfirm}
          disabled={phone.length !== 8 || !operator || Number(amount) < 100 || !paymentMethod}
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
  container:{flex:1,backgroundColor:Colors.background},
  header:{paddingTop:60,paddingBottom:24,paddingHorizontal:24},
  back:{width:44,height:44,justifyContent:'center',marginBottom:12},
  hTitle:{...Typography.h2,color:Colors.white},
  hSub:{...Typography.caption,color:'rgba(255,255,255,0.7)',marginTop:4},
  content:{flex:1,paddingHorizontal:24,paddingTop:20},
  label:{...Typography.captionMedium,color:Colors.textSecondary,marginBottom:8},
  phoneRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
  cc:{flexDirection:'row',alignItems:'center',height:52,paddingHorizontal:12,borderWidth:1.5,borderColor:Colors.border,borderRadius:12,backgroundColor:Colors.surface,gap:6},
  ccTxt:{fontFamily:FontFamily.semiBold,fontSize:15,color:Colors.textPrimary},
  opDetected:{flexDirection:'row',alignItems:'center',gap:8,marginTop:10,padding:12,backgroundColor:Colors.surface,borderRadius:10},
  opText:{...Typography.caption,color:Colors.textSecondary},
  feeCard:{marginTop:16},
  feeRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8},
  feeLabel:{...Typography.caption,color:Colors.textSecondary},
  feeValue:{...Typography.bodyMedium,color:Colors.textPrimary},
  feeDivider:{height:1,backgroundColor:Colors.divider,marginVertical:4},
  bottom:{paddingHorizontal:24,paddingBottom:36},
});
