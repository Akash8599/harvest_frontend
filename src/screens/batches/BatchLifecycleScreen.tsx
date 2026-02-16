import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    LayoutAnimation,
    Platform,
    UIManager,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { BatchStatusBadge } from '../../components/common/BatchStatusBadge';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { farmApi, harvestApi } from '../../services/api';
import { Batch, BatchStatus } from '../../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const BatchLifecycleScreen: React.FC = () => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const route = useRoute<any>();
    const { batch } = route.params || {};

    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);

    // Fetch Batch Details
    const { data: batchDetails, isLoading: batchLoading } = useQuery({
        queryKey: ['batch', batch?.id],
        queryFn: (() => farmApi.getBatchById(batch?.id).then(res => res.data.data)),
        initialData: batch,
    });

    // Fetch Harvest Reports
    const { data: harvestReports } = useQuery({
        queryKey: ['batchHarvest', batch?.id],
        queryFn: () => harvestApi.getBatchReports(batch?.id).then(res => res.data.data),
        enabled: !!batch?.id,
    });

    // Fetch Gate Passes
    const { data: gatePasses } = useQuery({
        queryKey: ['batchGatePasses', batch?.id],
        queryFn: () => harvestApi.getBatchGatePasses(batch?.id).then(res => res.data.data),
        enabled: !!batch?.id,
    });

    // Fetch Inspection Details
    const { data: inspectionDetails } = useQuery({
        queryKey: ['batchInspection', batch?.inspectionId],
        queryFn: () => farmApi.getInspectionById(batch?.inspectionId).then(res => res.data.data),
        enabled: !!batch?.inspectionId,
    });

    const activeBatch: Batch = batchDetails || batch;

    if (!activeBatch) return null;

    // ... (rest of render code)

    // In render:
    <View style={{ alignItems: 'center' }}>
        <BatchStatusBadge status={activeBatch.status} />
        {activeBatch.produceType && (
            <Text style={[styles.batchCode, { color: COLORS.accent.main, fontWeight: '600', marginTop: 4 }]}>
                Item: {activeBatch.produceType}
            </Text>
        )}
    </View>

    // Helper: Details Modal
    const openModal = (title: string, content: React.ReactNode) => {
        setModalContent({ title, content });
        setModalVisible(true);
    };

    const renderDetailModal = () => (
        <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <GlassCard style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{modalContent?.title}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {modalContent?.content}
                        </ScrollView>
                    </GlassCard>
                </View>
            </View>
        </Modal>
    );

    // --- Actions ---

    const handleCompleteHarvest = () => {
        // Validation: Check for remaining boxes
        const remaining = Math.max(0, (activeBatch.estimatedBoxes || 0) - totalHarvested);

        const title = remaining > 0 ? "Early Completion Warning" : "Complete Harvest?";
        const message = remaining > 0
            ? `You are marking this batch complete with ${remaining} boxes fewer than allocated. This will close the batch and skip the remaining harvest. Confirm?`
            : "Are you sure you want to mark this batch as Harvest Completed? This will lock the batch from further harvest reports.";

        Alert.alert(
            title,
            message,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: remaining > 0 ? "Yes, Complete Early" : "Yes, Complete",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await farmApi.updateBatchStatus(activeBatch.id, 'HARVEST_COMPLETED');
                            Toast.show({ type: 'success', text1: 'Batch Marked as Completed' });
                            queryClient.invalidateQueries({ queryKey: ['batch', batch?.id] });
                            queryClient.invalidateQueries({ queryKey: ['activeBatches'] });
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Failed to update status' });
                        }
                    }
                }
            ]
        );
    };

    // --- Timeline Renderer ---

    const renderTimelineStep = (
        title: string,
        icon: string,
        status: string,
        statusColor: string,
        date: string | undefined,
        previewContent: React.ReactNode,
        fullContent: React.ReactNode,
        isLast: boolean = false
    ) => (
        <View style={styles.timelineRow}>
            {/* Left Column: Icon + Vertical Line */}
            <View style={styles.timelineLeft}>
                <View style={[styles.iconCircle, { backgroundColor: statusColor + '20' }]}>
                    <Icon name={icon} size={20} color={statusColor} />
                </View>
                {!isLast && <View style={[styles.verticalLine, { backgroundColor: COLORS.glass.border }]} />}
            </View>

            {/* Right Column: Card Content */}
            <View style={styles.timelineRight}>
                <TouchableOpacity onPress={() => openModal(title, fullContent)}>
                    <GlassCard style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.stepTitle} numberOfLines={2}>{title}</Text>
                                {date && <Text style={styles.stepDate}>{new Date(date).toLocaleDateString()}</Text>}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                                <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1} ellipsizeMode="tail">{status}</Text>
                            </View>
                        </View>

                        <View style={styles.stepBody}>
                            {previewContent}
                            <View style={styles.tapPrompt}>
                                <Text style={styles.tapPromptText}>Tap for details</Text>
                                <Icon name="chevron-right" size={16} color={COLORS.text.muted} />
                            </View>
                        </View>
                    </GlassCard>
                </TouchableOpacity>
            </View>
        </View>
    );

    // --- Content Data ---

    const renderInspectionContent = () => {
        const inspection = inspectionDetails;
        const inspectionDate = inspection?.createdAt || activeBatch.startDate;
        const inspector = inspection?.vendorName || (activeBatch.inspectionId ? "Loading..." : "No Inspection Linked");
        const notes = inspection?.inspectionNotes || "No notes available.";

        return (
            <View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Inspector</Text>
                    <Text style={styles.detailValue}>{inspector}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{new Date(inspectionDate).toLocaleDateString()}</Text>
                </View>
                <View style={{ marginTop: SPACING.sm }}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailText}>{notes}</Text>
                </View>
                {inspection?.photoUrls && inspection.photoUrls.length > 0 && (
                    <View style={{ marginTop: SPACING.md }}>
                        <Text style={[styles.detailLabel, { marginBottom: SPACING.xs }]}>Photos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {inspection.photoUrls.map((url: string, index: number) => (
                                <View key={index} style={styles.thumbPlaceholder}>
                                    <Image source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    // Harvest Data
    const totalHarvested = harvestReports?.reduce((acc: number, curr: any) => acc + (curr.boxesPacked || 0), 0) || 0;
    const estimated = activeBatch.estimatedBoxes || 0;
    const progress = estimated > 0 ? (totalHarvested / estimated) : 0;
    const percent = Math.min(progress * 100, 100).toFixed(0);

    const harvestFullContent = (
        <View>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Completion</Text>
                    <Text style={styles.progressValue}>{percent}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: COLORS.primary.main } as any]} />
                </View>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <Text style={styles.statVal}>{totalHarvested}</Text>
                    <Text style={styles.statLab}>Harvested</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statVal}>{estimated}</Text>
                    <Text style={styles.statLab}>Estimated</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statVal}>{Math.max(0, estimated - totalHarvested)}</Text>
                    <Text style={styles.statLab}>Remaining</Text>
                </View>
            </View>

            {/* Recent Reports List (Preview) */}
            <View style={{ marginTop: SPACING.md }}>
                <Text style={styles.subSectionTitle}>Recent Reports</Text>
                {harvestReports?.map((report: any, index: number) => (
                    <View key={index} style={styles.miniListRow}>
                        <Text style={styles.miniListText}>{new Date(report.createdAt).toLocaleDateString()}</Text>
                        <Text style={[styles.miniListText, { fontWeight: 'bold' }]}>{report.boxesPacked} Boxes</Text>
                    </View>
                ))}
                {(!harvestReports || harvestReports.length === 0) && <Text style={styles.emptyText}>No harvest reports yet.</Text>}
            </View>
        </View>
    );

    // Dispatch Data
    const totalDispatched = gatePasses?.reduce((acc: number, curr: any) => acc + (curr.totalBoxes || 0), 0) || 0;

    const dispatchFullContent = (
        <View>
            <View style={{ marginTop: SPACING.xs }}>
                {gatePasses?.map((gp: any, index: number) => (
                    <GlassCard key={index} style={{ marginBottom: SPACING.sm, padding: SPACING.md, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        {/* Header: GP Number & Box Count */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: SPACING.xs }}>
                            <Text style={{ color: COLORS.text.primary, fontWeight: 'bold', fontSize: 16 }}>#{gp.gatePassNo || gp.gpNumber || '---'}</Text>
                            <Text style={{ color: COLORS.primary.main, fontWeight: 'bold', fontSize: 16 }}>{gp.totalBoxes} Boxes</Text>
                        </View>

                        {/* Details Grid */}
                        <View style={{ gap: SPACING.xs }}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Truck</Text>
                                <Text style={styles.detailValue}>{gp.truckNumber}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Driver Name</Text>
                                <Text style={styles.detailValue}>{gp.driverName}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Driver Number</Text>
                                <Text style={styles.detailValue}>{gp.driverPhone || 'N/A'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Dispatch Date</Text>
                                <Text style={styles.detailValue}>{new Date(gp.dispatchDate || gp.createdAt).toLocaleDateString()}</Text>
                            </View>

                            {/* Received Section */}
                            {gp.receivedBoxes != null ? (
                                <View style={[styles.detailRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                                    <Text style={styles.detailLabel}>Received Boxes</Text>
                                    <Text style={[styles.detailValue, { fontWeight: 'bold', color: gp.receivedBoxes === gp.totalBoxes ? COLORS.status.success : COLORS.status.warning }]}>
                                        {gp.receivedBoxes ?? 0}
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.detailRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <Text style={[styles.detailValue, { color: COLORS.status.info, fontStyle: 'italic' }]}>In Transit</Text>
                                </View>
                            )}

                            {gp.notes && (
                                <View style={{ marginTop: SPACING.xs }}>
                                    <Text style={[styles.detailLabel, { fontSize: 12 }]}>Notes</Text>
                                    <Text style={[styles.detailText, { fontStyle: 'italic' }]}>{gp.notes}</Text>
                                </View>
                            )}
                        </View>
                    </GlassCard>
                ))}
                {(!gatePasses || gatePasses.length === 0) && <Text style={styles.emptyText}>No gate passes generated.</Text>}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Sticky/Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Batch Lifecycle</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Batch Info Card (Premium) */}
                <GlassCard style={styles.infoCard}>
                    <View style={styles.infoTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.farmName}>{activeBatch.farmName}</Text>
                            <Text style={styles.batchCode}>Batch #{activeBatch.batchId}</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <BatchStatusBadge status={activeBatch.status} />
                            {activeBatch.produceType && (
                                <Text style={[styles.batchCode, { color: COLORS.accent.main, fontWeight: '600', marginTop: 4 }]}>
                                    Item: {activeBatch.produceType}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoStats}>
                        <View style={styles.infoStatItem}>
                            <Icon name="calendar" size={16} color={COLORS.text.muted} />
                            <Text style={styles.infoStatText}>
                                {activeBatch.startDate ? new Date(activeBatch.startDate).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.infoStatItem}>
                            <Icon name="package-variant-closed" size={16} color={COLORS.text.muted} />
                            <Text style={styles.infoStatText}>{activeBatch.estimatedBoxes} Est. Boxes</Text>
                        </View>
                    </View>
                </GlassCard>

                {/* 2. Timeline Flow */}
                <View style={styles.timelineContainer}>

                    {/* Step 1: Inspection */}
                    {renderTimelineStep(
                        'Inspection',
                        'clipboard-check',
                        'Approved',
                        COLORS.status.success,
                        activeBatch.startDate,
                        <Text style={styles.detailText}>Passed checks. Ready for harvest.</Text>,
                        renderInspectionContent()
                    )}

                    {/* Step 2: Harvest */}
                    {renderTimelineStep(
                        'Harvesting',
                        'basket',
                        activeBatch.status === BatchStatus.HARVEST_COMPLETED ? 'Completed' : 'In Progress',
                        activeBatch.status === BatchStatus.HARVEST_COMPLETED ? COLORS.status.success : COLORS.status.warning,
                        undefined,
                        (
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text.primary }}>{totalHarvested}</Text>
                                    <Text style={{ fontSize: 12, color: COLORS.text.muted, marginLeft: 4 }}>/ {estimated} Allocated</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: activeBatch.status === BatchStatus.HARVEST_COMPLETED ? COLORS.status.success : COLORS.status.warning }]} />
                                </View>
                            </View>
                        ),
                        harvestFullContent
                    )}

                    {/* Step 3: Dispatch */}
                    {renderTimelineStep(
                        'Dispatch',
                        'truck-delivery',
                        activeBatch.status === BatchStatus.DISPATCH_COMPLETED ? 'Completed' : 'Pending',
                        COLORS.status.info,
                        undefined,
                        (
                            <View>
                                <Text style={styles.detailText}>
                                    {gatePasses?.length || 0} Gate Passes Generated
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Icon name="package-variant" size={14} color={COLORS.text.secondary} />
                                    <Text style={styles.gpText}>
                                        {totalDispatched} Boxes Shipped
                                    </Text>
                                </View>
                            </View>
                        ),
                        dispatchFullContent,
                        true // isLast
                    )}

                </View>

                {/* Action Button for Harvest Completion */}
                {(activeBatch.status === 'HARVEST_IN_PROGRESS' || activeBatch.status === 'HARVESTING') && (
                    <View style={{ marginTop: SPACING.xl, marginBottom: SPACING.xl }}>
                        <GlassButton
                            title="Mark Harvest Completed"
                            onPress={handleCompleteHarvest}
                            icon={<Icon name="check-all" size={24} color={COLORS.text.primary} />}
                            style={{ backgroundColor: COLORS.primary.main }}
                        />
                        <Text style={{ textAlign: 'center', color: COLORS.text.muted, marginTop: SPACING.sm, fontSize: 12 }}>
                            This will lock the batch from further harvest reports.
                        </Text>
                    </View>
                )}

            </ScrollView>

            {/* Modal for Deep Dives */}
            {renderDetailModal()}

        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background.dark },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glass.border },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: COLORS.glass.background },
    headerTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.text.primary },

    scrollContent: { padding: SPACING.md, paddingBottom: 100 },

    // Top Info Card
    infoCard: { padding: SPACING.lg, borderRadius: 24, marginBottom: SPACING.lg },
    infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    farmName: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary },
    batchCode: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.secondary, marginTop: 4 },
    divider: { height: 1, backgroundColor: COLORS.glass.border, marginVertical: SPACING.md },
    infoStats: { flexDirection: 'row', gap: SPACING.lg },
    infoStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoStatText: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.sm },

    // Timeline Styles
    timelineContainer: { paddingLeft: SPACING.sm },
    timelineRow: { flexDirection: 'row', minHeight: 100 },
    timelineLeft: { width: 40, alignItems: 'center' },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    verticalLine: { width: 2, flex: 1, marginVertical: 4 },

    timelineRight: { flex: 1, paddingBottom: SPACING.lg },
    stepCard: { padding: SPACING.md, marginLeft: SPACING.sm, borderRadius: 16 },
    stepCardExpanded: { borderColor: COLORS.primary.main + '40', borderWidth: 1 },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    stepTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold', color: COLORS.text.primary },
    stepDate: { fontSize: 10, color: COLORS.text.muted },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 100, alignItems: 'center', justifyContent: 'center' },
    statusText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

    stepBody: {},
    tapPrompt: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, opacity: 0.6 },
    tapPromptText: { fontSize: 10, color: COLORS.text.muted, marginRight: 2 },

    // Content Styles
    detailText: { color: COLORS.text.secondary, fontSize: 13, lineHeight: 18 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    detailLabel: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.sm },
    detailValue: { color: COLORS.text.primary, fontWeight: '500' },
    thumbPlaceholder: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginRight: 8, alignItems: 'center', justifyContent: 'center' },

    // Stats Grid
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: SPACING.sm },
    statItem: { alignItems: 'center', flex: 1 },
    statVal: { fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary },
    statLab: { fontSize: 10, color: COLORS.text.muted, textTransform: 'uppercase', marginTop: 2 },

    // Progress Bar
    progressContainer: { marginBottom: SPACING.md },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    progressLabel: { fontSize: 12, color: COLORS.text.muted },
    progressValue: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary.main },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    harvestStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },

    // Mini List
    subSectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.text.muted, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.sm },
    miniListRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    miniListText: { color: COLORS.text.secondary, fontSize: 13 },
    emptyText: { color: COLORS.text.muted, fontStyle: 'italic', fontSize: 12, marginTop: 4 },
    gpText: { color: COLORS.text.secondary, fontSize: 13, marginLeft: 6 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: SPACING.md },
    modalContainer: { maxHeight: '80%', width: '100%', borderRadius: 24 },
    modalCard: { backgroundColor: COLORS.background.dark, borderRadius: 24, overflow: 'hidden', padding: 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.glass.border, backgroundColor: 'rgba(255,255,255,0.05)' },
    modalTitle: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary },
    closeButton: { padding: SPACING.sm },
    modalBody: { padding: SPACING.lg },
});
