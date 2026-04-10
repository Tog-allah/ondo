import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography, FontFamily } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { formatCurrency } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import { Transaction, TransactionType } from '../../services/transactionService';

const FilterPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function HistoryScreen() {
  const { allTransactions, refreshTransactions, isLoadingData } = useApp();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Recharge avec la data quand le composant mount
  useEffect(() => {
    refreshTransactions();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTransactions();
    setIsRefreshing(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return { color: Colors.success, label: 'Réussi' };
      case 'pending':
        return { color: Colors.warning, label: 'En attente' };
      case 'failed':
        return { color: Colors.error, label: 'Échoué' };
      default:
        return { color: Colors.textTertiary, label: 'Inconnu' };
    }
  };

  const getTxDetails = (tx: Transaction) => {
    switch (tx.type) {
      case 'credit':
        return { icon: 'phone-portrait' as const, title: 'Recharge Crédit' };
      case 'bundle':
        return { icon: 'wifi' as const, title: 'Forfait: ' + (tx.bundleName || '') };
      case 'transfer':
        return { icon: 'swap-horizontal' as const, title: 'Transfert d\'argent' };
      default:
        return { icon: 'card' as const, title: 'Transaction' };
    }
  };

  // Format date helper for history
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  // Apply filters locally (or we could fetch dynamically)
  const filteredData = allTransactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const renderItem = ({ item }: { item: Transaction }) => {
    const details = getTxDetails(item);
    const status = getStatusConfig(item.status);
    const isCredit = item.type !== 'transfer'; // in P2P we send money (debit). But wait! For Ondo it's always spending wallet balance.

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: status.color + '15' }]}>
            <Ionicons name={details.icon} size={24} color={status.color} />
          </View>
          <View style={styles.cardHeader}>
            <Text style={styles.txTitle}>{details.title}</Text>
            <Text style={styles.txDate}>{formatDateTime(item.createdAt)}</Text>
          </View>
          <Text style={[styles.txAmount, { color: Colors.textPrimary }]}>
            -{formatCurrency(item.amount)}
          </Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottom}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destinataire</Text>
            <Text style={styles.detailValue}>{item.beneficiaryName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Statut</Text>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        
        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
            data={[
              { id: 'all', label: 'Tout' },
              { id: 'transfer', label: 'Transferts' },
              { id: 'credit', label: 'Crédit' },
              { id: 'bundle', label: 'Forfaits' },
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FilterPill
                label={item.label}
                active={filter === item.id}
                onPress={() => setFilter(item.id as TransactionType | 'all')}
              />
            )}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          isLoadingData ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={Colors.primary} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
              <Text style={styles.emptyDesc}>
                {filter === 'all'
                  ? "Vous n'avez pas encore effectué de transaction."
                  : `Aucune transaction de type "${
                      filter === 'transfer' ? 'Transferts' : filter === 'credit' ? 'Crédit' : 'Forfaits'
                    }" trouvée.`}
              </Text>
            </View>
          )
        }
      />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    paddingHorizontal: Layout.padding.lg,
    marginBottom: 16,
  },
  filtersWrapper: {
    height: 40,
  },
  filtersList: {
    paddingHorizontal: Layout.padding.lg,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Layout.padding.lg,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flex: 1,
  },
  txTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  txDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  txAmount: {
    ...Typography.h3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },
  cardBottom: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
  },
  statusText: {
    ...Typography.captionMedium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
