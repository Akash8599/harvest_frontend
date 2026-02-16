import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { authApi } from '../../services/api';
import { User } from '../../types';

export const UserApprovalScreen: React.FC = () => {
    const queryClient = useQueryClient();

    // Fetch all users
    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await authApi.getAllUsers();
            return response.data.data;
        },
    });

    // Approve User Mutation
    const approveMutation = useMutation({
        mutationFn: async (userId: string) => {
            await authApi.approveUser(userId);
        },
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'User Approved',
                text2: 'The user can now log in.',
            });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Approval Failed',
                text2: error.response?.data?.message || 'Something went wrong',
            });
        },
    });

    const handleApprove = (user: User) => {
        Alert.alert(
            'Approve User',
            `Are you sure you want to approve ${user.fullName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: () => approveMutation.mutate(user.id),
                },
            ]
        );
    };

    // Filter pending users (isActive === false)
    const pendingUsers = users?.filter((u: User) => !u.isActive) || [];

    const renderUserCard = (user: User) => (
        <GlassCard key={user.id} style={styles.userCard}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.fullName.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user.role.replace('_', ' ')}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actionRow}>
                <Text style={styles.dateText}>
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                </Text>
                <GlassButton
                    title="Approve"
                    onPress={() => handleApprove(user)}
                    loading={approveMutation.isPending && approveMutation.variables === user.id}
                    size="sm"
                    style={styles.approveButton}
                />
            </View>
        </GlassCard>
    );

    return (
        <LinearGradient
            colors={COLORS.background.gradient as string[]}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>Pending Approvals</Text>
                    <Text style={styles.subtitle}>
                        {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting
                    </Text>
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
                            <RefreshControl
                                refreshing={isLoading}
                                onRefresh={refetch}
                                tintColor={COLORS.primary.main}
                            />
                        }
                    >
                        {pendingUsers.length === 0 ? (
                            <GlassCard style={styles.emptyCard}>
                                <Icon name="check-circle-outline" size={48} color={COLORS.status.success} />
                                <Text style={styles.emptyText}>No pending approvals</Text>
                            </GlassCard>
                        ) : (
                            pendingUsers.map(renderUserCard)
                        )}
                    </ScrollView>
                )}
            </SafeAreaView >
        </LinearGradient >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.lg, paddingTop: SPACING.xl },
    title: { fontSize: TYPOGRAPHY.sizes['3xl'], fontWeight: 'bold', color: COLORS.text.primary },
    subtitle: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.secondary, marginTop: SPACING.xs },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },

    userCard: { marginBottom: SPACING.md, padding: SPACING.md },
    cardHeader: { flexDirection: 'row', marginBottom: SPACING.md },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarText: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary },
    userInfo: { flex: 1, justifyContent: 'center' },
    userName: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: 2 },
    userEmail: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.secondary, marginBottom: 4 },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.glass.background,
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.accent.main,
    },
    roleText: { fontSize: 10, color: COLORS.accent.main, fontWeight: '600', textTransform: 'capitalize' },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.glass.border,
        paddingTop: SPACING.md,
    },
    dateText: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted },
    approveButton: { width: 100 },

    emptyCard: { alignItems: 'center', padding: SPACING.xl },
    emptyText: { marginTop: SPACING.md, color: COLORS.text.secondary, fontSize: TYPOGRAPHY.sizes.md },
});
