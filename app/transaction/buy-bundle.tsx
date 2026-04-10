import React, { useState, useEffect } from 'react';
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
import { getBundles, Bundle } from '../../services/bundleService';

type DurationFilter = 'all' | 'jour' | 'semaine' | 'mois';

const fallbackBundles: Bundle[] = [
  { id: '1', name: '500 Mo', description: 'Internet mobile', price: 300, validity: '1 jour', category: 'data', operator: 'airtel', updatedAt: undefined as any },
  { id: '3', name: '3 Go', description: 'Internet mobile', price: 1500, validity: '7 jours', category: 'data', operator: 'airtel', updatedAt: undefined as any },
  { id: '4', name: '5 Go', description: 'Internet + Appels', price: 2500, validity: '7 jours', category: 'data', operator: 'moov', updatedAt: undefined as any },
  { id: '5', name: '10 Go', description: 'Internet mobile', price: 4000, validity: '30 jours', category: 'data', operator: 'airtel', updatedAt: undefined as any },
  { id: '6', name: '15 Go', description: 'Internet + SMS', price: 5000, validity: '30 jours', category: 'data', operator: 'moov', updatedAt: undefined as any },
];

export default function BuyBundleScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [duration, setDuration] = useState<DurationFilter>('all');
  const [opFilter, setOpFilter] = useState<'all' | 'airtel' | 'moov'>('all');
  const [showContacts, setShowContacts] = useState(false);
  const [bundles, setBundles] = useState<Bundle[]>(fallbackBundles);
  const operator = detectOperator(phone);

  useEffect(() => {
    const loadBundles = async () => {
      try {
        const fetched = await getBundles();
        if (fetched.length > 0) setBundles(fetched);
      } catch (err) {
        console.warn('Failed to load bundles, using fallback', err);
      }
    };
    loadBundles();
  }, []);

  const filtered = bundles.filter(b => {
    // Basic duration mapping heuristic
    if (duration !== 'all') {
      const val = (b.validity || '').toLowerCase();
      if (duration === 'jour' && !val.includes('jour') && !val.includes('24h') || val.includes('7 jours') || val.includes('30 jours')) return false;
      if (duration === 'semaine' && !val.includes('semaine') && !val.includes('7 jours')) return false;
      if (duration === 'mois' && !val.includes('mois') && !val.includes('30 jours')) return false;
    }
    if (opFilter !== 'all' && b.operator !== opFilter) return false;
    return true;
  });

  const bundle = bundles.find(b => b.id === selectedBundle);

  const handleConfirm = () => {
    if (!bundle || phone.length !== 8) return;
    router.push({
      pathname: '/transaction/confirm',
      params: {
        type: 'bundle', phone: CHAD_COUNTRY_CODE + phone,
        amount: bundle.price.toString(), operator: operator || bundle.operator,
        bundleName: bundle.name, bundleValidity: bundle.validity,
        useWallet: 'false', walletDeduction: '0',
      },
    });
  };

  const cats: { key: DurationFilter; label: string }[] = [
    { key: 'all', label: 'Tous' }, { key: 'jour', label: 'Jour' },
    { key: 'semaine', label: 'Semaine' }, { key: 'mois', label: 'Mois' },
  ];

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[...Gradients.header]} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.hTitle}>Acheter un Forfait</Text>
        <Text style={s.hSub}>Forfaits internet et appels</Text>
      </LinearGradient>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.label}>Numéro bénéficiaire</Text>
        <View style={s.phoneRow}>
          <View style={s.cc}><Text style={{fontSize:18}}>🇹🇩</Text><Text style={s.ccTxt}>+235</Text></View>
          <View style={{flex:1}}>
            <Input value={formatPhoneNumber(phone)} onChangeText={t => setPhone(t.replace(/\D/g,'').slice(0,8))}
              placeholder="6X XX XX XX" keyboardType="phone-pad" 
              rightIcon="people"
              onRightIconPress={() => setShowContacts(true)}
              containerStyle={{marginBottom:0}} />
          </View>
        </View>
        {operator && <View style={{marginTop:8}}><OperatorBadge operator={operator} size="small" /></View>}

        {/* Operator filter */}
        <View style={s.opRow}>
          {([['all','Tous'],['airtel','Airtel'],['moov','Moov']] as const).map(([k,l]) => (
            <TouchableOpacity key={k} onPress={() => setOpFilter(k)}
              style={[s.opBtn, opFilter===k && s.opBtnA]}>
              <Text style={[s.opTxt, opFilter===k && s.opTxtA]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
          <View style={{flexDirection:'row', gap:8}}>
            {cats.map(c => (
              <TouchableOpacity key={c.key} onPress={() => setDuration(c.key)}
                style={[s.catBtn, duration===c.key && s.catBtnA]}>
                <Text style={[s.catTxt, duration===c.key && s.catTxtA]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bundle list */}
        <View style={{gap:10, paddingBottom:20}}>
          {filtered.map(b => {
            const sel = selectedBundle === b.id;
            const c = b.operator === 'airtel' ? Colors.airtel : Colors.moov;
            return (
              <TouchableOpacity key={b.id} onPress={() => setSelectedBundle(b.id)}
                style={[s.bCard, sel && {borderColor:c, backgroundColor:c+'08'}]}>
                <View style={[s.bIcon, {backgroundColor:c+'12'}]}>
                  <Ionicons name="wifi" size={22} color={c} />
                </View>
                <View style={{flex:1}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                    <Text style={s.bName}>{b.name}</Text>
                    <Text style={[s.bOp,{color:c}]}>{b.operator==='airtel'?'Airtel':'Moov'}</Text>
                  </View>
                  <Text style={s.bDesc}>{b.description} • {b.validity}</Text>
                </View>
                <Text style={[s.bPrice,{color: sel ? c : Colors.textPrimary}]}>
                  {formatCurrency(b.price)}
                </Text>
                <View style={[s.radio, sel && {borderColor:c}]}>
                  {sel && <View style={[s.radioInner, {backgroundColor:c}]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <Button
          title={bundle ? `Acheter ${bundle.name} - ${formatCurrency(bundle.price)}` : 'Sélectionnez un forfait'}
          onPress={handleConfirm}
          disabled={!selectedBundle || phone.length !== 8}
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
  opRow:{flexDirection:'row',gap:8,marginTop:20,marginBottom:12},
  opBtn:{paddingHorizontal:14,paddingVertical:7,borderRadius:20,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.border},
  opBtnA:{backgroundColor:Colors.primary,borderColor:Colors.primary},
  opTxt:{...Typography.captionMedium,color:Colors.textSecondary},
  opTxtA:{color:Colors.white},
  catBtn:{paddingHorizontal:16,paddingVertical:6,borderRadius:16,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.borderLight},
  catBtnA:{backgroundColor:Colors.primary+'12',borderColor:Colors.primary},
  catTxt:{...Typography.captionMedium,color:Colors.textTertiary},
  catTxtA:{color:Colors.primary},
  bCard:{flexDirection:'row',alignItems:'center',padding:14,borderRadius:12,backgroundColor:Colors.surface,borderWidth:1.5,borderColor:Colors.border,gap:12},
  bIcon:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},
  bName:{...Typography.bodyMedium,color:Colors.textPrimary},
  bOp:{fontSize:10,fontFamily:FontFamily.semiBold},
  bDesc:{...Typography.small,color:Colors.textTertiary,marginTop:2},
  bPrice:{...Typography.bodyMedium},
  radio:{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:Colors.border,alignItems:'center',justifyContent:'center'},
  radioInner:{width:10,height:10,borderRadius:5},
  bottom:{paddingHorizontal:24,paddingBottom:36},
});
