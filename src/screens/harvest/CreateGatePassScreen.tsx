import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { harvestApi } from '../../services/api';
import { RootStackParamList, GatePassRequest } from '../../types';

type CreateGatePassRouteProp = RouteProp<RootStackParamList, 'CreateGatePass'>;

export const CreateGatePassScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<CreateGatePassRouteProp>();
    const { batch } = route.params;
    const queryClient = useQueryClient();

    const [dispatchDate, setDispatchDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [truckNumber, setTruckNumber] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [totalBoxes, setTotalBoxes] = useState('');
    const [notes, setNotes] = useState('');

    const submitMutation = useMutation({
        mutationFn: (data: GatePassRequest) => harvestApi.createGatePass(data),
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Gate pass created successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['todayGatePasses'] });
            queryClient.invalidateQueries({ queryKey: ['batchGatePasses', batch.id] });
            queryClient.invalidateQueries({ queryKey: ['batchDetailsGP', batch.id] });
            queryClient.invalidateQueries({ queryKey: ['activeBatchesForGP'] });
            navigation.navigate('GatePass', { refresh: true });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to create gate pass',
            });
        },
    });

    const handleSubmit = () => {
        if (!truckNumber || !driverName || !totalBoxes) {
            Toast.show({ type: 'error', text1: 'Please fill all required fields' });
            return;
        }

        const boxes = parseInt(totalBoxes);
        // Logic: Gate pass can't exceed what was harvested (or maybe remaining capacity? 
        // usually gate pass is for dispatched harvested boxes)
        // User said: "Prevent user from entering boxes greater than remainingBoxes"
        // Wait, for Gate Pass, remainingBoxes = harvestedBoxes - dispatchedBoxes?
        // Actually the user said: "remainingBoxes = allocatedBoxes - harvestedBoxes"
        // So they are using the same logic for both?
        // Let's stick to the user's specific requirement.

        const harvested = batch.harvestedBoxes ?? batch.actualBoxes ?? 0;
        const dispatched = batch.dispatchedBoxes ?? 0;
        const remaining = batch.gatePassRemaining ?? (harvested - dispatched);

        if (boxes > remaining) {
            Toast.show({
                type: 'error',
                text1: 'Limit Exceeded',
                text2: `Only ${remaining} boxes available in stock for dispatch.`
            });
            return;
        }

        const request: GatePassRequest = {
            batchId: batch.id,
            truckNumber,
            driverName,
            driverPhone,
            totalBoxes: boxes,
            dispatchDate: dispatchDate.toISOString().split('T')[0],
            notes,
        };

        submitMutation.mutate(request);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-left" size={32} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Gate Pass</Text>
                <View style={{ width: 32 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <GlassCard style={styles.batchCard}>
                        <View style={styles.batchHeader}>
                            <View>
                                <Text style={styles.farmName}>{batch.farmName}</Text>
                                <Text style={styles.batchCode}>Batch #{batch.batchId}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>
                                    {batch.harvestedBoxes ?? batch.actualBoxes ?? 0}
                                </Text>
                                <Text style={styles.statLabel}>Harvested</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>
                                    {batch.dispatchedBoxes ?? 0}
                                </Text>
                                <Text style={styles.statLabel}>Dispatched</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={[
                                    styles.statValue,
                                    (batch.gatePassRemaining ?? ((batch.harvestedBoxes ?? batch.actualBoxes ?? 0) - (batch.dispatchedBoxes ?? 0))) <= 10 && { color: COLORS.status.error }
                                ]}>
                                    {batch.gatePassRemaining ?? ((batch.harvestedBoxes ?? batch.actualBoxes ?? 0) - (batch.dispatchedBoxes ?? 0))}
                                </Text>
                                <Text style={styles.statLabel}>In Stock</Text>
                            </View>
                        </View>
                    </GlassCard>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Dispatch Date</Text>
                            <TouchableOpacity
                                style={styles.dateSelector}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Icon name="calendar" size={24} color={COLORS.primary.main} />
                                <Text style={styles.dateText}>{dispatchDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal
                                open={showDatePicker}
                                date={dispatchDate}
                                mode="date"
                                maximumDate={new Date()}
                                onConfirm={(date) => {
                                    setShowDatePicker(false);
                                    setDispatchDate(date);
                                }}
                                onCancel={() => setShowDatePicker(false)}
                            />
                        </View>

                        <GlassInput
                            label="Truck Number"
                            placeholder="e.g. MH 12 AB 1234"
                            value={truckNumber}
                            onChangeText={setTruckNumber}
                            icon={<Icon name="truck-outline" size={20} color={COLORS.text.muted} />}
                        />

                        <GlassInput
                            label="Driver Name"
                            placeholder="Enter driver name"
                            value={driverName}
                            onChangeText={setDriverName}
                            icon={<Icon name="account-outline" size={20} color={COLORS.text.muted} />}
                        />

                        <GlassInput
                            label="Driver Phone"
                            placeholder="Enter driver phone"
                            value={driverPhone}
                            onChangeText={setDriverPhone}
                            keyboardType="phone-pad"
                            icon={<Icon name="phone-outline" size={20} color={COLORS.text.muted} />}
                        />

                        <GlassInput
                            label="Total Boxes"
                            placeholder="Number of boxes to dispatch"
                            value={totalBoxes}
                            onChangeText={setTotalBoxes}
                            keyboardType="numeric"
                            icon={<Icon name="package-variant-closed" size={20} color={COLORS.primary.main} />}
                        />

                        <GlassInput
                            label="Notes"
                            placeholder="Any additional info..."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={4}
                            icon={<Icon name="notebook" size={20} color={COLORS.text.muted} />}
                        />

                        <GlassButton
                            title="Create Gate Pass"
                            onPress={handleSubmit}
                            loading={submitMutation.isPending}
                            style={styles.submitButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    batchCard: {
        marginBottom: SPACING.xl,
        padding: SPACING.lg,
    },
    batchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    farmName: {
        fontSize: TYPOGRAPHY.sizes.lg,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    batchCode: {
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.text.muted,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: SPACING.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: TYPOGRAPHY.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.primary.main,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.text.muted,
        textTransform: 'uppercase',
    },
    form: {
        gap: SPACING.lg,
    },
    inputGroup: {
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: TYPOGRAPHY.sizes.sm,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dateText: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.primary,
    },
    submitButton: {
        marginTop: SPACING.xl,
    },
});
