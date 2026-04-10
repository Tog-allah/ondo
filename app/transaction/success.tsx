import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { Colors } from '../../constants/Colors';
import { Typography, FontFamily } from '../../constants/Typography';

export default function SuccessScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.spring(checkAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#4CAF50', '#388E3C']} style={s.container}>
      <View style={s.content}>
        <Animated.View style={[s.circle, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
          <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
            <Ionicons name="checkmark" size={64} color={Colors.white} />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[s.textContainer, { opacity: fadeAnim, transform: [{ translateY: contentAnim }] }]}>
          <Text style={s.title}>Transaction réussie ! 🎉</Text>
          <Text style={s.subtitle}>
            Votre opération a été effectuée avec succès.
            Un reçu numérique est disponible dans votre historique.
          </Text>
        </Animated.View>

        <Animated.View style={[s.refCard, { opacity: fadeAnim, transform: [{ translateY: contentAnim }] }]}>
          <Text style={s.refLabel}>Référence</Text>
          <Text style={s.refValue}>ONDO-2026033114300001</Text>
        </Animated.View>
      </View>

      <Animated.View style={[s.bottom, { opacity: fadeAnim }]}>
        <Button
          title="Retour à l'accueil"
          onPress={() => router.replace('/(tabs)')}
          style={{ backgroundColor: Colors.white }}
          textStyle={{ color: '#388E3C' }}
        />
        <Button
          title="Voir le reçu"
          onPress={() => router.replace('/(tabs)/history')}
          variant="ghost"
          textStyle={{ color: Colors.white }}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  circle: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 32,
  },
  textContainer: { alignItems: 'center' },
  title: { ...Typography.h2, color: Colors.white, textAlign: 'center', marginBottom: 12 },
  subtitle: { ...Typography.body, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  refCard: {
    marginTop: 32, backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  refLabel: { ...Typography.small, color: 'rgba(255,255,255,0.7)' },
  refValue: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.white, marginTop: 4 },
  bottom: { paddingHorizontal: 24, paddingBottom: 40, gap: 10 },
});
