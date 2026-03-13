import React, { useState, useMemo } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';
import { launchCamera } from 'react-native-image-picker';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { harvestApi, farmApi } from '../../services/api';
import { RootStackParamList, DailyHarvestRequest, PACKING_WEIGHT_OPTIONS } from '../../types';

type SubmitHarvestRouteProp = RouteProp<RootStackParamList, 'SubmitHarvest'>;

const LABOR_PAYMENT_OPTIONS = [
    { label: 'Paid', value: 'PAID' },
    { label: 'Partial', value: 'PARTIAL' },
    { label: 'Pending', value: 'PENDING' },
];

export const SubmitHarvestScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<SubmitHarvestRouteProp>();
    const { batch } = route.params;
    const queryClient = useQueryClient();

    // --- Section 1: Packing ---
    const [packingWeightType, setPackingWeightType] = useState('');
    const [boxesPacked, setBoxesPacked] = useState('');
    const [reportDate, setReportDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- Section 2: Damaged Boxes ---
    const [damagedBoxes, setDamagedBoxes] = useState('');
    const [damagedPhotoUri, setDamagedPhotoUri] = useState<string | null>(null);

    // --- Section 3: Wastage ---
    const [wastageWeightKg, setWastageWeightKg] = useState('');
    const [boxesWasted, setBoxesWasted] = useState('');
    const [wastagePhotoUri, setWastagePhotoUri] = useState<string | null>(null);

    // --- Section 4: Local Transport (Odometer) ---
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [odometerStart, setOdometerStart] = useState('');
    const [odometerEnd, setOdometerEnd] = useState('');
    const [odometerStartPhotoUri, setOdometerStartPhotoUri] = useState<string | null>(null);
    const [odometerEndPhotoUri, setOdometerEndPhotoUri] = useState<string | null>(null);
    const [ratePerKm, setRatePerKm] = useState('');

    // --- Section 5: Toll & Documents ---
    const [tollAmount, setTollAmount] = useState('');
    const [tollPhotoUri, setTollPhotoUri] = useState<string | null>(null);
    const [weighBridgePhotoUri, setWeighBridgePhotoUri] = useState<string | null>(null);

    // --- Section 6: Labor ---
    const [laborCount, setLaborCount] = useState('');
    const [laborCost, setLaborCost] = useState('');
    const [laborPaymentStatus, setLaborPaymentStatus] = useState('PAID');

    // --- Section 7: Notes ---
    const [notes, setNotes] = useState('');

    // Auto-calculate transport
    const distanceKm = useMemo(() => {
        const start = parseFloat(odometerStart);
        const end = parseFloat(odometerEnd);
        if (!isNaN(start) && !isNaN(end) && end > start) return end - start;
        return 0;
    }, [odometerStart, odometerEnd]);

    const transportCost = useMemo(() => {
        const rate = parseFloat(ratePerKm);
        if (!isNaN(rate) && distanceKm > 0) return (distanceKm * rate).toFixed(2);
        return '0';
    }, [distanceKm, ratePerKm]);

    // Batch remaining calculation
    const allocated = batch.allocatedBoxes ?? batch.estimatedBoxes ?? 0;
    const harvested = batch.harvestedBoxes ?? batch.actualBoxes ?? 0;
    const remaining = batch.harvestRemaining ?? batch.remainingBoxes ?? (allocated - harvested);

    const capturePhoto = async (
        onCapture: (uri: string) => void,
        label = 'Photo'
    ) => {
        launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (response) => {
            if (response.assets?.[0]?.uri) {
                onCapture(response.assets[0].uri);
                Toast.show({ type: 'success', text1: `${label} captured` });
            }
        });
    };

    const submitMutation = useMutation({
        mutationFn: (data: DailyHarvestRequest) => harvestApi.createDailyReport(data),
        onSuccess: async () => {
            if (batch.status === 'CREATED' || batch.status === 'APPROVED') {
                try {
                    await farmApi.updateBatchStatus(batch.id, 'HARVEST_IN_PROGRESS');
                } catch (err) {
                    console.error('Failed to update batch status', err);
                }
            }
            Toast.show({ type: 'success', text1: 'Harvest Report Submitted' });
            queryClient.invalidateQueries({ queryKey: ['todayReports'] });
            queryClient.invalidateQueries({ queryKey: ['batch', batch.id] });
            queryClient.invalidateQueries({ queryKey: ['batchDetails', batch.id] });
            queryClient.invalidateQueries({ queryKey: ['allBatches'] });
            queryClient.invalidateQueries({ queryKey: ['batchHarvest', batch.id] });
            navigation.goBack();
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Submission Failed',
                text2: error.response?.data?.message || 'Please try again',
            });
        },
    });

    const handleSubmit = () => {
        if (!boxesPacked) {
            Toast.show({ type: 'error', text1: 'Enter boxes packed' }); return;
        }
        if (!laborCount) {
            Toast.show({ type: 'error', text1: 'Enter labor count' }); return;
        }

        const entering = parseInt(boxesPacked);
        if (entering > remaining) {
            Toast.show({
                type: 'error',
                text1: 'Limit Exceeded',
                text2: `Only ${remaining} boxes remaining.`,
            }); return;
        }

        const request: DailyHarvestRequest = {
            batchId: batch.id,
            reportDate: reportDate.toISOString().split('T')[0],
            packingWeightType: packingWeightType || undefined,
            boxesPacked: entering,
            damagedBoxes: parseInt(damagedBoxes) || 0,
            damagedBoxPhotoUrls: damagedPhotoUri ? [damagedPhotoUri] : undefined,
            wastageWeightKg: parseFloat(wastageWeightKg) || undefined,
            boxesWasted: parseInt(boxesWasted) || 0,
            wastagePhotoUrl: wastagePhotoUri || undefined,
            vehicleNumber: vehicleNumber.trim() || undefined,
            odometerStartKm: parseFloat(odometerStart) || undefined,
            odometerEndKm: parseFloat(odometerEnd) || undefined,
            odometerStartPhotoUrl: odometerStartPhotoUri || undefined,
            odometerEndPhotoUrl: odometerEndPhotoUri || undefined,
            ratePerKm: parseFloat(ratePerKm) || undefined,
            tollAmount: parseFloat(tollAmount) || undefined,
            tollReceiptPhotoUrl: tollPhotoUri || undefined,
            weighBridgePhotoUrl: weighBridgePhotoUri || undefined,
            laborCount: parseInt(laborCount),
            laborCost: parseFloat(laborCost) || undefined,
            laborPaymentStatus,
            notes: notes.trim() || undefined,
        };

        submitMutation.mutate(request);
    };

    const PhotoCaptureTile = ({
        label, uri, onCapture,
    }: { label: string; uri: string | null; onCapture: () => void }) => (
        <TouchableOpacity
            style={[styles.photoTile, uri ? styles.photoTileDone : undefined]}
            onPress={onCapture}
        >
            <Icon
                name={uri ? 'check-circle' : 'camera-plus'}
                size={22}
                color={uri ? COLORS.status.success : COLORS.text.muted}
            />
            <Text style={[styles.photoTileText, uri ? { color: COLORS.status.success } : undefined]}>
                {uri ? `${label} ✓` : label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#0F5132', '#0F2027', '#0A0F1C']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="chevron-left" size={32} color={COLORS.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Submit Harvest</Text>
                    <View style={{ width: 32 }} />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Batch Info Card */}
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
                                    <Text style={styles.statValue}>{allocated}</Text>
                                    <Text style={styles.statLabel}>Allocated</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={styles.statValue}>{harvested}</Text>
                                    <Text style={styles.statLabel}>Harvested</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={[styles.statValue, remaining <= 10 && { color: COLORS.status.error }]}>
                                        {remaining}
                                    </Text>
                                    <Text style={styles.statLabel}>Remaining</Text>
                                </View>
                            </View>
                        </GlassCard>

                        {/* ─── SECTION 1: Packing ─── */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}><Icon name="package-variant-closed" size={18} color={COLORS.primary.main} /></View>
                            <Text style={styles.sectionTitle}>1. Packing Details</Text>
                        </View>
                        <GlassCard style={styles.sectionCard}>
                            {/* Report Date */}
                            <Text style={styles.fieldLabel}>Report Date</Text>
                            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                                <Icon name="calendar" size={24} color={COLORS.primary.main} />
                                <Text style={styles.dateText}>{reportDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            <DatePicker modal open={showDatePicker} date={reportDate} mode="date" maximumDate={new Date()}
                                onConfirm={(d) => { setShowDatePicker(false); setReportDate(d); }}
                                onCancel={() => setShowDatePicker(false)} />

                            {/* Packing Weight Type */}
                            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Packing Weight Type</Text>
                            <View style={styles.chipRow}>
                                {PACKING_WEIGHT_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.chip, packingWeightType === opt.value && styles.chipActive]}
                                        onPress={() => setPackingWeightType(opt.value)}
                                    >
                                        <Text style={[styles.chipText, packingWeightType === opt.value && styles.chipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <GlassInput label="Boxes Packed *" value={boxesPacked} onChangeText={setBoxesPacked}
                                keyboardType="numeric" placeholder={`Max ${remaining}`}
                                icon={<Icon name="package-variant-closed" size={20} color={COLORS.text.muted} />} />
                        </GlassCard>

                        {/* ─── SECTION 2: Damaged Boxes ─── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(255,100,100,0.15)' }]}>
                                <Icon name="package-variant-closed" size={18} color={COLORS.status.error} />
                            </View>
                            <Text style={styles.sectionTitle}>2. Damaged Boxes</Text>
                        </View>
                        <GlassCard style={styles.sectionCard}>
                            <GlassInput label="Damaged Box Count" value={damagedBoxes} onChangeText={setDamagedBoxes}
                                keyboardType="numeric" placeholder="0"
                                icon={<Icon name="close-box-outline" size={20} color={COLORS.status.error} />} />
                            <PhotoCaptureTile label="Damaged Box Photo"
                                uri={damagedPhotoUri}
                                onCapture={() => capturePhoto(setDamagedPhotoUri, 'Damaged box photo')} />
                        </GlassCard>

                        {/* ─── SECTION 3: Wastage ─── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(255,165,0,0.15)' }]}>
                                <Icon name="delete-outline" size={18} color={COLORS.status.warning} />
                            </View>
                            <Text style={styles.sectionTitle}>3. Wastage</Text>
                        </View>
                        <GlassCard style={styles.sectionCard}>
                            <GlassInput label="Wastage Weight (kg)" value={wastageWeightKg} onChangeText={setWastageWeightKg}
                                keyboardType="numeric" placeholder="0.0"
                                icon={<Icon name="weight" size={20} color={COLORS.status.warning} />} />
                            <GlassInput label="Wasted Boxes" value={boxesWasted} onChangeText={setBoxesWasted}
                                keyboardType="numeric" placeholder="0"
                                icon={<Icon name="delete-outline" size={20} color={COLORS.status.error} />} />
                            <PhotoCaptureTile label="Wastage Photo"
                                uri={wastagePhotoUri}
                                onCapture={() => capturePhoto(setWastagePhotoUri, 'Wastage photo')} />
                        </GlassCard>

                        {/* ─── SECTION 4: Local Transport ─── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(100,180,255,0.15)' }]}>
                                <Icon name="truck" size={18} color={COLORS.status.info} />
                            </View>
                            <Text style={styles.sectionTitle}>4. Local Transport</Text>
                        </View>
                        <GlassCard style={styles.sectionCard}>
                            <GlassInput label="Vehicle Number" value={vehicleNumber} onChangeText={(t) => setVehicleNumber(t.toUpperCase())}
                                placeholder="e.g. MH01AB1234" autoCapitalize="characters"
                                icon={<Icon name="car" size={20} color={COLORS.text.muted} />} />
                            <GlassInput label="Odometer Start (km)" value={odometerStart} onChangeText={setOdometerStart}
                                keyboardType="numeric" placeholder="Start reading"
                                icon={<Icon name="speedometer" size={20} color={COLORS.text.muted} />} />
                            <PhotoCaptureTile label="Odometer Start Photo"
                                uri={odometerStartPhotoUri}
                                onCapture={() => capturePhoto(setOdometerStartPhotoUri, 'Odometer start')} />
                            <GlassInput label="Odometer End (km)" value={odometerEnd} onChangeText={setOdometerEnd}
                                keyboardType="numeric" placeholder="End reading"
                                icon={<Icon name="speedometer" size={20} color={COLORS.text.muted} />} />
                            <PhotoCaptureTile label="Odometer End Photo"
                                uri={odometerEndPhotoUri}
                                onCapture={() => capturePhoto(setOdometerEndPhotoUri, 'Odometer end')} />
                            <GlassInput label="Rate per km (₹)" value={ratePerKm} onChangeText={setRatePerKm}
                                keyboardType="numeric" placeholder="0.00"
                                icon={<Icon name="currency-inr" size={20} color={COLORS.accent.main} />} />

                            {/* Auto-calculated summary */}
                            {distanceKm > 0 && (
                                <View style={styles.calcRow}>
                                    <View style={styles.calcItem}>
                                        <Text style={styles.calcLabel}>Distance</Text>
                                        <Text style={styles.calcValue}>{distanceKm} km</Text>
                                    </View>
                                    <Icon name="close" size={14} color={COLORS.text.muted} />
                                    <View style={styles.calcItem}>
                                        <Text style={styles.calcLabel}>Rate</Text>
                                        <Text style={styles.calcValue}>₹{ratePerKm || '0'}/km</Text>
                                    </View>
                                    <Icon name="equal" size={14} color={COLORS.text.muted} />
                                    <View style={styles.calcItem}>
                                        <Text style={styles.calcLabel}>Cost</Text>
                                        <Text style={[styles.calcValue, { color: COLORS.primary.main }]}>₹{transportCost}</Text>
                                    </View>
                                </View>
                            )}
                        </GlassCard>

                        {/* ─── SECTION 5: Toll & Documents ─── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(200,150,255,0.15)' }]}>
                                <Icon name="receipt" size={18} color="#C896FF" />
                            </View>
                            <Text style={styles.sectionTitle}>5. Toll & Documents</Text>
                        </View>
                        <GlassCard style={styles.sectionCard}>
                            <GlassInput label="Toll Amount (₹)" value={tollAmount} onChangeText={setTollAmount}
                                keyboardType="numeric" placeholder="0.00"
                                icon={<Icon name="cash" size={20} color={COLORS.accent.main} />} />
                            <View style={styles.photoRow}>
                                <View style={{ flex: 1 }}>
                                    <PhotoCaptureTile label="Toll Receipt"
                                        uri={tollPhotoUri}
                                        onCapture={() => capturePhoto(setTollPhotoUri, 'Toll receipt')} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <PhotoCaptureTile label="Weigh Bridge"
                                        uri={weighBridgePhotoUri}
                                        onCapture={() => capturePhoto(setWeighBridgePhotoUri, 'Weigh bridge')} />
                                </View>
                            </View>
                        </GlassCard>

                        {/* ─── SECTION 6: Labor ─── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(57,255,20,0.12)' }]}>
                                <Icon name="account-group" size={18} color={COLORS.primary.main} />
                            </View>
                            <Text style={styles.sectionTitle}>6. Labor</Text>
                        </View>
                        <GlassCard style={styles.sectionCard}>
                            <GlassInput label="Number of Workers *" value={laborCount} onChangeText={setLaborCount}
                                keyboardType="numeric" placeholder="Enter worker count"
                                icon={<Icon name="account-group" size={20} color={COLORS.text.muted} />} />
                            <GlassInput label="Total Labor Cost (₹)" value={laborCost} onChangeText={setLaborCost}
                                keyboardType="numeric" placeholder="Optional"
                                icon={<Icon name="cash" size={20} color={COLORS.accent.main} />} />

                            <Text style={[styles.fieldLabel, { marginTop: SPACING.sm }]}>Payment Status</Text>
                            <View style={styles.chipRow}>
                                {LABOR_PAYMENT_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.chip, laborPaymentStatus === opt.value && styles.chipActive]}
                                        onPress={() => setLaborPaymentStatus(opt.value)}
                                    >
                                        <Text style={[styles.chipText, laborPaymentStatus === opt.value && styles.chipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </GlassCard>

                        {/* ─── SECTION 7: Notes ─── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                                <Icon name="note-outline" size={18} color={COLORS.text.muted} />
                            </View>
                            <Text style={styles.sectionTitle}>7. Additional Notes</Text>
                        </View>
                        <GlassCard style={styles.sectionCard}>
                            <GlassInput label="Notes" placeholder="Any additional observations..." value={notes} onChangeText={setNotes}
                                multiline numberOfLines={4}
                                icon={<Icon name="notebook" size={20} color={COLORS.text.muted} />} />
                        </GlassCard>

                        <GlassButton
                            title="Submit Harvest Report"
                            onPress={handleSubmit}
                            loading={submitMutation.isPending}
                            style={styles.submitButton}
                            icon={<Icon name="check-circle-outline" size={20} color="#000" />}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
    backButton: { padding: SPACING.xs },
    headerTitle: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary },
    scrollContent: { padding: SPACING.lg, paddingBottom: 80 },
    // Batch card
    batchCard: { marginBottom: SPACING.xl, padding: SPACING.lg },
    batchHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
    farmName: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.text.primary },
    batchCode: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: SPACING.md },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    stat: { alignItems: 'center' },
    statValue: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.primary.main },
    statLabel: { fontSize: 10, color: COLORS.text.muted, textTransform: 'uppercase' },
    // Section Headers
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm, marginTop: SPACING.sm },
    sectionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(57,255,20,0.1)', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: '700', color: COLORS.text.primary },
    sectionCard: { padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.sm },
    // Date
    fieldLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '600', color: COLORS.text.primary, marginBottom: SPACING.xs },
    dateSelector: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.05)', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: SPACING.sm },
    dateText: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.primary },
    // Chips
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
    chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
    chipActive: { borderColor: COLORS.primary.main, backgroundColor: 'rgba(57,255,20,0.12)' },
    chipText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted },
    chipTextActive: { color: COLORS.primary.main, fontWeight: '700' },
    // Photo tiles
    photoTile: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)', marginBottom: SPACING.sm },
    photoTileDone: { borderStyle: 'solid', borderColor: COLORS.status.success, backgroundColor: 'rgba(57,255,20,0.04)' },
    photoTileText: { color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.sm },
    photoRow: { flexDirection: 'row', gap: SPACING.sm },
    // Transport calc
    calcRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(57,255,20,0.05)', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: 'rgba(57,255,20,0.15)' },
    calcItem: { alignItems: 'center' },
    calcLabel: { fontSize: 10, color: COLORS.text.muted, textTransform: 'uppercase' },
    calcValue: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold', color: COLORS.text.primary },
    // Submit
    submitButton: { marginTop: SPACING.xl },
});
