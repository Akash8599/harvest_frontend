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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { launchCamera } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { coldStorageApi, farmApi } from '../../services/api';
import { PACKING_WEIGHT_OPTIONS, Batch } from '../../types';

export const ColdStorageInwardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();

    // Form state
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [inwardDate, setInwardDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedPackingWeight, setSelectedPackingWeight] = useState('');
    const [boxes4Hand, setBoxes4Hand] = useState('');
    const [boxes5Hand, setBoxes5Hand] = useState('');
    const [boxes6Hand, setBoxes6Hand] = useState('');
    const [boxes8Hand, setBoxes8Hand] = useState('');
    const [coldStorageName, setColdStorageName] = useState('');
    const [coldStorageLocation, setColdStorageLocation] = useState('');
    const [receiptPhotoUri, setReceiptPhotoUri] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    const totalBoxes =
        (parseInt(boxes4Hand) || 0) +
        (parseInt(boxes5Hand) || 0) +
        (parseInt(boxes6Hand) || 0) +
        (parseInt(boxes8Hand) || 0);

    // Fetch completed/harvest-done batches
    const { data: batches = [], isLoading: batchesLoading } = useQuery({
        queryKey: ['harvestCompletedBatches'],
        queryFn: async () => {
            const res = await farmApi.getAllBatches();
            return (res.data.data || []).filter(
                (b: Batch) =>
                    b.status === 'HARVEST_COMPLETED' ||
                    b.status === 'DISPATCH_IN_PROGRESS' ||
                    b.status === 'HARVEST_IN_PROGRESS'
            );
        },
    });

    const captureReceiptPhoto = async () => {
        launchCamera(
            { mediaType: 'photo', quality: 0.8, saveToPhotos: false },
            (response) => {
                if (response.assets && response.assets[0]?.uri) {
                    setReceiptPhotoUri(response.assets[0].uri);
                    Toast.show({ type: 'success', text1: 'Receipt photo captured' });
                }
            }
        );
    };

    const inwardMutation = useMutation({
        mutationFn: (data: any) => coldStorageApi.createInward(data),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Inward Recorded', text2: `${totalBoxes} boxes logged to cold storage.` });
            queryClient.invalidateQueries({ queryKey: ['coldStorageInventory'] });
            navigation.goBack();
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Server error' });
        },
    });

    const handleSubmit = () => {
        if (!selectedBatch) {
            Toast.show({ type: 'error', text1: 'Select a batch' }); return;
        }
        if (totalBoxes === 0) {
            Toast.show({ type: 'error', text1: 'Enter at least one box count' }); return;
        }
        if (!coldStorageName.trim()) {
            Toast.show({ type: 'error', text1: 'Cold storage name is required' }); return;
        }

        inwardMutation.mutate({
            batchId: selectedBatch.id,
            packingWeightType: selectedPackingWeight || undefined,
            boxes4Hand: parseInt(boxes4Hand) || 0,
            boxes5Hand: parseInt(boxes5Hand) || 0,
            boxes6Hand: parseInt(boxes6Hand) || 0,
            boxes8Hand: parseInt(boxes8Hand) || 0,
            coldStorageName: coldStorageName.trim(),
            coldStorageLocation: coldStorageLocation.trim() || undefined,
            receiptPhotoUrl: receiptPhotoUri || undefined,
            inwardDate: inwardDate.toISOString().split('T')[0],
            notes: notes.trim() || undefined,
        });
    };

    const HandInput = ({
        label, value, onChangeText, hand,
    }: { label: string; value: string; onChangeText: (t: string) => void; hand: string }) => (
        <View style={styles.handRow}>
            <View style={styles.handLabelContainer}>
                <Text style={styles.handLabel}>{hand}-Hand</Text>
                <Text style={styles.handSub}>{label}</Text>
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
        <LinearGradient colors={['#0D2137', '#0F2027', '#0A0F1C']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Cold Storage Inward</Text>
                            <Text style={styles.headerSub}>Log boxes into cold storage</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scroll}>
                        {/* Batch Selection */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="selection" size={16} color={COLORS.primary.main} />  Select Batch
                            </Text>
                            {batchesLoading ? (
                                <Text style={styles.muted}>Loading batches...</Text>
                            ) : batches.length === 0 ? (
                                <Text style={styles.muted}>No eligible batches found</Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.sm }}>
                                    {batches.map((b: Batch) => (
                                        <TouchableOpacity
                                            key={b.id}
                                            style={[styles.batchChip, selectedBatch?.id === b.id && styles.batchChipActive]}
                                            onPress={() => setSelectedBatch(b)}
                                        >
                                            <Text style={[styles.batchChipText, selectedBatch?.id === b.id && styles.batchChipTextActive]}>
                                                {b.farmName}
                                            </Text>
                                            <Text style={styles.batchChipSub}>#{b.batchId}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                            {selectedBatch && (
                                <View style={styles.selectedBatchInfo}>
                                    <Icon name="check-circle" size={16} color={COLORS.primary.main} />
                                    <Text style={styles.selectedBatchText}>
                                        {selectedBatch.farmName} — Batch #{selectedBatch.batchId}
                                    </Text>
                                </View>
                            )}
                        </GlassCard>

                        {/* Date */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="calendar" size={16} color={COLORS.primary.main} />  Inward Date
                            </Text>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                                <Icon name="calendar-today" size={20} color={COLORS.primary.main} />
                                <Text style={styles.dateBtnText}>{inwardDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal open={showDatePicker} date={inwardDate} mode="date"
                                maximumDate={new Date()}
                                onConfirm={(d) => { setShowDatePicker(false); setInwardDate(d); }}
                                onCancel={() => setShowDatePicker(false)}
                            />
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
                                <Icon name="cube-scan" size={16} color={COLORS.primary.main} />  Box Count by Hand Type
                            </Text>
                            <HandInput label="boxes" value={boxes4Hand} onChangeText={setBoxes4Hand} hand="4" />
                            <HandInput label="boxes" value={boxes5Hand} onChangeText={setBoxes5Hand} hand="5" />
                            <HandInput label="boxes" value={boxes6Hand} onChangeText={setBoxes6Hand} hand="6" />
                            <HandInput label="boxes" value={boxes8Hand} onChangeText={setBoxes8Hand} hand="8" />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Boxes</Text>
                                <Text style={styles.totalValue}>{totalBoxes}</Text>
                            </View>
                        </GlassCard>

                        {/* Cold Storage Details */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="snowflake" size={16} color={COLORS.primary.main} />  Cold Storage Details
                            </Text>
                            <GlassInput
                                label="Cold Storage Name *"
                                value={coldStorageName}
                                onChangeText={setColdStorageName}
                                placeholder="e.g. ABC Cold Storage"
                                icon={<Icon name="store" size={20} color={COLORS.text.muted} />}
                            />
                            <GlassInput
                                label="Location"
                                value={coldStorageLocation}
                                onChangeText={setColdStorageLocation}
                                placeholder="Address or city"
                                icon={<Icon name="map-marker-outline" size={20} color={COLORS.text.muted} />}
                            />
                        </GlassCard>

                        {/* Receipt Photo */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="receipt" size={16} color={COLORS.primary.main} />  Inward Receipt
                            </Text>
                            <TouchableOpacity
                                style={[styles.photoBtn, receiptPhotoUri ? styles.photoBtnDone : undefined]}
                                onPress={captureReceiptPhoto}
                            >
                                <Icon
                                    name={receiptPhotoUri ? 'check-circle' : 'camera-plus-outline'}
                                    size={28}
                                    color={receiptPhotoUri ? COLORS.status.success : COLORS.text.muted}
                                />
                                <Text style={[styles.photoBtnText, receiptPhotoUri ? { color: COLORS.status.success } : undefined]}>
                                    {receiptPhotoUri ? 'Receipt Captured ✓' : 'Capture Receipt Photo'}
                                </Text>
                            </TouchableOpacity>
                        </GlassCard>

                        {/* Notes */}
                        <GlassCard style={styles.card}>
                            <GlassInput
                                label="Notes (Optional)"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                placeholder="Any additional info..."
                                icon={<Icon name="note-outline" size={20} color={COLORS.text.muted} />}
                            />
                        </GlassCard>

                        <GlassButton
                            title={`Confirm Inward — ${totalBoxes} Boxes`}
                            onPress={handleSubmit}
                            loading={inwardMutation.isPending}
                            variant="primary"
                            style={styles.submitBtn}
                            icon={<Icon name="snowflake-check" size={20} color="#000" />}
                            disabled={totalBoxes === 0 || !selectedBatch}
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
    muted: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.sm },
    batchChip: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginRight: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    batchChipActive: { borderColor: COLORS.primary.main, backgroundColor: 'rgba(57,255,20,0.1)' },
    batchChipText: { color: COLORS.text.secondary, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '600' },
    batchChipTextActive: { color: COLORS.primary.main },
    batchChipSub: { color: COLORS.text.muted, fontSize: 10, marginTop: 2 },
    selectedBatchInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md, padding: SPACING.sm, backgroundColor: 'rgba(57,255,20,0.06)', borderRadius: BORDER_RADIUS.md },
    selectedBatchText: { color: COLORS.primary.main, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '600' },
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
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    totalLabel: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.sm, textTransform: 'uppercase', fontWeight: '600' },
    totalValue: { color: COLORS.primary.main, fontSize: TYPOGRAPHY.sizes['2xl'], fontWeight: 'bold' },
    photoBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.text.muted },
    photoBtnDone: { borderColor: COLORS.status.success, borderStyle: 'solid', backgroundColor: 'rgba(57,255,20,0.04)' },
    photoBtnText: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.md },
    submitBtn: { marginTop: SPACING.md },
});
