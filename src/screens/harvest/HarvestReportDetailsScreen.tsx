import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { RootStackParamList } from '../../types';

type HarvestReportDetailsRouteProp = RouteProp<RootStackParamList, 'HarvestReportDetails'>;

export const HarvestReportDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<HarvestReportDetailsRouteProp>();
    const { report } = route.params;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const InfoRow = ({ label, value, icon, color }: { label: string; value: string | number; icon: string; color?: string }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                <Icon name={icon} size={20} color={color || COLORS.primary.main} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={['#0F5132', '#0F2027', '#0A0F1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-left" size={32} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Details</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <GlassCard style={styles.mainCard}>
                    <View style={styles.reportHeader}>
                        <View style={styles.dateContainer}>
                            <Icon name="calendar-clock" size={24} color={COLORS.primary.main} />
                            <Text style={styles.reportDate}>{formatDate(report.createdAt)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(57, 255, 20, 0.1)' }]}>
                            <Text style={[styles.statusText, { color: COLORS.status.success }]}>SUBMITTED</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{report.boxesPacked}</Text>
                            <Text style={styles.statLabel}>Packed</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: COLORS.status.error }]}>{report.boxesWasted || 0}</Text>
                            <Text style={styles.statLabel}>Wasted</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: COLORS.accent.main }]}>{report.laborCount}</Text>
                            <Text style={styles.statLabel}>Workers</Text>
                        </View>
                    </View>
                </GlassCard>

                <Text style={styles.sectionTitle}>Contextual Information</Text>
                <GlassCard style={styles.detailsCard}>
                    <InfoRow
                        label="Farm"
                        value={report.farmName || 'Unknown Farm'}
                        icon="office-building"
                    />
                    <InfoRow
                        label="Batch Code"
                        value={`#${report.batchIdCode || report.batchId}`}
                        icon="barcode-scan"
                    />
                    <InfoRow
                        label="Report ID"
                        value={report.id}
                        icon="identifier"
                        color={COLORS.text.muted}
                    />
                </GlassCard>

                <Text style={styles.sectionTitle}>Cost & Labor</Text>
                <GlassCard style={styles.detailsCard}>
                    <InfoRow
                        label="Total Labor Cost"
                        value={`₹${report.laborCost || 0}`}
                        icon="cash-multiple"
                        color={COLORS.status.success}
                    />
                    <InfoRow
                        label="Labor Payment Status"
                        value={report.laborPaymentStatus || 'N/A'}
                        icon="check-circle-outline"
                    />
                </GlassCard>

                {report.notes && (
                    <>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <GlassCard style={styles.notesCard}>
                            <Text style={styles.notesText}>{report.notes}</Text>
                        </GlassCard>
                    </>
                )}
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    mainCard: {
        marginBottom: SPACING.xl,
        padding: SPACING.lg,
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    reportDate: {
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.text.primary,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: SPACING.md,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.sm,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: TYPOGRAPHY.sizes['3xl'],
        fontWeight: 'bold',
        color: COLORS.primary.main,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.text.muted,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.sizes.sm,
        fontWeight: 'bold',
        color: COLORS.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
        marginTop: SPACING.sm,
    },
    detailsCard: {
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        gap: SPACING.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        color: COLORS.text.muted,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.primary,
        fontWeight: '600',
    },
    notesCard: {
        padding: SPACING.md,
        marginBottom: SPACING.xl,
    },
    notesText: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.secondary,
        lineHeight: 22,
    },
});
