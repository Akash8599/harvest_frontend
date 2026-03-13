import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { authApi } from '../../services/api';
import { RootStackParamList, UserRole } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    MANAGER: 'Supervisor',
    VENDOR: 'Vendor',
    STORE_KEEPER: 'Store Keeper',
    ACCOUNTS: 'Accounts',
};

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: '#FF6B35',
    MANAGER: '#4ECDC4',
    VENDOR: '#39FF14',
    STORE_KEEPER: '#A29BFE',
    ACCOUNTS: '#FD79A8',
};

export const UserManagementScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const res = await authApi.getAllUsers();
            return res.data.data || [];
        },
    });

    const approveMutation = useMutation({
        mutationFn: (userId: string) => authApi.approveUser(userId),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'User Approved' });
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message });
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: (userId: string) => authApi.deactivateUser(userId),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'User Deactivated' });
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message });
        },
    });

    const handleDeactivate = (userId: string, name: string) => {
        Alert.alert('Deactivate User', `Are you sure you want to deactivate ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Deactivate', style: 'destructive', onPress: () => deactivateMutation.mutate(userId) },
        ]);
    };

    const filteredUsers = users.filter((u: any) => {
        const matchesSearch =
            u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' ? true : !u.isActive;
        return matchesSearch && matchesTab;
    });

    const pendingCount = users.filter((u: any) => !u.isActive).length;

    const renderUserCard = (user: any) => (
        <GlassCard key={user.id} style={styles.userCard}>
            <View style={styles.userRow}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: (ROLE_COLORS[user.role] || '#fff') + '20' }]}>
                    <Text style={[styles.avatarText, { color: ROLE_COLORS[user.role] || '#fff' }]}>
                        {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>

                {/* Info */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[user.role] || '#fff') + '20' }]}>
                            <Text style={[styles.roleText, { color: ROLE_COLORS[user.role] || '#fff' }]}>
                                {ROLE_LABELS[user.role] || user.role}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: user.isActive ? 'rgba(57,255,20,0.1)' : 'rgba(255,100,100,0.1)' }]}>
                            <View style={[styles.statusDot, { backgroundColor: user.isActive ? COLORS.status.success : COLORS.status.error }]} />
                            <Text style={[styles.statusText, { color: user.isActive ? COLORS.status.success : COLORS.status.error }]}>
                                {user.isActive ? 'Active' : 'Pending'}
                            </Text>
                        </View>
                    </View>
                    {user.vendorType && (
                        <Text style={styles.vendorType}>{user.vendorType.replace(/_/g, ' ')}</Text>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {!user.isActive ? (
                        <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => approveMutation.mutate(user.id)}
                        >
                            <Icon name="check" size={18} color={COLORS.status.success} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.deactivateBtn}
                            onPress={() => handleDeactivate(user.id, user.fullName)}
                        >
                            <Icon name="account-cancel-outline" size={18} color={COLORS.status.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </GlassCard>
    );

    return (
        <LinearGradient colors={['#0D1117', '#0F2027', '#1A3A2F']} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>User Management</Text>
                        <Text style={styles.headerSub}>{users.length} users total</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateUser')}>
                        <Icon name="account-plus" size={24} color={COLORS.primary.main} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Icon name="magnify" size={20} color={COLORS.text.muted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or email..."
                        placeholderTextColor={COLORS.text.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={18} color={COLORS.text.muted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                            Pending {pendingCount > 0 && `(${pendingCount})`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* List */}
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={undefined}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.primary.main} style={{ marginTop: 40 }} />
                    ) : filteredUsers.length === 0 ? (
                        <View style={styles.empty}>
                            <Icon name="account-search-outline" size={48} color={COLORS.text.muted} />
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    ) : (
                        filteredUsers.map((u: any) => renderUserCard(u))
                    )}
                </ScrollView>

                {/* FAB */}
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateUser')}>
                    <Icon name="plus" size={28} color="#000" />
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary },
    headerSub: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: 2 },
    addBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(57,255,20,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: SPACING.md, height: 46,
    },
    searchInput: {
        flex: 1, color: COLORS.text.primary,
        fontSize: TYPOGRAPHY.sizes.md,
        paddingHorizontal: SPACING.sm,
    },
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: BORDER_RADIUS.lg, padding: 4,
    },
    tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.md },
    activeTab: { backgroundColor: 'rgba(57,255,20,0.15)' },
    tabText: { color: COLORS.text.muted, fontWeight: '600', fontSize: TYPOGRAPHY.sizes.sm },
    activeTabText: { color: COLORS.primary.main },
    list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
    userCard: { marginBottom: SPACING.md, padding: SPACING.md },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 20, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold', color: COLORS.text.primary },
    userEmail: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: 2 },
    badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    roleText: { fontSize: 10, fontWeight: '700' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '600' },
    vendorType: { fontSize: 10, color: COLORS.text.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    actions: { gap: SPACING.sm },
    approveBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(57,255,20,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    deactivateBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,100,100,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: SPACING.md },
    emptyText: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.md },
    fab: {
        position: 'absolute', bottom: SPACING.xl, right: SPACING.lg,
        backgroundColor: COLORS.primary.main,
        width: 56, height: 56, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        elevation: 8,
    },
});
