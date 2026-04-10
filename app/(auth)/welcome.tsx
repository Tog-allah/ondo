import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { Colors, Gradients } from '../../constants/Colors';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const featureAnims = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.stagger(150, featureAnims.map(anim =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        })
      )),
    ]).start();
  }, []);

  const features = [
    { icon: 'swap-horizontal' as const, text: 'Achetez du crédit inter-opérateurs' },
    { icon: 'wallet' as const, text: 'Transferts d\'argent sans frais' },
    { icon: 'shield-checkmark' as const, text: 'Transactions sécurisées' },
  ];

  return (
    <LinearGradient
      colors={[...Gradients.splash]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Ondo</Text>
          <Text style={styles.tagline}>Vos transactions, zéro frais</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureRow,
                {
                  opacity: featureAnims[index],
                  transform: [
                    {
                      translateX: featureAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomSection}>
        <Button
          title="Commencer"
          onPress={() => router.push('/(auth)/phone')}
          variant="primary"
          style={{ backgroundColor: Colors.warning }}
          textStyle={{ color: Colors.white }}
        />
        <Text style={styles.disclaimer}>
          En continuant, vous acceptez nos conditions d'utilisation
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 180,
    height: 100,
    marginBottom: 20,
  },
  appName: {
    ...Typography.display,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tagline: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
  },
  featuresContainer: {
    gap: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: Layout.padding.lg,
    paddingBottom: 50,
    gap: 16,
  },
  disclaimer: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
