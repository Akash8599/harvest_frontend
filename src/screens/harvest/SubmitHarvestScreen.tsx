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
import { harvestApi, farmApi } from '../../services/api';
import { RootStackParamList, DailyHarvestRequest } from '../../types';

type SubmitHarvestRouteProp = RouteProp<RootStackParamList, 'SubmitHarvest'>;

export const SubmitHarvestScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<SubmitHarvestRouteProp>();
    const { batch } = route.params;
    const queryClient = useQueryClient();

    const [reportDate, setReportDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [boxesPacked, setBoxesPacked] = useState('');
    const [boxesWasted, setBoxesWasted] = useState('');
    const [laborCount, setLaborCount] = useState('');
    const [laborCost, setLaborCost] = useState('');
    const [notes, setNotes] = useState('');

    const submitMutation = useMutation({
        mutationFn: (data: DailyHarvestRequest) => harvestApi.createDailyReport(data),
        onSuccess: async () => {
            // Check if we need to update status to HARVEST_IN_PROGRESS
            if (batch.status === 'CREATED' || batch.status === 'APPROVED') {
                try {
                    await farmApi.updateBatchStatus(batch.id, 'HARVEST_IN_PROGRESS');
                } catch (err) {
                    console.error("Failed to update batch status", err);
                }
            }

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Harvest report submitted successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['todayReports'] });
            queryClient.invalidateQueries({ queryKey: ['batchDetails', batch.id] });
            queryClient.invalidateQueries({ queryKey: ['activeBatches'] });
            navigation.goBack();
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to submit report',
            });
        },
    });

    const handleSubmit = () => {
        if (!boxesPacked) {
            Toast.show({ type: 'error', text1: 'Please enter boxes packed' });
            return;
        }
        if (!laborCount) {
            Toast.show({ type: 'error', text1: 'Please enter labor count' });
            return;
        }

        // Validation
        const allocated = batch.allocatedBoxes ?? batch.estimatedBoxes;
        const harvested = batch.harvestedBoxes ?? batch.actualBoxes;
        const remaining = batch.harvestRemaining ?? batch.remainingBoxes ?? (allocated - harvested);
        const entering = parseInt(boxesPacked);

        if (entering > remaining) {
            Toast.show({
                type: 'error',
                text1: 'Limit Exceeded',
                text2: `Only ${remaining} boxes remaining for this batch.`
            });
            return;
        }

        const request: DailyHarvestRequest = {
            batchId: batch.id,
            reportDate: reportDate.toISOString().split('T')[0],
            boxesPacked: entering,
            boxesWasted: parseInt(boxesWasted) || 0,
            laborCount: parseInt(laborCount),
            laborCost: parseFloat(laborCost) || 0,
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
                <Text style={styles.headerTitle}>Submit Harvest</Text>
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
                                    {batch.allocatedBoxes ?? batch.estimatedBoxes}
                                </Text>
                                <Text style={styles.statLabel}>Allocated</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>
                                    {batch.harvestedBoxes ?? batch.actualBoxes}
                                </Text>
                                <Text style={styles.statLabel}>Harvested</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={[
                                    styles.statValue,
                                    (batch.harvestRemaining ?? batch.remainingBoxes ?? ((batch.allocatedBoxes ?? batch.estimatedBoxes) - (batch.harvestedBoxes ?? batch.actualBoxes))) <= 10 && { color: COLORS.status.error }
                                ]}>
                                    {batch.harvestRemaining ?? batch.remainingBoxes ?? ((batch.allocatedBoxes ?? batch.estimatedBoxes) - (batch.harvestedBoxes ?? batch.actualBoxes))}
                                </Text>
                                <Text style={styles.statLabel}>Remaining</Text>
                            </View>
                        </View>
                    </GlassCard>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Report Date</Text>
                            <TouchableOpacity
                                style={styles.dateSelector}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Icon name="calendar" size={24} color={COLORS.primary.main} />
                                <Text style={styles.dateText}>{reportDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal
                                open={showDatePicker}
                                date={reportDate}
                                mode="date"
                                maximumDate={new Date()}
                                onConfirm={(date) => {
                                    setShowDatePicker(false);
                                    setReportDate(date);
                                }}
                                onCancel={() => setShowDatePicker(false)}
                            />
                        </View>

                        <GlassInput
                            label="Boxes Packed"
                            placeholder="Enter number of boxes"
                            value={boxesPacked}
                            onChangeText={setBoxesPacked}
                            keyboardType="numeric"
                            icon={<Icon name="package-variant-closed" size={20} color={COLORS.text.muted} />}
                        />

                        <GlassInput
                            label="Boxes Wasted (Optional)"
                            placeholder="Enter wasted boxes"
                            value={boxesWasted}
                            onChangeText={setBoxesWasted}
                            keyboardType="numeric"
                            icon={<Icon name="delete-outline" size={20} color={COLORS.status.error} />}
                        />

                        <GlassInput
                            label="Number of Workers"
                            placeholder="Enter worker count"
                            value={laborCount}
                            onChangeText={setLaborCount}
                            keyboardType="numeric"
                            icon={<Icon name="account-group" size={20} color={COLORS.text.muted} />}
                        />

                        <GlassInput
                            label="Total Labor Cost (₹)"
                            placeholder="Enter cost (optional)"
                            value={laborCost}
                            onChangeText={setLaborCost}
                            keyboardType="numeric"
                            icon={<Icon name="cash" size={20} color={COLORS.accent.main} />}
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
                            title="Submit Report"
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
