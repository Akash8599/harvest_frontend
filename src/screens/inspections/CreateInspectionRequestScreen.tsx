import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { farmApi, authApi } from '../../services/api';
import { UserRole, Farm } from '../../types';
import { HorizontalScrollWrapper } from '../../components/common/HorizontalScrollWrapper';

export const CreateInspectionRequestScreen: React.FC = () => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
    const [notes, setNotes] = useState('');

    // Fetch Farms
    const { data: farms, isLoading: farmsLoading } = useQuery({
        queryKey: ['farms'],
        queryFn: async () => {
            const response = await farmApi.getAllFarms();
            return response.data.data;
        },
    });

    // Fetch Vendors
    const { data: vendors, isLoading: vendorsLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: async () => {
            const response = await authApi.getUsersByRole(UserRole.VENDOR);
            // Filter only active vendors? Assuming API returns all
            return response.data.data.filter((u: any) => u.isActive);
        },
    });

    // Mutation
    const createRequestMutation = useMutation({
        mutationFn: (data: any) => farmApi.createInspectionRequest(data),
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Request Created',
                text2: 'Inspection request sent to vendor.',
            });
            queryClient.invalidateQueries({ queryKey: ['myInspectionRequests'] }); // invalidates relevant queries
            navigation.goBack();
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to create request',
                text2: error.response?.data?.message || 'Something went wrong',
            });
        },
    });

    const handleSubmit = () => {
        if (!selectedFarm) {
            Toast.show({ type: 'error', text1: 'Please select a farm' });
            return;
        }
        if (!selectedVendor) {
            Toast.show({ type: 'error', text1: 'Please select a vendor' });
            return;
        }

        createRequestMutation.mutate({
            farmId: selectedFarm.id,
            vendorId: selectedVendor.id,
            notes: notes,
        });
    };

    return (
        <LinearGradient colors={COLORS.background.gradient as string[]} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>New Request</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <GlassCard style={styles.card}>

                        {/* Farm Selection */}
                        <Text style={styles.label}>Select Farm</Text>
                        {farmsLoading ? (
                            <ActivityIndicator color={COLORS.primary.main} />
                        ) : (
                            <HorizontalScrollWrapper
                                horizontalPadding={0}
                                itemGap={8}
                                containerStyle={styles.selectionList}
                            >
                                {farms?.map((farm: Farm) => (
                                    <TouchableOpacity
                                        key={farm.id}
                                        style={[
                                            styles.selectionItem,
                                            selectedFarm?.id === farm.id && styles.selectedItem,
                                        ]}
                                        onPress={() => setSelectedFarm(farm)}
                                    >
                                        <Icon name="map-marker" size={20} color={selectedFarm?.id === farm.id ? COLORS.primary.main : COLORS.text.secondary} />
                                        <Text style={[styles.selectionText, selectedFarm?.id === farm.id && styles.selectedText]}>{farm.farmerName}</Text>
                                        <Text style={styles.subText}>{farm.location}</Text>
                                    </TouchableOpacity>
                                ))}
                            </HorizontalScrollWrapper>
                        )}

                        {/* Vendor Selection */}
                        <Text style={styles.label}>Select Vendor</Text>
                        {vendorsLoading ? (
                            <ActivityIndicator color={COLORS.primary.main} />
                        ) : (
                            <HorizontalScrollWrapper
                                horizontalPadding={0}
                                itemGap={8}
                                containerStyle={styles.selectionList}
                            >
                                {vendors?.map((vendor: any) => (
                                    <TouchableOpacity
                                        key={vendor.id}
                                        style={[
                                            styles.selectionItem,
                                            selectedVendor?.id === vendor.id && styles.selectedItem,
                                        ]}
                                        onPress={() => setSelectedVendor(vendor)}
                                    >
                                        <Icon name="account" size={20} color={selectedVendor?.id === vendor.id ? COLORS.primary.main : COLORS.text.secondary} />
                                        <Text style={[styles.selectionText, selectedVendor?.id === vendor.id && styles.selectedText]}>{vendor.fullName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </HorizontalScrollWrapper>
                        )}

                        <GlassInput
                            label="Notes (Optional)"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                            placeholder="Add instructions for the vendor..."
                            icon={<Icon name="note-text" size={20} color={COLORS.text.muted} />}
                        />

                        <GlassButton
                            title="Create Request"
                            onPress={handleSubmit}
                            loading={createRequestMutation.isPending}
                            variant="primary"
                            size="lg"
                            style={styles.submitButton}
                        />

                    </GlassCard>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerSpacer: { height: SPACING.xl },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
    backButton: { marginRight: SPACING.md },
    title: { fontSize: TYPOGRAPHY.sizes['2xl'], fontWeight: 'bold', color: COLORS.text.primary },
    content: { padding: SPACING.lg },
    card: { padding: SPACING.lg },

    label: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.secondary, marginBottom: SPACING.sm, marginTop: SPACING.md, fontWeight: '600' },

    selectionList: { flexDirection: 'row', marginBottom: SPACING.md },
    selectionItem: {
        backgroundColor: COLORS.glass.background,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        minWidth: 140,
        borderWidth: 1,
        borderColor: COLORS.glass.border
    },
    selectedItem: { borderColor: COLORS.primary.main, backgroundColor: 'rgba(57, 255, 20, 0.1)' },
    selectionText: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.primary, fontWeight: '600', marginTop: SPACING.xs },
    selectedText: { color: COLORS.primary.main },
    subText: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: 2 },

    submitButton: { marginTop: SPACING.xl },
});
