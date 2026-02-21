import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassSearchBar } from '../../components/glassmorphism/GlassSearchBar';
import { BatchStatusBadge } from '../../components/common/BatchStatusBadge';
import { HorizontalScrollWrapper } from '../../components/common/HorizontalScrollWrapper';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { farmApi, harvestApi } from '../../services/api';
import { Batch, GatePass } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

type TabType = 'today' | 'history';

export const GatePassScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const canSubmit = user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.MANAGER;

    const [activeTab, setActiveTab] = useState<TabType>('today');
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [historyDate, setHistoryDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const route = useRoute<any>();

    useFocusEffect(
        React.useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['allBatchesForGP'] });
            queryClient.invalidateQueries({ queryKey: ['allBatches'] }); // Update Tab Badges
            if (activeTab === 'today') {
                queryClient.invalidateQueries({ queryKey: ['todayGatePasses'] });
            }
            if (selectedBatch?.id) {
                queryClient.invalidateQueries({ queryKey: ['batchDetailsGP', selectedBatch.id] });
            }

            // Check for refresh param from CreateGatePassScreen
            if (route.params?.refresh) {
                setSelectedBatch(null);
                navigation.setParams({ refresh: undefined });
            }
        }, [selectedBatch?.id, activeTab, queryClient, route.params?.refresh])
    );

    const { data: batches = [], isLoading: batchesLoading } = useQuery({
        queryKey: ['allBatchesForGP'], // Renamed key to reflect content
        queryFn: async () => {
            const response = await farmApi.getAllBatches();
            return response.data.data; // Return ALL batches for lookup
        },
    });

    // Removed farms query as produceType should be available in batch details from getAllBatches

    const getProduceType = (batchId: string | number) => {
        const batch = batches.find((b: Batch) => b.id === batchId || b.batchId === batchId);
        return batch?.produceType;
    };

    // Derive selectable batches for the "Create Gate Pass" list
    const selectableBatches = React.useMemo(() => {
        return batches.filter((b: Batch) =>
            b.status !== 'DISPATCH_COMPLETED' &&
            b.status !== 'IN_TRANSIT' &&
            b.status !== 'DELIVERED' &&
            b.status !== 'CANCELLED'
        );
    }, [batches]);

    const filteredBatches = selectableBatches.filter((b: Batch) =>
        (b.farmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.batchId?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        b.status !== 'IN_TRANSIT' &&
        b.status !== 'DELIVERED'
    );

    const { data: batchDetails, isLoading: detailsLoading } = useQuery({
        queryKey: ['batchDetailsGP', selectedBatch?.id],
        queryFn: async () => {
            if (!selectedBatch?.id) return null;
            const response = await farmApi.getBatchById(selectedBatch.id);
            return response.data.data;
        },
        enabled: !!selectedBatch?.id,
    });

    const { data: todayGatePasses = [], isLoading: todayLoading, refetch: refetchToday } = useQuery({
        queryKey: ['todayGatePasses'],
        queryFn: async () => {
            // Use local date string to avoid server timezone mismatches
            const today = new Date().toISOString().split('T')[0];
            const response = await harvestApi.getGatePassesByDate(today);
            return response.data.data.sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        },
    });

    const { data: historyGatePasses = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery({
        queryKey: ['historyGatePasses', historyDate.toISOString().split('T')[0]],
        queryFn: async () => {
            const dateStr = historyDate.toISOString().split('T')[0];
            const response = await harvestApi.getGatePassesByDate(dateStr);
            return response.data.data;
        },
        enabled: activeTab === 'history',
    });

    const currentGatePasses = activeTab === 'today' ? todayGatePasses : historyGatePasses;
    const isReportsLoading = activeTab === 'today' ? todayLoading : historyLoading;

    const handleRefresh = async () => {
        queryClient.invalidateQueries({ queryKey: ['allBatchesForGP'] });
        if (activeTab === 'today') {
            await refetchToday();
        } else {
            await refetchHistory();
        }
    };

    const getFarmName = (batchId: string | number) => {
        const batch = batches.find((b: Batch) => b.id === batchId || b.batchId === batchId);
        return batch?.farmName || `Farm (Batch #${batchId})`;
    };

    const renderBatchItem = ({ item }: { item: Batch }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.batchCard,
                    selectedBatch?.id === item.id && styles.batchCardSelected
                ]}
                onPress={() => {
                    if (selectedBatch?.id === item.id) {
                        setSelectedBatch(null);
                    } else {
                        setSelectedBatch(item);
                    }
                }}
            >
                <View style={styles.batchCardTop}>
                    <View style={[
                        styles.batchIconContainer,
                        selectedBatch?.id === item.id && styles.batchIconSelected
                    ]}>
                        <Icon
                            name="package-variant"
                            size={20}
                            color={selectedBatch?.id === item.id ? COLORS.primary.main : COLORS.text.muted}
                        />
                    </View>
                    <BatchStatusBadge status={item.status} batch={item} style={{ transform: [{ scale: 0.8 }], alignSelf: 'flex-start' }} />
                </View>
                <Text style={[
                    styles.batchFarmName,
                    selectedBatch?.id === item.id && styles.batchTextSelected
                ]} numberOfLines={1}>
                    {item.farmName}
                </Text>
                <Text style={styles.batchCode}>#{item.batchId}</Text>
            </TouchableOpacity>
        );
    };

    const renderGatePassItem = ({ item }: { item: GatePass }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('GatePassDetails', {
                report: { ...item, farmName: item.farmName || getFarmName(item.batchId) }
            })}
            style={styles.reportCard}
        >
            <View style={styles.reportRow}>
                <View style={styles.reportMain}>
                    <Text style={styles.reportFarm}>{getFarmName(item.batchId)}</Text>
                    <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 11, color: COLORS.text.muted, marginRight: 6 }}>
                            #{batches.find(b => b.id === item.batchId)?.batchId || item.batchId}
                        </Text>
                        {getProduceType(item.batchId) && (
                            <Text style={{ fontSize: 13, color: COLORS.accent.main, fontWeight: '600', textTransform: 'uppercase', marginRight: 6 }}>
                                {getProduceType(item.batchId)}
                            </Text>
                        )}
                        <Text style={{ fontSize: 11, color: COLORS.text.muted }}>
                            {item.truckNumber}
                        </Text>
                    </View>
                </View>
                <View style={styles.reportStats}>
                    <Text style={styles.reportBoxes}>{item.totalBoxes} Boxes</Text>
                    <Text style={styles.reportTime}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <Icon name="chevron-right" size={20} color={COLORS.text.muted} />
            </View>
        </TouchableOpacity>
    );

    const batchInfo = batchDetails || selectedBatch;

    return (
        <LinearGradient
            colors={['#0F5132', '#0F2027', '#0A0F1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>Gate Pass</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleRefresh}>
                            <Icon name="refresh" size={24} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.batchSelectorSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Select Batch for Dispatch</Text>
                        <View style={styles.searchWrapper}>
                            <GlassSearchBar
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search farm or batch..."
                            />
                        </View>
                    </View>

                    {batchesLoading ? (
                        <ActivityIndicator color={COLORS.primary.main} style={{ marginVertical: SPACING.md }} />
                    ) : (
                        <HorizontalScrollWrapper
                            data={filteredBatches}
                            renderItem={renderBatchItem}
                            keyExtractor={item => item.id}
                            horizontalPadding={SPACING.lg}
                            itemGap={SPACING.md}
                            containerStyle={styles.batchSelectorContainer}
                            EmptyComponent={
                                <Text style={styles.noResultsText}>
                                    {searchQuery ? 'No batches match search' : 'No batches ready for dispatch'}
                                </Text>
                            }
                        />

                    )}
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isReportsLoading}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.primary.main}
                        />
                    }
                >
                    {/* Batch Summary Card */}
                    {selectedBatch && (
                        <GlassCard style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <View>
                                    <Text style={styles.summaryFarm}>{batchInfo.farmName}</Text>
                                    <Text style={styles.summaryBatch}>Batch #{batchInfo.batchId}</Text>
                                </View>
                                {detailsLoading && <ActivityIndicator size="small" color={COLORS.primary.main} />}
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statVal}>{batchInfo.harvestedBoxes ?? batchInfo.actualBoxes ?? 0}</Text>
                                    <Text style={styles.statLab}>Harvested</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statVal}>{batchInfo.dispatchedBoxes ?? 0}</Text>
                                    <Text style={styles.statLab}>Dispatched</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={[
                                        styles.statVal,
                                        (batchInfo.gatePassRemaining ?? ((batchInfo.harvestedBoxes ?? batchInfo.actualBoxes ?? 0) - (batchInfo.dispatchedBoxes ?? 0))) <= 10 && { color: COLORS.status.error }
                                    ]}>
                                        {batchInfo.gatePassRemaining ?? ((batchInfo.harvestedBoxes ?? batchInfo.actualBoxes ?? 0) - (batchInfo.dispatchedBoxes ?? 0))}
                                    </Text>
                                    <Text style={styles.statLab}>In Stock</Text>
                                </View>
                            </View>
                        </GlassCard>
                    )}

                    <View style={styles.sectionSpacer} />

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
                            onPress={() => setActiveTab('today')}
                        >
                            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                            onPress={() => setActiveTab('history')}
                        >
                            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'history' && (
                        <View style={styles.historySearch}>
                            <TouchableOpacity
                                style={styles.datePickerBtn}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Icon name="calendar" size={20} color={COLORS.primary.main} />
                                <Text style={styles.datePickerText}>{historyDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal
                                open={showDatePicker}
                                date={historyDate}
                                mode="date"
                                maximumDate={new Date()}
                                onConfirm={(date) => {
                                    setShowDatePicker(false);
                                    setHistoryDate(date);
                                }}
                                onCancel={() => setShowDatePicker(false)}
                            />
                        </View>
                    )}

                    {/* Reports List */}
                    <View style={styles.reportsSection}>
                        {currentGatePasses.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="truck-delivery-outline" size={48} color={COLORS.text.muted} />
                                <Text style={styles.emptyText}>No gate passes found</Text>
                            </View>
                        ) : (
                            currentGatePasses.map((item: GatePass) => (
                                <React.Fragment key={item.id}>
                                    {renderGatePassItem({ item })}
                                </React.Fragment>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* FAB (Hidden for Admins/Managers) */}
                {selectedBatch && canSubmit && (
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => navigation.navigate('CreateGatePass', { batch: batchInfo })}
                    >
                        <Icon name="plus" size={28} color="#000" />
                        <Text style={styles.fabText}>Create Gate Pass</Text>
                    </TouchableOpacity>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    batchSelectorSection: {
        paddingVertical: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'column',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.sizes.sm,
        fontWeight: 'bold',
        color: COLORS.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    searchWrapper: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    batchSelectorContainer: {
        paddingVertical: 4,
    },
    batchList: {
        alignItems: 'center',
    },
    batchCard: {
        width: 160,
        padding: SPACING.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    batchCardSelected: {
        backgroundColor: 'rgba(57, 255, 20, 0.08)',
        borderColor: 'rgba(57, 255, 20, 0.3)',
    },
    batchCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    batchIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    batchIconSelected: {
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
    },
    batchFarmName: {
        fontSize: TYPOGRAPHY.sizes.sm,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    batchTextSelected: {
        color: COLORS.primary.main,
    },
    batchCode: {
        fontSize: 10,
        color: COLORS.text.muted,
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    noResultsText: {
        color: COLORS.text.muted,
        fontSize: TYPOGRAPHY.sizes.sm,
        fontStyle: 'italic',
        marginLeft: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 100,
    },
    summaryCard: {
        padding: SPACING.lg,
        marginTop: SPACING.md,
        backgroundColor: 'rgba(57, 255, 20, 0.03)',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    summaryFarm: {
        fontSize: TYPOGRAPHY.sizes.lg,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    summaryBatch: {
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.text.muted,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: SPACING.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statBox: {
        alignItems: 'center',
    },
    statVal: {
        fontSize: TYPOGRAPHY.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    statLab: {
        fontSize: 10,
        color: COLORS.text.muted,
        textTransform: 'uppercase',
    },
    sectionSpacer: {
        height: SPACING.xl,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BORDER_RADIUS.lg,
        padding: 4,
        marginBottom: SPACING.md,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
    },
    activeTab: {
        backgroundColor: 'rgba(57, 255, 20, 0.15)',
    },
    tabText: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.muted,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.primary.main,
    },
    historySearch: {
        marginBottom: SPACING.md,
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    datePickerText: {
        color: COLORS.text.primary,
        fontSize: TYPOGRAPHY.sizes.sm,
    },
    reportsSection: {
        gap: SPACING.md,
    },
    reportCard: {
        padding: SPACING.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    reportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    reportMain: {
        flex: 1,
    },
    reportFarm: {
        fontSize: TYPOGRAPHY.sizes.md,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    reportBatch: {
        fontSize: 12,
        color: COLORS.text.muted,
    },
    reportStats: {
        alignItems: 'flex-end',
        marginRight: SPACING.sm,
    },
    reportBoxes: {
        fontSize: TYPOGRAPHY.sizes.md,
        fontWeight: 'bold',
        color: COLORS.primary.main,
    },
    reportTime: {
        fontSize: 10,
        color: COLORS.text.muted,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        color: COLORS.text.muted,
        marginTop: SPACING.sm,
        fontSize: TYPOGRAPHY.sizes.sm,
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.lg,
        backgroundColor: COLORS.primary.main,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 30,
        elevation: 8,
        shadowColor: COLORS.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        gap: SPACING.sm,
    },
    fabText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: TYPOGRAPHY.sizes.md,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 16,
        height: 50,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.primary,
        paddingVertical: SPACING.md,
    },
});
