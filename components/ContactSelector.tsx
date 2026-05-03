import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography, FontFamily } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { OperatorImages } from '../constants/OperatorImages';

// ── Types ───────────────────────────────────────────────────

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  phoneRaw: string; // digits only
}

interface ContactSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (phone: string, name: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Clean a phone number to just digits, handling Chad formats.
 */
const cleanPhone = (raw: string): string => {
  let digits = raw.replace(/\D/g, '');
  // Remove country code prefixes
  if (digits.startsWith('00235')) digits = digits.slice(5);
  if (digits.startsWith('235')) digits = digits.slice(3);
  return digits;
};

/**
 * Check if a phone is a valid Chadian number (Airtel 6xx or Moov 9xx).
 */
const isChadianNumber = (digits: string): boolean => {
  return (
    digits.length === 8 &&
    (digits.startsWith('6') || digits.startsWith('9'))
  );
};

// ── Component ───────────────────────────────────────────────

export function ContactSelector({ visible, onClose, onSelect }: ContactSelectorProps) {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [filtered, setFiltered] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      setPermissionDenied(false);

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });

      // Transform and filter to only Chadian numbers
      const transformed: ContactItem[] = [];
      const seen = new Set<string>();

      for (const contact of data) {
        if (!contact.phoneNumbers) continue;

        for (const phoneEntry of contact.phoneNumbers) {
          if (!phoneEntry.number) continue;

          const raw = cleanPhone(phoneEntry.number);

          if (isChadianNumber(raw) && !seen.has(raw)) {
            seen.add(raw);
            transformed.push({
              id: `${contact.id}_${raw}`,
              name: contact.name || 'Sans nom',
              phone: raw,
              phoneRaw: raw,
            });
          }
        }
      }

      setContacts(transformed);
      setFiltered(transformed);
    } catch (err) {
      console.error('Error loading contacts:', err);
      Alert.alert('Erreur', 'Impossible de charger vos contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter contacts based on search
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(contacts);
      return;
    }

    const lower = search.toLowerCase();
    setFiltered(
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.phone.includes(search.replace(/\D/g, ''))
      )
    );
  }, [search, contacts]);

  const handleSelect = (contact: ContactItem) => {
    onSelect(contact.phoneRaw, contact.name);
    onClose();
    setSearch('');
  };

  const getOperatorColor = (phone: string) => {
    if (phone.startsWith('6')) return Colors.airtel;
    if (phone.startsWith('9')) return Colors.moov;
    return Colors.textTertiary;
  };

  const getOperatorName = (phone: string) => {
    if (phone.startsWith('6')) return 'Airtel';
    if (phone.startsWith('9')) return 'Moov';
    return '';
  };

  const getOperatorKey = (phone: string): 'airtel' | 'moov' | null => {
    if (phone.startsWith('6')) return 'airtel';
    if (phone.startsWith('9')) return 'moov';
    return null;
  };

  const formatDisplay = (phone: string) => {
    if (phone.length !== 8) return phone;
    return `${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4, 6)} ${phone.slice(6, 8)}`;
  };

  const renderItem = ({ item }: { item: ContactItem }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => handleSelect(item)}>
      <View style={[styles.avatar, { backgroundColor: getOperatorColor(item.phone) + '20' }]}>
        <Text style={[styles.avatarText, { color: getOperatorColor(item.phone) }]}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.phoneRow}>
          <Text style={styles.contactPhone}>{formatDisplay(item.phone)}</Text>
          <View style={[styles.operatorTag, { backgroundColor: getOperatorColor(item.phone) + '15' }]}>
            {getOperatorKey(item.phone) && (
              <Image
                source={OperatorImages[getOperatorKey(item.phone)!].logo}
                style={{width:14,height:14}}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.operatorTagText, { color: getOperatorColor(item.phone) }]}>
              {getOperatorName(item.phone)}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choisir un contact</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un contact..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement des contacts...</Text>
          </View>
        ) : permissionDenied ? (
          <View style={styles.centerContent}>
            <Ionicons name="lock-closed" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Permission requise</Text>
            <Text style={styles.emptyText}>
              Autorisez l'accès aux contacts dans les paramètres de votre téléphone pour utiliser cette fonctionnalité.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {search ? 'Aucun résultat' : 'Aucun contact tchadien'}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Essayez une autre recherche'
                : 'Seuls les numéros tchadiens (6xx ou 9xx) sont affichés.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <Text style={styles.resultCount}>
                {filtered.length} contact{filtered.length > 1 ? 's' : ''} tchadien{filtered.length > 1 ? 's' : ''}
              </Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Layout.padding.lg,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.padding.lg,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 40,
  },
  resultCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  contactInfo: {
    flex: 1,
    gap: 3,
  },
  contactName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  operatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  operatorTagText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Layout.padding.lg + 60,
  },
});
