import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { reportApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const LedgerScreen: React.FC = () => {
  const { user } = useAuthStore();

  // Fetch Vendor Ledger
  const { data: ledger, isLoading, refetch } = useQuery({
    queryKey: ['vendorLedger', user?.id],
    queryFn: async () => {
      // In a real app, we'd pass user.id if multiple vendors are viewable by admin
      // For now, assuming endpoint returns logged-in user's ledger
      if (!user?.id) throw new Error('User ID not found');
      const response = await reportApi.getVendorLedger(user.id);
      return response.data.data;
    },
    enabled: !!user?.id,
  });

  const renderBalanceCard = () => (
    <GlassCard style={styles.balanceCard} glow>
      <View style={styles.balanceRow}>
        <View>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[
            styles.balanceAmount,
            (ledger?.balance || 0) >= 0 ? styles.positive : styles.negative
          ]}>
            ₹{(moneyFormatter.format(ledger?.balance || 0)).replace('₹', '')}
          </Text>
        </View>
        <Icon
          name={(ledger?.balance || 0) >= 0 ? "trending-up" : "trending-down"}
          size={32}
          color={(ledger?.balance || 0) >= 0 ? COLORS.status.success : COLORS.status.error}
        />
      </View>
      <View style={styles.balanceDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total Earned</Text>
          <Text style={styles.detailValue}>₹{ledger?.totalEarned || 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Paid Out</Text>
          <Text style={styles.detailValue}>₹{ledger?.totalPaid || 0}</Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderStockCard = () => (
    <GlassCard style={styles.stockCard}>
      <View style={styles.cardHeader}>
        <Icon name="package-variant" size={24} color={COLORS.primary.main} />
        <Text style={styles.cardTitle}>Stock Balance</Text>
      </View>
      <View style={styles.stockRow}>
        <View style={styles.stockItem}>
          <Text style={styles.stockValue}>{ledger?.boxesHeld || 0}</Text>
          <Text style={styles.stockLabel}>Empty Boxes Held</Text>
        </View>
        <View style={styles.stockDivider} />
        <View style={styles.stockItem}>
          <Text style={[styles.stockValue, { color: COLORS.accent.main }]}>
            {ledger?.boxesFilled || 0}
          </Text>
          <Text style={styles.stockLabel}>Boxes Returned</Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderTransactions = () => (
    <View>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {ledger?.transactions?.length === 0 ? (
        <GlassCard>
          <Text style={styles.emptyText}>No transactions found</Text>
        </GlassCard>
      ) : (
        ledger?.transactions?.map((tx: any, index: number) => (
          <GlassCard key={index} style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={styles.txIcon}>
                <Icon
                  name={getTxIcon(tx.type)}
                  size={20}
                  color={getTxColor(tx.type)}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txType}>{formatTxType(tx.type)}</Text>
                <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[
                styles.txAmount,
                tx.amount >= 0 ? styles.positiveText : styles.negativeText
              ]}>
                {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount)}
              </Text>
            </View>
          </GlassCard>
        ))
      )}
    </View>
  );

  const moneyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  });

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'bank-transfer-in';
      case 'LABOR_COST': return 'account-hard-hat';
      case 'FREIGHT': return 'truck-delivery';
      default: return 'circle-small';
    }
  };

  const getTxColor = (type: string) => {
    switch (type) {
      case 'PAYMENT': return COLORS.status.success;
      case 'LABOR_COST': return COLORS.accent.main;
      case 'FREIGHT': return COLORS.status.warning;
      default: return COLORS.text.secondary;
    }
  };

  const formatTxType = (type: string) => {
    return type.replace('_', ' ');
  };

  return (
    <LinearGradient
      colors={COLORS.background.gradient as string[]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Financial Ledger</Text>
          <Text style={styles.subtitle}>Track earnings & expenses</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary.main} />
            }
          >
            {renderBalanceCard()}
            {renderStockCard()}
            {renderTransactions()}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: TYPOGRAPHY.sizes['3xl'], fontWeight: 'bold', color: COLORS.text.primary },
  subtitle: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.secondary, marginTop: SPACING.xs },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },

  balanceCard: { padding: SPACING.lg, marginBottom: SPACING.lg },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  balanceLabel: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.secondary, marginBottom: SPACING.xs },
  balanceAmount: { fontSize: TYPOGRAPHY.sizes['4xl'], fontWeight: 'bold', color: COLORS.text.primary },
  positive: { color: COLORS.status.success },
  negative: { color: COLORS.status.error },

  balanceDetails: { flexDirection: 'row', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.glass.border },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginBottom: 2 },
  detailValue: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: '600', color: COLORS.text.primary },
  divider: { width: 1, backgroundColor: COLORS.glass.border, marginHorizontal: SPACING.md },

  stockCard: { padding: SPACING.lg, marginBottom: SPACING.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  cardTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: '600', color: COLORS.text.primary },
  stockRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stockItem: { alignItems: 'center' },
  stockValue: { fontSize: TYPOGRAPHY.sizes['3xl'], fontWeight: 'bold', color: COLORS.text.primary },
  stockLabel: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.secondary, marginTop: SPACING.xs },
  stockDivider: { width: 1, height: 40, backgroundColor: COLORS.glass.border },

  sectionTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: '600', color: COLORS.text.primary, marginBottom: SPACING.md },
  txCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.glass.background, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  txInfo: { flex: 1 },
  txType: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: '600', color: COLORS.text.primary, textTransform: 'capitalize' },
  txDate: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted },
  txAmount: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold' },
  positiveText: { color: COLORS.status.success },
  negativeText: { color: COLORS.text.primary },

  emptyText: { textAlign: 'center', color: COLORS.text.muted, padding: SPACING.lg },
});
