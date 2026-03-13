import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { coldStorageApi } from '../../services/api';
import { PACKING_WEIGHT_OPTIONS, EXPORT_DESTINATIONS, CONTAINER_CAPACITY } from '../../types';

export const ColdStorageOutwardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();

    const [containerNumber, setContainerNumber] = useState('');
    const [destination, setDestination] = useState('');
    const [dispatchDate, setDispatchDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedPackingWeight, setSelectedPackingWeight] = useState('');
    const [boxes4Hand, setBoxes4Hand] = useState('');
    const [boxes5Hand, setBoxes5Hand] = useState('');
    const [boxes6Hand, setBoxes6Hand] = useState('');
    const [boxes8Hand, setBoxes8Hand] = useState('');
    const [notes, setNotes] = useState('');

    const totalBoxes =
        (parseInt(boxes4Hand) || 0) +
        (parseInt(boxes5Hand) || 0) +
        (parseInt(boxes6Hand) || 0) +
        (parseInt(boxes8Hand) || 0);

    const capacityPercent = Math.min((totalBoxes / CONTAINER_CAPACITY) * 100, 100);
    const isOverCapacity = totalBoxes > CONTAINER_CAPACITY;
    const remainingCapacity = CONTAINER_CAPACITY - totalBoxes;

    const outwardMutation = useMutation({
        mutationFn: (data: any) => coldStorageApi.createOutward(data),
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Outward Recorded',
                text2: `Container ${containerNumber} dispatched with ${totalBoxes} boxes to ${destination}.`,
            });
            queryClient.invalidateQueries({ queryKey: ['coldStorageInventory'] });
            queryClient.invalidateQueries({ queryKey: ['coldStorageOutwards'] });
            navigation.goBack();
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Server error' });
        },
    });

    const handleSubmit = () => {
        if (!containerNumber.trim()) {
            Toast.show({ type: 'error', text1: 'Container number is required' }); return;
        }
        if (!destination) {
            Toast.show({ type: 'error', text1: 'Please select a destination' }); return;
        }
        if (totalBoxes === 0) {
            Toast.show({ type: 'error', text1: 'Enter at least one box count' }); return;
        }
        if (isOverCapacity) {
            Alert.alert(
                '⚠️ Over Capacity',
                `Container capacity is ${CONTAINER_CAPACITY} boxes but you entered ${totalBoxes}. Please reduce the count.`
            );
            return;
        }

        outwardMutation.mutate({
            containerNumber: containerNumber.trim().toUpperCase(),
            destination,
            packingWeightType: selectedPackingWeight || undefined,
            boxes4Hand: parseInt(boxes4Hand) || 0,
            boxes5Hand: parseInt(boxes5Hand) || 0,
            boxes6Hand: parseInt(boxes6Hand) || 0,
            boxes8Hand: parseInt(boxes8Hand) || 0,
            dispatchDate: dispatchDate.toISOString().split('T')[0],
            notes: notes.trim() || undefined,
        });
    };

    const HandInput = ({ value, onChangeText, hand }: { value: string; onChangeText: (t: string) => void; hand: string }) => (
        <View style={styles.handRow}>
            <View style={styles.handLabelContainer}>
                <Text style={styles.handLabel}>{hand}-Hand</Text>
                <Text style={styles.handSub}>boxes</Text>
            </View>
            <GlassInput
                label=""
                value={value}
                onChangeText={onChangeText}
                keyboardType="numeric"
                placeholder="0"
                style={styles.handInput}
                icon={<Icon name="package-variant-closed" size={18} color={COLORS.text.muted} />}
            />
        </View>
    );

    return (
        <LinearGradient colors={['#0D1117', '#0F2027', '#1A1A2E']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Cold Storage Outward</Text>
                            <Text style={styles.headerSub}>Export container loading</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scroll}>
                        {/* Container Info */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="truck-delivery" size={16} color={COLORS.primary.main} />  Container Details
                            </Text>
                            <GlassInput
                                label="Container Number *"
                                value={containerNumber}
                                onChangeText={(t) => setContainerNumber(t.toUpperCase())}
                                placeholder="e.g. MSCU1234567"
                                autoCapitalize="characters"
                                icon={<Icon name="numeric" size={20} color={COLORS.text.muted} />}
                            />
                            {/* Dispatch Date */}
                            <Text style={styles.fieldLabel}>Dispatch Date</Text>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                                <Icon name="calendar-today" size={20} color={COLORS.primary.main} />
                                <Text style={styles.dateBtnText}>{dispatchDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal open={showDatePicker} date={dispatchDate} mode="date"
                                onConfirm={(d) => { setShowDatePicker(false); setDispatchDate(d); }}
                                onCancel={() => setShowDatePicker(false)}
                            />
                        </GlassCard>

                        {/* Destination */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="earth" size={16} color={COLORS.primary.main} />  Export Destination *
                            </Text>
                            <View style={styles.chipGrid}>
                                {EXPORT_DESTINATIONS.map(dest => (
                                    <TouchableOpacity
                                        key={dest}
                                        style={[styles.chip, destination === dest && styles.chipActive]}
                                        onPress={() => setDestination(dest)}
                                    >
                                        <Text style={[styles.chipText, destination === dest && styles.chipTextActive]}>{dest}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </GlassCard>

                        {/* Packing Weight Type */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="weight" size={16} color={COLORS.primary.main} />  Packing Weight Type
                            </Text>
                            <View style={styles.chipGrid}>
                                {PACKING_WEIGHT_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.chip, selectedPackingWeight === opt.value && styles.chipActive]}
                                        onPress={() => setSelectedPackingWeight(opt.value)}
                                    >
                                        <Text style={[styles.chipText, selectedPackingWeight === opt.value && styles.chipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </GlassCard>

                        {/* Hand Type Box Counts */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="cube-scan" size={16} color={COLORS.primary.main} />  Box Loading by Hand Type
                            </Text>
                            <HandInput value={boxes4Hand} onChangeText={setBoxes4Hand} hand="4" />
                            <HandInput value={boxes5Hand} onChangeText={setBoxes5Hand} hand="5" />
                            <HandInput value={boxes6Hand} onChangeText={setBoxes6Hand} hand="6" />
                            <HandInput value={boxes8Hand} onChangeText={setBoxes8Hand} hand="8" />

                            {/* Capacity Meter */}
                            <View style={styles.capacitySection}>
                                <View style={styles.capacityLabelRow}>
                                    <Text style={styles.capacityLabel}>Container Capacity</Text>
                                    <Text style={[
                                        styles.capacityValue,
                                        isOverCapacity ? { color: COLORS.status.error } : { color: COLORS.primary.main }
                                    ]}>
                                        {totalBoxes} / {CONTAINER_CAPACITY}
                                    </Text>
                                </View>
                                <View style={styles.capacityBar}>
                                    <View style={[
                                        styles.capacityFill,
                                        {
                                            width: `${capacityPercent}%` as any,
                                            backgroundColor: isOverCapacity ? COLORS.status.error : COLORS.primary.main,
                                        }
                                    ]} />
                                </View>
                                {isOverCapacity ? (
                                    <Text style={styles.overCapacityText}>
                                        ⚠️ Over capacity by {Math.abs(remainingCapacity)} boxes!
                                    </Text>
                                ) : (
                                    <Text style={styles.remainingText}>
                                        {remainingCapacity > 0 ? `${remainingCapacity} slots remaining` : 'Container full'}
                                    </Text>
                                )}
                            </View>
                        </GlassCard>

                        {/* Notes */}
                        <GlassCard style={styles.card}>
                            <GlassInput
                                label="Notes (Optional)"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                placeholder="Any remarks..."
                                icon={<Icon name="note-outline" size={20} color={COLORS.text.muted} />}
                            />
                        </GlassCard>

                        <GlassButton
                            title={`Dispatch Container — ${totalBoxes} Boxes`}
                            onPress={handleSubmit}
                            loading={outwardMutation.isPending}
                            variant="primary"
                            style={styles.submitBtn}
                            icon={<Icon name="truck-check" size={20} color="#000" />}
                            disabled={totalBoxes === 0 || isOverCapacity}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary },
    headerSub: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted },
    scroll: { padding: SPACING.lg, paddingBottom: 60 },
    card: { padding: SPACING.lg, marginBottom: SPACING.lg },
    cardTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: '700', color: COLORS.text.primary, marginBottom: SPACING.md },
    fieldLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '600', color: COLORS.text.primary, marginBottom: SPACING.xs, marginTop: SPACING.sm },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    dateBtnText: { color: COLORS.text.primary, fontSize: TYPOGRAPHY.sizes.md },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
    chipActive: { borderColor: COLORS.primary.main, backgroundColor: 'rgba(57,255,20,0.12)' },
    chipText: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.sm },
    chipTextActive: { color: COLORS.primary.main, fontWeight: '700' },
    handRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.md },
    handLabelContainer: { width: 70 },
    handLabel: { color: COLORS.text.primary, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.md },
    handSub: { color: COLORS.text.muted, fontSize: 10 },
    handInput: { flex: 1, marginBottom: 0 },
    capacitySection: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    capacityLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
    capacityLabel: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.sm, textTransform: 'uppercase' },
    capacityValue: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold' },
    capacityBar: { height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' },
    capacityFill: { height: '100%', borderRadius: 5 },
    overCapacityText: { marginTop: SPACING.xs, color: COLORS.status.error, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '600' },
    remainingText: { marginTop: SPACING.xs, color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.xs },
    submitBtn: { marginTop: SPACING.md },
});
