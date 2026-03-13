import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { coldStorageApi } from '../../services/api';

const TABS = ['Inventory', 'Inward', 'Outward'] as const;
type Tab = typeof TABS[number];

export const ColdStorageScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<Tab>('Inventory');

    // Inventory summary
    const { data: inventory, isLoading: invLoading } = useQuery({
        queryKey: ['coldStorageInventory'],
        queryFn: async () => {
            const res = await coldStorageApi.getInventorySummary();
            return res.data.data;
        },
        enabled: activeTab === 'Inventory',
    });

    // Inward records
    const { data: inwards = [], isLoading: inwardsLoading } = useQuery({
        queryKey: ['coldStorageInwards'],
        queryFn: async () => {
            const res = await coldStorageApi.getAllInwards();
            return res.data.data || [];
        },
        enabled: activeTab === 'Inward',
    });

    // Outward records
    const { data: outwards = [], isLoading: outwardsLoading } = useQuery({
        queryKey: ['coldStorageOutwards'],
        queryFn: async () => {
            const res = await coldStorageApi.getAllOutwards();
            return res.data.data || [];
        },
        enabled: activeTab === 'Outward',
    });

    const renderInventory = () => {
        if (invLoading) return <ActivityIndicator color={COLORS.primary.main} style={{ marginTop: 40 }} />;
        if (!inventory) return (
            <View style={styles.empty}>
                <Icon name="snowflake-off" size={48} color={COLORS.text.muted} />
                <Text style={styles.emptyText}>No inventory data</Text>
            </View>
        );

        return (
            <View style={styles.inventoryGrid}>
                <GlassCard style={styles.inventoryCard}>
                    <View style={[styles.invIconBox, { backgroundColor: 'rgba(139,233,253,0.1)' }]}>
                        <Icon name="cube-scan" size={28} color="#8BE9FD" />
                    </View>
                    <Text style={styles.invCount}>{inventory.totalBoxes ?? 0}</Text>
                    <Text style={styles.invLabel}>Total Boxes</Text>
                </GlassCard>
                <GlassCard style={styles.inventoryCard}>
                    <View style={[styles.invIconBox, { backgroundColor: 'rgba(57,255,20,0.1)' }]}>
                        <Icon name="arrow-down-circle" size={28} color={COLORS.primary.main} />
                    </View>
                    <Text style={styles.invCount}>{inventory.totalInward ?? 0}</Text>
                    <Text style={styles.invLabel}>Inward Total</Text>
                </GlassCard>
                <GlassCard style={styles.inventoryCard}>
                    <View style={[styles.invIconBox, { backgroundColor: 'rgba(255,165,0,0.1)' }]}>
                        <Icon name="arrow-up-circle" size={28} color={COLORS.status.warning} />
                    </View>
                    <Text style={styles.invCount}>{inventory.totalOutward ?? 0}</Text>
                    <Text style={styles.invLabel}>Dispatched</Text>
                </GlassCard>
                <GlassCard style={styles.inventoryCard}>
                    <View style={[styles.invIconBox, { backgroundColor: 'rgba(255,100,100,0.1)' }]}>
                        <Icon name="warehouse" size={28} color={COLORS.status.error} />
                    </View>
                    <Text style={[styles.invCount, { color: COLORS.primary.main }]}>{inventory.balance ?? 0}</Text>
                    <Text style={styles.invLabel}>In Stock</Text>
                </GlassCard>
            </View>
        );
    };

    const renderInwardsList = () => {
        if (inwardsLoading) return <ActivityIndicator color={COLORS.primary.main} style={{ marginTop: 40 }} />;
        if (inwards.length === 0) return (
            <View style={styles.empty}>
                <Icon name="inbox-arrow-down" size={48} color={COLORS.text.muted} />
                <Text style={styles.emptyText}>No inward records</Text>
            </View>
        );
        return inwards.map((item: any) => (
            <GlassCard key={item.id} style={styles.recordCard}>
                <View style={styles.recordRow}>
                    <View style={styles.recordIcon}>
                        <Icon name="arrow-down-circle" size={22} color={COLORS.primary.main} />
                    </View>
                    <View style={styles.recordInfo}>
                        <Text style={styles.recordTitle}>{item.farmName} — Batch #{item.batchIdCode}</Text>
                        <Text style={styles.recordSub}>{item.coldStorageName} · {new Date(item.inwardDate).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.recordCount}>{item.totalBoxes}</Text>
                </View>
            </GlassCard>
        ));
    };

    const renderOutwardsList = () => {
        if (outwardsLoading) return <ActivityIndicator color={COLORS.primary.main} style={{ marginTop: 40 }} />;
        if (outwards.length === 0) return (
            <View style={styles.empty}>
                <Icon name="truck-delivery" size={48} color={COLORS.text.muted} />
                <Text style={styles.emptyText}>No outward records</Text>
            </View>
        );
        return outwards.map((item: any) => (
            <GlassCard key={item.id} style={styles.recordCard}>
                <View style={styles.recordRow}>
                    <View style={[styles.recordIcon, { backgroundColor: 'rgba(255,165,0,0.1)' }]}>
                        <Icon name="truck-delivery" size={22} color={COLORS.status.warning} />
                    </View>
                    <View style={styles.recordInfo}>
                        <Text style={styles.recordTitle}>{item.containerNumber}</Text>
                        <Text style={styles.recordSub}>{item.destination} · {new Date(item.dispatchDate).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.recordCount}>{item.totalBoxes}</Text>
                </View>
            </GlassCard>
        ));
    };

    return (
        <LinearGradient colors={['#0D2137', '#0F2027', '#0A0F1C']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>Cold Storage</Text>
                        <Text style={styles.headerSub}>Track inward & outward</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ColdStorageInward')}>
                            <Icon name="arrow-down-circle" size={20} color={COLORS.primary.main} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: 'rgba(255,165,0,0.1)' }]} onPress={() => navigation.navigate('ColdStorageOutward')}>
                            <Icon name="truck-delivery" size={20} color={COLORS.status.warning} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabRow}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {activeTab === 'Inventory' && renderInventory()}
                    {activeTab === 'Inward' && renderInwardsList()}
                    {activeTab === 'Outward' && renderOutwardsList()}
                </ScrollView>

                {/* FABs */}
                <View style={styles.fabRow}>
                    <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary.main }]} onPress={() => navigation.navigate('ColdStorageInward')}>
                        <Icon name="snowflake-check" size={22} color="#000" />
                        <Text style={styles.fabText}>Inward</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.fab, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.status.warning }]} onPress={() => navigation.navigate('ColdStorageOutward')}>
                        <Icon name="truck-delivery" size={22} color={COLORS.status.warning} />
                        <Text style={[styles.fabText, { color: COLORS.status.warning }]}>Outward</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
    headerLeft: {},
    headerTitle: { fontSize: TYPOGRAPHY.sizes['2xl'], fontWeight: 'bold', color: COLORS.text.primary },
    headerSub: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: SPACING.sm },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(57,255,20,0.1)', alignItems: 'center', justifyContent: 'center' },
    tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: BORDER_RADIUS.lg, padding: 4 },
    tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.md },
    tabActive: { backgroundColor: 'rgba(100,200,255,0.15)' },
    tabText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted, fontWeight: '600' },
    tabTextActive: { color: '#8BE9FD', fontWeight: '700' },
    content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
    inventoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    inventoryCard: { flex: 1, minWidth: '44%', alignItems: 'center', padding: SPACING.lg, gap: SPACING.sm },
    invIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    invCount: { fontSize: TYPOGRAPHY.sizes['3xl'], fontWeight: 'bold', color: COLORS.text.primary },
    invLabel: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, textTransform: 'uppercase' },
    empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
    emptyText: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.md },
    recordCard: { marginBottom: SPACING.sm, padding: SPACING.md },
    recordRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    recordIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(57,255,20,0.1)', alignItems: 'center', justifyContent: 'center' },
    recordInfo: { flex: 1 },
    recordTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: '700', color: COLORS.text.primary },
    recordSub: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: 2 },
    recordCount: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.primary.main },
    fabRow: { position: 'absolute', bottom: SPACING.xl, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', gap: SPACING.md },
    fab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.xl, elevation: 4 },
    fabText: { fontWeight: 'bold', fontSize: TYPOGRAPHY.sizes.sm, color: '#000' },
});
