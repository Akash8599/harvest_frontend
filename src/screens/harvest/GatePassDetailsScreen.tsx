import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { RootStackParamList } from '../../types';

type GatePassDetailsRouteProp = RouteProp<RootStackParamList, 'GatePassDetails'>;

export const GatePassDetailsScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<GatePassDetailsRouteProp>();
    const { report } = route.params;

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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-left" size={32} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gate Pass Details</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <GlassCard style={styles.mainCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>#{report.gatePassNo}</Text>
                        </View>
                        <Text style={styles.date}>
                            {new Date(report.dispatchDate).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total Boxes</Text>
                            <Text style={styles.statValue}>{report.totalBoxes}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Received</Text>
                            <Text style={[styles.statValue, { color: report.receivedBoxes ? COLORS.status.success : COLORS.text.muted }]}>
                                {report.receivedBoxes ?? 'Pending'}
                            </Text>
                        </View>
                    </View>
                </GlassCard>

                <Text style={styles.sectionTitle}>Farm Information</Text>
                <GlassCard style={styles.detailsCard}>
                    <InfoRow
                        label="Farm"
                        value={report.farmName || 'Unknown Farm'}
                        icon="office-building"
                    />
                    <InfoRow
                        label="Batch ID"
                        value={`#${report.batchId}`}
                        icon="barcode-scan"
                    />
                </GlassCard>

                <Text style={styles.sectionTitle}>Transport Information</Text>
                <GlassCard style={styles.detailsCard}>
                    <InfoRow
                        label="Truck Number"
                        value={report.truckNumber}
                        icon="truck-outline"
                    />
                    <InfoRow
                        label="Driver Name"
                        value={report.driverName}
                        icon="account-outline"
                    />
                    {report.driverPhone && (
                        <InfoRow
                            label="Driver Phone"
                            value={report.driverPhone}
                            icon="phone-outline"
                        />
                    )}
                </GlassCard>

                {report.notes && (
                    <>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <GlassCard style={styles.detailsCard}>
                            <Text style={styles.notesText}>{report.notes}</Text>
                        </GlassCard>
                    </>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Generated on {new Date(report.createdAt).toLocaleString()}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
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
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        backgroundColor: 'rgba(57, 255, 20, 0.05)',
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    badge: {
        backgroundColor: COLORS.primary.main,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        marginBottom: SPACING.sm,
    },
    badgeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: TYPOGRAPHY.sizes.md,
    },
    date: {
        color: COLORS.text.secondary,
        fontSize: TYPOGRAPHY.sizes.sm,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: SPACING.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: COLORS.text.muted,
        fontSize: 10,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        color: COLORS.text.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.sizes.sm,
        fontWeight: 'bold',
        color: COLORS.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    detailsCard: {
        padding: SPACING.lg,
        gap: SPACING.lg,
        marginBottom: SPACING.xl,
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
        color: COLORS.text.muted,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    infoValue: {
        color: COLORS.text.primary,
        fontSize: TYPOGRAPHY.sizes.md,
        fontWeight: '600',
        marginTop: 2,
    },
    notesText: {
        color: COLORS.text.secondary,
        fontSize: TYPOGRAPHY.sizes.md,
        lineHeight: 22,
    },
    footer: {
        marginTop: SPACING.xl,
        alignItems: 'center',
        paddingBottom: SPACING.xl,
    },
    footerText: {
        color: COLORS.text.muted,
        fontSize: 10,
    },
});
