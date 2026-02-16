import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { reportApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <GlassCard style={styles.statCard}>
    <View style={styles.statIconContainer}>
      <View style={[styles.statIconCircle, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </GlassCard>
);

export const DashboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      // Also refresh batch/farm lists so that if user navigates to them next, they are fresh-er
      // or to ensure any cached counts in other components are updated if they share keys
      queryClient.invalidateQueries({ queryKey: ['allBatches'] });
      queryClient.invalidateQueries({ queryKey: ['pendingInspections'] });
    }, [queryClient])
  );
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await reportApi.getDashboardStats();
      return response.data.data;
    },
  });

  const renderAdminDashboard = () => (
    <>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Farms"
          value={stats?.totalFarms || 0}
          icon="map-marker"
          color={COLORS.primary.main}
        />
        <StatCard
          title="Total Batches"
          value={stats?.totalBatches || 0}
          icon="package-variant"
          color={COLORS.accent.main}
        />
        <StatCard
          title="Active Batches"
          value={stats?.activeBatches || 0}
          icon="progress-clock"
          color={COLORS.status.warning}
        />
        <StatCard
          title="Completed"
          value={stats?.completedBatches || 0}
          icon="check-circle"
          color={COLORS.status.success}
        />
      </View>

      {/* Revenue Card */}
      <GlassCard style={styles.revenueCard} glow>
        <Text style={styles.revenueTitle}>Total Revenue</Text>
        <Text style={styles.revenueValue}>
          ₹{(stats?.totalRevenue || 0).toLocaleString()}
        </Text>
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Total Profit</Text>
            <Text style={[styles.revenueAmount, { color: COLORS.status.success }]}>
              ₹{(stats?.totalProfit || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Avg Cost/Box</Text>
            <Text style={styles.revenueAmount}>
              ₹{(stats?.averageCostPerBox || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Inventory Overview */}
      <GlassCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Icon name="warehouse" size={20} color={COLORS.primary.main} />
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
        </View>
        <View style={styles.inventoryRow}>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryValue}>{stats?.totalBoxesInStock || 0}</Text>
            <Text style={styles.inventoryLabel}>Empty Boxes</Text>
          </View>
          <View style={styles.inventoryDivider} />
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryValue}>{stats?.totalFilledBoxes || 0}</Text>
            <Text style={styles.inventoryLabel}>Filled Boxes</Text>
          </View>
        </View>
      </GlassCard>
    </>
  );

  const renderVendorDashboard = () => (
    <>
      <GlassCard style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Hello, {user?.fullName}!</Text>
        <Text style={styles.welcomeSubtitle}>
          Ready to start your farm inspection today?
        </Text>
        <View style={styles.quickActions}>
          <View style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.primary.main}20` }]}>
              <Icon name="camera" size={24} color={COLORS.primary.main} />
            </View>
            <Text style={styles.quickActionText}>New Inspection</Text>
          </View>
          <View style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.accent.main}20` }]}>
              <Icon name="basket" size={24} color={COLORS.accent.main} />
            </View>
            <Text style={styles.quickActionText}>Daily Report</Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Icon name="calendar-today" size={20} color={COLORS.primary.main} />
          <Text style={styles.sectionTitle}>Today's Activity</Text>
        </View>
        <Text style={styles.emptyText}>No activity recorded today</Text>
      </GlassCard>
    </>
  );

  return (
    <LinearGradient
      colors={COLORS.background.gradient as string[]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good Day!</Text>
              <Text style={styles.userName}>{user?.fullName}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role.replace('_', ' ')}</Text>
            </View>
          </View>

          {/* Role-based Dashboard */}
          {user?.role === UserRole.VENDOR ? renderVendorDashboard() : renderAdminDashboard()}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  roleBadge: {
    backgroundColor: COLORS.glass.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  roleText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary.main,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    padding: SPACING.md,
  },
  statIconContainer: {
    marginBottom: SPACING.sm,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  statSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.muted,
    marginTop: SPACING.xs,
  },
  revenueCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  revenueTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  revenueValue: {
    fontSize: TYPOGRAPHY.sizes['4xl'],
    fontWeight: 'bold',
    color: COLORS.primary.main,
    marginBottom: SPACING.md,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueItem: {
    flex: 1,
  },
  revenueDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.glass.border,
    marginHorizontal: SPACING.md,
  },
  revenueLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs,
  },
  revenueAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  sectionCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inventoryItem: {
    flex: 1,
    alignItems: 'center',
  },
  inventoryDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.glass.border,
  },
  inventoryValue: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: 'bold',
    color: COLORS.accent.main,
  },
  inventoryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  welcomeCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.muted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
});
