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

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { authApi } from '../../services/api';
import { UserRole, VendorType, CreateUserRequest } from '../../types';

const SELECTABLE_ROLES = [
    { label: 'Supervisor', value: UserRole.MANAGER },
    { label: 'Vendor', value: UserRole.VENDOR },
    { label: 'Store Keeper', value: UserRole.STORE_KEEPER },
    { label: 'Accounts', value: UserRole.ACCOUNTS },
];

const VENDOR_TYPES = [
    { label: 'Harvesting', value: VendorType.HARVESTING },
    { label: 'Packing Material', value: VendorType.PACKING_MATERIAL },
    { label: 'Box Supplier', value: VendorType.BOX_SUPPLIER },
    { label: 'Cold Storage', value: VendorType.COLD_STORAGE },
    { label: 'CHA', value: VendorType.CHA },
    { label: 'Transporter', value: VendorType.TRANSPORTER },
];

function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const CreateUserScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.VENDOR);
    const [selectedVendorType, setSelectedVendorType] = useState<VendorType | null>(null);
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [generatedPassword] = useState(generatePassword());

    const isVendor = selectedRole === UserRole.VENDOR;

    const createMutation = useMutation({
        mutationFn: (data: CreateUserRequest) => authApi.createUser(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
            Alert.alert(
                '✅ User Created',
                `Account credentials:\n\nEmail: ${email}\nPassword: ${generatedPassword}\n\nShare these with the user securely.`,
                [{ text: 'Done', onPress: () => navigation.goBack() }]
            );
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to Create User',
                text2: err.response?.data?.message || 'Server error',
            });
        },
    });

    const handleCreate = () => {
        if (!fullName.trim()) {
            Toast.show({ type: 'error', text1: 'Full name is required' }); return;
        }
        if (!email.trim() || !email.includes('@')) {
            Toast.show({ type: 'error', text1: 'Valid email is required' }); return;
        }
        if (isVendor && !selectedVendorType) {
            Toast.show({ type: 'error', text1: 'Vendor type is required for Vendor role' }); return;
        }

        const data: CreateUserRequest = {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || undefined,
            password: generatedPassword,
            role: selectedRole,
            vendorType: isVendor ? selectedVendorType! : undefined,
            bankName: isVendor && bankName ? bankName.trim() : undefined,
            accountNumber: isVendor && accountNumber ? accountNumber.trim() : undefined,
            ifscCode: isVendor && ifscCode ? ifscCode.trim() : undefined,
        };

        createMutation.mutate(data);
    };

    const RoleOption = ({ role, label }: { role: UserRole; label: string }) => (
        <TouchableOpacity
            style={[styles.optionBtn, selectedRole === role && styles.optionBtnActive]}
            onPress={() => setSelectedRole(role)}
        >
            <Text style={[styles.optionText, selectedRole === role && styles.optionTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    const VendorTypeOption = ({ type, label }: { type: VendorType; label: string }) => (
        <TouchableOpacity
            style={[styles.optionBtn, selectedVendorType === type && styles.optionBtnActive]}
            onPress={() => setSelectedVendorType(type)}
        >
            <Text style={[styles.optionText, selectedVendorType === type && styles.optionTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#0D1117', '#0F2027', '#1A3A2F']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create New User</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Basic Info */}
                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                <Icon name="account" size={16} color={COLORS.primary.main} /> Basic Information
                            </Text>
                            <GlassInput label="Full Name *" value={fullName} onChangeText={setFullName} placeholder="Enter full name"
                                icon={<Icon name="account-outline" size={20} color={COLORS.text.muted} />} />
                            <GlassInput label="Email Address *" value={email} onChangeText={setEmail} placeholder="user@example.com"
                                keyboardType="email-address" autoCapitalize="none"
                                icon={<Icon name="email-outline" size={20} color={COLORS.text.muted} />} />
                            <GlassInput label="Phone Number" value={phone} onChangeText={setPhone} placeholder="Optional"
                                keyboardType="phone-pad"
                                icon={<Icon name="phone-outline" size={20} color={COLORS.text.muted} />} />
                        </GlassCard>

                        {/* Role Selection */}
                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                <Icon name="shield-account" size={16} color={COLORS.primary.main} /> Role Assignment
                            </Text>
                            <View style={styles.optionGrid}>
                                {SELECTABLE_ROLES.map(r => (
                                    <RoleOption key={r.value} role={r.value} label={r.label} />
                                ))}
                            </View>
                        </GlassCard>

                        {/* Vendor Type (only if VENDOR) */}
                        {isVendor && (
                            <GlassCard style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    <Icon name="briefcase" size={16} color={COLORS.primary.main} /> Vendor Type *
                                </Text>
                                <View style={styles.optionGrid}>
                                    {VENDOR_TYPES.map(v => (
                                        <VendorTypeOption key={v.value} type={v.value} label={v.label} />
                                    ))}
                                </View>
                            </GlassCard>
                        )}

                        {/* Bank Details (only for VENDORs) */}
                        {isVendor && (
                            <GlassCard style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    <Icon name="bank" size={16} color={COLORS.primary.main} /> Bank Details
                                </Text>
                                <Text style={styles.hint}>Required for payment processing</Text>
                                <GlassInput label="Bank Name" value={bankName} onChangeText={setBankName} placeholder="e.g. State Bank of India"
                                    icon={<Icon name="bank-outline" size={20} color={COLORS.text.muted} />} />
                                <GlassInput label="Account Number" value={accountNumber} onChangeText={setAccountNumber} placeholder="Account number"
                                    keyboardType="numeric"
                                    icon={<Icon name="credit-card-outline" size={20} color={COLORS.text.muted} />} />
                                <GlassInput label="IFSC Code" value={ifscCode} onChangeText={(t) => setIfscCode(t.toUpperCase())} placeholder="e.g. SBIN0001234"
                                    autoCapitalize="characters"
                                    icon={<Icon name="identifier" size={20} color={COLORS.text.muted} />} />
                            </GlassCard>
                        )}

                        {/* Password Preview */}
                        <GlassCard style={[styles.section, { backgroundColor: 'rgba(57,255,20,0.04)' }]}>
                            <Text style={styles.sectionTitle}>
                                <Icon name="key-variant" size={16} color={COLORS.primary.main} /> Generated Password
                            </Text>
                            <View style={styles.passwordRow}>
                                <Text style={styles.password}>{generatedPassword}</Text>
                                <Icon name="shield-check" size={18} color={COLORS.primary.main} />
                            </View>
                            <Text style={styles.hint}>Share this password with the user securely after creation.</Text>
                        </GlassCard>

                        <GlassButton
                            title="Create User Account"
                            onPress={handleCreate}
                            loading={createMutation.isPending}
                            variant="primary"
                            style={styles.createBtn}
                            icon={<Icon name="account-plus" size={20} color="#000" />}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        flex: 1, textAlign: 'center',
        fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary,
    },
    scrollContent: { padding: SPACING.lg, paddingBottom: 60 },
    section: { padding: SPACING.lg, marginBottom: SPACING.lg },
    sectionTitle: {
        fontSize: TYPOGRAPHY.sizes.md, fontWeight: '700',
        color: COLORS.text.primary, marginBottom: SPACING.md,
    },
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    optionBtn: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    optionBtnActive: {
        borderColor: COLORS.primary.main,
        backgroundColor: 'rgba(57,255,20,0.12)',
    },
    optionText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted, fontWeight: '500' },
    optionTextActive: { color: COLORS.primary.main, fontWeight: '700' },
    passwordRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
        borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)',
    },
    password: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.primary.main,
        letterSpacing: 2,
    },
    hint: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: SPACING.xs },
    createBtn: { marginTop: SPACING.md },
});
