import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components';
import { Colors, Gradients } from '../../constants/Colors';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { formatCurrency } from '../../constants';

const deals = [
  { id: '1', title: 'Forfait Weekend', desc: '3 Go pour tout le weekend', op: 'airtel' as const, price: 1000, orig: 1500, badge: 'Populaire', validity: '2 jours', icon: 'wifi' as const },
  { id: '2', title: 'Bonus Crédit x2', desc: 'Recevez le double de votre recharge', op: 'moov' as const, price: 500, orig: null, badge: 'Nouveau', validity: '24h', icon: 'gift' as const },
  { id: '3', title: 'Pack Nuit Illimité', desc: 'Internet illimité de 23h à 6h', op: 'airtel' as const, price: 200, orig: 500, badge: '-60%', validity: '1 nuit', icon: 'moon' as const },
  { id: '4', title: 'Forfait Mensuel Pro', desc: '15 Go + 100 min d\'appels', op: 'moov' as const, price: 5000, orig: 7000, badge: 'Best Value', validity: '30 jours', icon: 'briefcase' as const },
  { id: '5', title: 'Pack Social', desc: 'WhatsApp + Facebook illimités', op: 'airtel' as const, price: 300, orig: null, badge: 'Trending', validity: '7 jours', icon: 'chatbubbles' as const },
];

export default function DealsScreen() {
  const [selOp, setSelOp] = useState<'all' | 'airtel' | 'moov'>('all');
  const filtered = deals.filter(d => selOp === 'all' || d.op === selOp);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[...Gradients.header]} style={s.header}>
        <Text style={s.hTitle}>Good Deals 🔥</Text>
        <Text style={s.hSub}>Les meilleures offres du moment</Text>
      </LinearGradient>

      <View style={s.filterRow}>
        {([['all','Tous'],['airtel','Airtel'],['moov','Moov Africa']] as const).map(([k,l]) => (
          <TouchableOpacity key={k} onPress={() => setSelOp(k)} style={[s.fBtn, selOp===k && s.fBtnA]}>
            <Text style={[s.fTxt, selOp===k && s.fTxtA]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length > 0 && (
        <View style={{paddingHorizontal:24, marginBottom:20}}>
          <LinearGradient
            colors={filtered[0].op==='airtel' ? [Colors.airtel,'#CC0000'] : [Colors.moov,'#0088B5']}
            style={s.feat} start={{x:0,y:0}} end={{x:1,y:1}}>
            <View style={s.featBadge}><Text style={s.featBadgeTxt}>⭐ Offre vedette</Text></View>
            <Text style={s.featTitle}>{filtered[0].title}</Text>
            <Text style={s.featDesc}>{filtered[0].desc}</Text>
            <View style={s.featBottom}>
              <Text style={s.featPrice}>{formatCurrency(filtered[0].price)}</Text>
              {filtered[0].orig && <Text style={s.featOrig}>{formatCurrency(filtered[0].orig)}</Text>}
            </View>
            <TouchableOpacity style={s.featBtn}>
              <Text style={s.featBtnTxt}>En profiter</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      <View style={{paddingHorizontal:24, gap:10, paddingBottom:30}}>
        {filtered.slice(1).map(d => {
          const c = d.op==='airtel' ? Colors.airtel : Colors.moov;
          return (
            <Card key={d.id} padding="none">
              <TouchableOpacity style={s.dRow}>
                <View style={[s.dIcon,{backgroundColor:c+'12'}]}>
                  <Ionicons name={d.icon} size={24} color={c} />
                </View>
                <View style={{flex:1}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                    <Text style={s.dTitle}>{d.title}</Text>
                    <View style={[s.dBadge,{backgroundColor:c+'15'}]}>
                      <Text style={[s.dBadgeTxt,{color:c}]}>{d.badge}</Text>
                    </View>
                  </View>
                  <Text style={s.dDesc}>{d.desc}</Text>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8}}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
                      <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                      <Text style={s.dVal}>{d.validity}</Text>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                      {d.orig && <Text style={s.dOrig}>{formatCurrency(d.orig)}</Text>}
                      <Text style={[s.dPrice,{color:c}]}>{formatCurrency(d.price)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:Colors.background},
  header:{paddingTop:60,paddingBottom:24,paddingHorizontal:24},
  hTitle:{...Typography.h2,color:Colors.white},
  hSub:{...Typography.body,color:'rgba(255,255,255,0.7)',marginTop:4},
  filterRow:{flexDirection:'row',paddingHorizontal:24,paddingVertical:16,gap:8},
  fBtn:{paddingHorizontal:16,paddingVertical:8,borderRadius:20,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.border},
  fBtnA:{backgroundColor:Colors.primary,borderColor:Colors.primary},
  fTxt:{...Typography.captionMedium,color:Colors.textSecondary},
  fTxtA:{color:Colors.white},
  feat:{borderRadius:16,padding:20},
  featBadge:{alignSelf:'flex-start',backgroundColor:'rgba(255,255,255,0.2)',paddingHorizontal:12,paddingVertical:4,borderRadius:20,marginBottom:16},
  featBadgeTxt:{...Typography.small,color:Colors.white},
  featTitle:{...Typography.h3,color:Colors.white},
  featDesc:{...Typography.body,color:'rgba(255,255,255,0.8)',marginTop:4},
  featBottom:{flexDirection:'row',alignItems:'center',gap:8,marginTop:12},
  featPrice:{fontFamily:FontFamily.bold,fontSize:22,color:Colors.white},
  featOrig:{...Typography.caption,color:'rgba(255,255,255,0.6)',textDecorationLine:'line-through'},
  featBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.2)',paddingVertical:12,borderRadius:12,gap:8,marginTop:16},
  featBtnTxt:{...Typography.button,color:Colors.white},
  dRow:{flexDirection:'row',padding:14,gap:12},
  dIcon:{width:52,height:52,borderRadius:16,alignItems:'center',justifyContent:'center'},
  dTitle:{...Typography.bodyMedium,color:Colors.textPrimary},
  dBadge:{paddingHorizontal:8,paddingVertical:2,borderRadius:8},
  dBadgeTxt:{fontSize:10,fontFamily:FontFamily.semiBold},
  dDesc:{...Typography.small,color:Colors.textSecondary,marginTop:2},
  dVal:{...Typography.small,color:Colors.textTertiary},
  dOrig:{...Typography.small,color:Colors.textTertiary,textDecorationLine:'line-through'},
  dPrice:{...Typography.bodyMedium},
});
