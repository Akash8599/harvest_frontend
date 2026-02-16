import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { BatchStatusBadge } from '../../components/common/BatchStatusBadge';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { farmApi } from '../../services/api';
import { Batch, FarmInspection, BatchStatus } from '../../types';

type TabType = 'active' | 'completed' | 'inspections';

import { useNavigation } from '@react-navigation/native';

export const BatchesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Fetch Batches
  const { data: batches, isLoading: batchesLoading, refetch: refetchBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await farmApi.getAllBatches();
      console.log('Batch Response Sample:', response.data.data?.[0]); // Debugging
      return response.data.data;
    },
  });

  // Fetch Pending Inspections
  const { data: inspections, isLoading: inspectionsLoading, refetch: refetchInspections } = useQuery({
    queryKey: ['pendingInspections'],
    queryFn: async () => {
      const response = await farmApi.getPendingInspections();
      return response.data.data;
    },
    enabled: activeTab === 'inspections',
  });

  // Removed farms query as produceType should be available in batch details from getAllBatches

  // Approve Inspection Mutation
  const approveInspectionMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      farmApi.approveInspection(id, { approved }),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Inspection Processed',
        text2: 'Inspection status updated successfully.',
      });
      // Sync invalidations with InspectionsScreen
      queryClient.invalidateQueries({ queryKey: ['pendingInspections'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['myInspectionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      // queryClient.invalidateQueries({ queryKey: ['farms'] }); // No longer needed
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    },
  });

  const handleApprove = (id: string) => {
    Alert.alert(
      'Approve Inspection',
      'Approve and create batch?', // Shortened for cleaner UI
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => approveInspectionMutation.mutate({ id, approved: true })
        },
      ]
    );
  };

  const handleReject = (id: string) => {
    Alert.alert(
      'Reject Inspection',
      'Are you sure you want to reject this inspection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => approveInspectionMutation.mutate({ id, approved: false })
        },
      ]
    );
  };

  const renderBatchItem = ({ item }: { item: Batch }) => {
    const produceType = item.produceType || 'N/A';

    return (
      <TouchableOpacity onPress={() => navigation.navigate('BatchLifecycle', { batch: item })}>
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Icon name="package-variant" size={24} color={COLORS.primary.main} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.farmName}>{item.farmName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.batchId, { fontSize: 11, color: COLORS.text.muted }]}>#{item.batchId}</Text>
                <View style={{ width: 1, height: 12, backgroundColor: COLORS.glass.border }} />
                <Text style={[styles.batchId, { color: COLORS.accent.main, fontWeight: '600', fontSize: 13, textTransform: 'uppercase' }]}>
                  {produceType}
                </Text>
              </View>
            </View>
            <BatchStatusBadge status={item.status} batch={item} />
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Estimated</Text>
              <Text style={styles.detailValue}>{item.estimatedBoxes} Boxes</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Filled</Text>
              <Text style={styles.detailValue}>{item.actualBoxes || 0} Boxes</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderInspectionItem = ({ item }: { item: FarmInspection }) => (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, styles.inspectionIcon]}>
          <Icon name="clipboard-check" size={24} color={COLORS.accent.main} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.farmName}>{item.farmName}</Text>
          <Text style={styles.batchId}>Vendor: {item.vendorName}</Text>
        </View>
      </View>

      <Text style={styles.inspectionNote}>
        Est. {item.estimatedBoxes} boxes • {new Date(item.createdAt).toLocaleDateString()}
      </Text>

      {/* Approve/Reject Buttons */}
      <View style={styles.actionButtons}>
        <GlassButton
          title="Reject"
          onPress={() => handleReject(item.id)}
          variant="secondary"
          size="sm"
          style={styles.rejectBtn}
          loading={approveInspectionMutation.isPending}
        />
        <GlassButton
          title="Approve"
          onPress={() => handleApprove(item.id)}
          variant="primary"
          size="sm"
          style={styles.approveBtn}
          loading={approveInspectionMutation.isPending}
        />
      </View>
    </GlassCard>
  );

  const [searchQuery, setSearchQuery] = useState('');

  const getFilteredData = () => {
    let data: any[] = [];
    if (activeTab === 'inspections') {
      data = inspections || [];
    } else if (batches) {
      data = batches.filter((b: Batch) => {
        if (activeTab === 'active') {
          return (
            b.status === BatchStatus.CREATED ||
            b.status === BatchStatus.HARVEST_IN_PROGRESS ||
            b.status === BatchStatus.HARVEST_COMPLETED ||
            b.status === BatchStatus.DISPATCH_IN_PROGRESS
          );
        }
        if (activeTab === 'completed') {
          return b.status === BatchStatus.DISPATCH_COMPLETED;
        }
        return true;
      });
    }

    if (!searchQuery) return data;

    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((item: any) => {
      // Check Batch ID or Farm Name
      if ('batchId' in item && item.batchId?.toLowerCase().includes(lowerQuery)) return true;
      if ('farmName' in item && item.farmName?.toLowerCase().includes(lowerQuery)) return true;
      // Check Inspection fields
      if ('vendorName' in item && item.vendorName?.toLowerCase().includes(lowerQuery)) return true;
      return false;
    });
  };

  const currentData = getFilteredData();
  const isLoading = activeTab === 'inspections' ? inspectionsLoading : batchesLoading;
  const refetch = activeTab === 'inspections' ? refetchInspections : refetchBatches;

  return (
    <LinearGradient
      colors={COLORS.background.gradient as string[]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Production Batches</Text>
          <Text style={styles.subtitle}>Track active harvest jobs</Text>
        </View>

        <View style={styles.searchContainer}>
          <GlassInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Batch ID, Farm, or Vendor..."
            icon={<Icon name="magnify" size={20} color={COLORS.text.muted} />}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inspections' && styles.activeTab]}
            onPress={() => setActiveTab('inspections')}
          >
            <Text style={[styles.tabText, activeTab === 'inspections' && styles.activeTabText]}>Pending</Text>
            {/* Badge for pending count could go here */}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
          </View>
        ) : (
          <FlatList
            data={currentData as any[]}
            renderItem={(activeTab === 'inspections' ? renderInspectionItem : renderBatchItem) as any}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary.main} />
            }
            ListEmptyComponent={
              <GlassCard style={styles.emptyCard}>
                <Icon name="playlist-remove" size={48} color={COLORS.text.muted} />
                <Text style={styles.emptyText}>No items found</Text>
                <Text style={styles.emptySubtext}>
                  {activeTab === 'inspections' ? 'No pending inspections.' : 'No active batches at the moment.'}
                </Text>
              </GlassCard>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.background,
  },
  activeTab: {
    backgroundColor: COLORS.primary.main,
    borderColor: COLORS.primary.main,
  },
  tabText: {
    color: COLORS.text.secondary,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  activeTabText: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  inspectionIcon: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  headerText: {
    flex: 1,
  },
  batchId: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
    color: COLORS.text.muted,
  },
  farmName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  inspectionNote: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  rejectBtn: {
    minWidth: 80,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: COLORS.status.error,
  },
  approveBtn: {
    minWidth: 80,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.muted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
