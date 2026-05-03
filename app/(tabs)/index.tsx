import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  FlatList,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components';
import { Colors, Gradients } from '../../constants/Colors';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout, Shadows } from '../../constants/Layout';
import { formatCurrency } from '../../constants';
import { OperatorImages } from '../../constants/OperatorImages';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type Timestamp = FirebaseFirestoreTypes.Timestamp;

const { width } = Dimensions.get('window');

// Helper to format Firestore timestamps
const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Aujourd'hui, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    if (hours < 48) return `Hier, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const {
    recentTransactions,
    recentBeneficiaries,
    refreshAll,
    isLoadingData,
  } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const quickActions = [
    {
      id: 'credit',
      icon: 'phone-portrait' as const,
      label: 'Acheter\nCrédit',
      color: Colors.primary,
      bgColor: Colors.surfaceWarm,
      route: '/transaction/buy-credit',
      enabled: true,
    },
    {
      id: 'bundle',
      icon: 'wifi' as const,
      label: 'Acheter\nForfait',
      color: Colors.accent,
      bgColor: Colors.accent + '15',
      route: '/transaction/buy-bundle',
      enabled: true,
    },
    {
      id: 'transfer',
      icon: 'swap-horizontal' as const,
      label: 'Transférer\nArgent',
      color: Colors.textTertiary,
      bgColor: Colors.borderLight,
      route: '/transaction/transfer',
      enabled: false, // Coming Soon
    },
    {
      id: 'bill',
      icon: 'document-text' as const,
      label: 'Payer\nFacture',
      color: Colors.textTertiary,
      bgColor: Colors.borderLight,
      route: '/transaction/buy-credit',
      enabled: false, // Coming Soon
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return { color: Colors.success, icon: 'checkmark-circle' as const, label: 'Réussi' };
      case 'pending':
        return { color: Colors.warning, icon: 'time' as const, label: 'En attente' };
      case 'failed':
        return { color: Colors.error, icon: 'close-circle' as const, label: 'Échoué' };
      default:
        return { color: Colors.textTertiary, icon: 'help-circle' as const, label: 'Inconnu' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit': return 'phone-portrait' as const;
      case 'bundle': return 'wifi' as const;
      case 'transfer': return 'swap-horizontal' as const;
      default: return 'card' as const;
    }
  };

  // Extract display name and first name
  const displayName = userProfile?.displayName || 'Utilisateur';
  const firstName = displayName.split(' ')[0];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoadingData}
          onRefresh={refreshAll}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={[...Gradients.header]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.white} />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        {/* Promo Banner */}
        <Animated.View
          style={[
            styles.promoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>🇹🇩 100% Sans Frais</Text>
            <Text style={styles.promoDesc}>
              Crédit et forfaits Airtel & Moov Africa. Zéro frais cachés, toujours.
            </Text>
            <View style={styles.promoLogos}>
              <Image source={OperatorImages.airtel.logo} style={styles.promoLogoImg} resizeMode="contain" />
              <Image source={OperatorImages.moov.logo} style={styles.promoLogoImg} resizeMode="contain" />
            </View>
          </View>
          <View style={styles.promoIcon}>
            <Ionicons name="flash" size={32} color={Colors.primary} />
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, !action.enabled && styles.actionCardDisabled]}
              activeOpacity={action.enabled ? 0.7 : 1}
              onPress={() => action.enabled && router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon} size={26} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, !action.enabled && styles.actionLabelDisabled]}>
                {action.label}
              </Text>
              {!action.enabled && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Bientôt</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Beneficiaries */}
      {recentBeneficiaries.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bénéficiaires récents</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={recentBeneficiaries}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Layout.padding.lg, gap: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.beneficiaryItem}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        item.operator === 'airtel'
                          ? Colors.airtel + '15'
                          : Colors.moov + '15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      {
                        color:
                          item.operator === 'airtel' ? Colors.airtel : Colors.moov,
                      },
                    ]}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.beneficiaryName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Image
                  source={OperatorImages[item.operator as 'airtel' | 'moov']?.logo}
                  style={styles.operatorLogo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique récent</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length > 0 ? (
          <Card style={{ marginHorizontal: Layout.padding.lg }}>
            {recentTransactions.map((tx, index) => {
              const statusConfig = getStatusConfig(tx.status);
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[
                    styles.txRow,
                    index < recentTransactions.length - 1 && styles.txBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: statusConfig.color + '15' },
                    ]}
                  >
                    <Ionicons
                      name={getTypeIcon(tx.type)}
                      size={20}
                      color={statusConfig.color}
                    />
                  </View>
                  <View style={styles.txContent}>
                    <Text style={styles.txBeneficiary}>{tx.beneficiaryName}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>
                      -{formatCurrency(tx.amount)}
                    </Text>
                    <View style={styles.txStatus}>
                      <Ionicons
                        name={statusConfig.icon}
                        size={12}
                        color={statusConfig.color}
                      />
                      <Text
                        style={[styles.txStatusText, { color: statusConfig.color }]}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
        ) : (
          <View style={styles.emptyTx}>
            <Ionicons name="receipt-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTxText}>Aucune transaction pour le moment</Text>
            <Text style={styles.emptyTxSub}>
              Vos transactions apparaîtront ici
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: Layout.padding.lg,
    borderBottomLeftRadius: Layout.radius.xl,
    borderBottomRightRadius: Layout.radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    ...Typography.h2,
    color: Colors.white,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  // Promo card replaces wallet card
  promoCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.lg,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  promoDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  promoLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  promoLogoImg: {
    width: 28,
    height: 28,
  },
  promoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.padding.lg,
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    paddingHorizontal: Layout.padding.lg,
    marginBottom: 12,
  },
  seeAll: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.padding.lg,
    gap: 12,
  },
  actionCard: {
    width: (width - 48 - 12) / 2 - 6,
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: 16,
    alignItems: 'flex-start',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionCardDisabled: {
    opacity: 0.65,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  actionLabelDisabled: {
    color: Colors.textTertiary,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  comingSoonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 9,
    color: Colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  beneficiaryItem: {
    alignItems: 'center',
    width: 64,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
  },
  beneficiaryName: {
    ...Typography.small,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  operatorLogo: {
    width: 16,
    height: 16,
    marginTop: 4,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  txBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txContent: {
    flex: 1,
  },
  txBeneficiary: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  txDate: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  txStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  txStatusText: {
    ...Typography.small,
  },
  emptyTx: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: Layout.padding.lg,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    gap: 8,
  },
  emptyTxText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  emptyTxSub: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
