import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { OperatorBadge } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

const SettingItem = ({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <View
      style={[
        styles.settingIcon,
        danger && { backgroundColor: Colors.error + '15' },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? Colors.error : Colors.primary}
      />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && { color: Colors.error }]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors.textTertiary}
      />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)');
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de se déconnecter.');
            }
          },
        },
      ]
    );
  };

  const displayName = userProfile?.displayName || 'Utilisateur';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.phone}>
            {userProfile?.phone 
              ? `Tchad (+235) ${userProfile.phone}`
              : 'Numéro inconnu'}
          </Text>
          {userProfile?.operator && (
            <View style={{ marginTop: 8 }}>
              <OperatorBadge operator={userProfile.operator as 'airtel' | 'moov'} size="small" />
            </View>
          )}
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assistance & Légal</Text>
          <View style={styles.card}>
            <SettingItem
              icon="help-circle"
              title="Centre d'aide"
              subtitle="FAQ et contacter le support Ondo"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="document-text"
              title="Conditions d'utilisation"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-checkmark"
              title="Politique de confidentialité"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Other */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingItem
              icon="log-out"
              title="Se déconnecter"
              danger
              onPress={handleLogout}
            />
          </View>
        </View>

        <Text style={styles.version}>Version 1.0.0 (MVP)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: Layout.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: Colors.primary,
  },
  name: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  phone: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: Layout.padding.lg,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  settingSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 68,
  },
  version: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
});
