import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { authApi } from '../../services/api';
import { UserRole } from '../../types';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const SELECTABLE_ROLES = [
    { label: 'Manager', value: UserRole.MANAGER, icon: '👔', description: 'Manage farms & batches' },
    { label: 'Vendor', value: UserRole.VENDOR, icon: '🚜', description: 'Field operations' },
    { label: 'Store Keeper', value: UserRole.STORE_KEEPER, icon: '📦', description: 'Inventory & gate passes' },
];

const registerSchema = Yup.object().shape({
    fullName: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Full name is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    phone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
        .optional(),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    role: Yup.string()
        .oneOf([UserRole.MANAGER, UserRole.VENDOR, UserRole.STORE_KEEPER])
        .required('Please select a role'),
});

export const RegisterScreen: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation<NavigationProp>();

    const handleRegister = async (values: any) => {
        try {
            setIsLoading(true);
            const { confirmPassword, ...registerData } = values;
            const response = await authApi.register(registerData);

            if (response.data.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Registration Successful',
                    text2: 'Your account is pending Super Admin approval.',
                });
                navigation.navigate('Login');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Registration Failed',
                    text2: response.data.message || 'Something went wrong',
                });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error.response?.data?.message || 'Something went wrong',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={COLORS.background.gradient as string[]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🍌</Text>
                        </View>
                        <Text style={styles.appName}>Create Account</Text>
                        <Text style={styles.tagline}>Join Banana Harvest</Text>
                    </View>

                    {/* Register Form */}
                    <GlassCard style={styles.formCard} intensity="high">
                        <Formik
                            initialValues={{
                                fullName: '',
                                email: '',
                                phone: '',
                                password: '',
                                confirmPassword: '',
                                role: '',
                            }}
                            validationSchema={registerSchema}
                            onSubmit={handleRegister}
                        >
                            {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
                                <View style={styles.formContainer}>
                                    <GlassInput
                                        label="Full Name"
                                        placeholder="Enter your full name"
                                        value={values.fullName}
                                        onChangeText={handleChange('fullName')}
                                        autoCapitalize="words"
                                        error={touched.fullName && errors.fullName ? errors.fullName : undefined}
                                    />

                                    <GlassInput
                                        label="Email"
                                        placeholder="Enter your email"
                                        value={values.email}
                                        onChangeText={handleChange('email')}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        error={touched.email && errors.email ? errors.email : undefined}
                                    />

                                    <GlassInput
                                        label="Phone (Optional)"
                                        placeholder="Enter 10-digit phone number"
                                        value={values.phone}
                                        onChangeText={handleChange('phone')}
                                        keyboardType="phone-pad"
                                        error={touched.phone && errors.phone ? errors.phone : undefined}
                                    />

                                    <GlassInput
                                        label="Password"
                                        placeholder="Enter your password"
                                        value={values.password}
                                        onChangeText={handleChange('password')}
                                        secureTextEntry
                                        error={touched.password && errors.password ? errors.password : undefined}
                                    />

                                    <GlassInput
                                        label="Confirm Password"
                                        placeholder="Confirm your password"
                                        value={values.confirmPassword}
                                        onChangeText={handleChange('confirmPassword')}
                                        secureTextEntry
                                        error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
                                    />

                                    {/* Role Selector */}
                                    <View style={styles.roleSection}>
                                        <Text style={styles.roleLabel}>Select Your Role</Text>
                                        {touched.role && errors.role && (
                                            <Text style={styles.roleError}>{errors.role}</Text>
                                        )}
                                        <View style={styles.roleContainer}>
                                            {SELECTABLE_ROLES.map((role) => (
                                                <TouchableOpacity
                                                    key={role.value}
                                                    style={[
                                                        styles.roleCard,
                                                        values.role === role.value && styles.roleCardSelected,
                                                    ]}
                                                    onPress={() => setFieldValue('role', role.value)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.roleIcon}>{role.icon}</Text>
                                                    <Text style={[
                                                        styles.roleName,
                                                        values.role === role.value && styles.roleNameSelected,
                                                    ]}>
                                                        {role.label}
                                                    </Text>
                                                    <Text style={styles.roleDescription}>{role.description}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <GlassButton
                                        title="Create Account"
                                        onPress={handleSubmit}
                                        loading={isLoading}
                                        variant="primary"
                                        size="lg"
                                        style={styles.registerButton}
                                    />
                                </View>
                            )}
                        </Formik>
                    </GlassCard>

                    {/* Sign In Link */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        style={styles.signInLink}
                    >
                        <Text style={styles.signInText}>
                            Already have an account?{' '}
                            <Text style={styles.signInAccent}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.lg,
        paddingTop: SPACING['3xl'],
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.glass.background,
        borderWidth: 2,
        borderColor: COLORS.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        shadowColor: COLORS.primary.main,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    logoEmoji: {
        fontSize: 40,
    },
    appName: {
        fontSize: TYPOGRAPHY.sizes['3xl'],
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    tagline: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.secondary,
    },
    formCard: {
        marginBottom: SPACING.lg,
    },
    formContainer: {
        gap: SPACING.sm,
    },
    roleSection: {
        marginTop: SPACING.sm,
    },
    roleLabel: {
        fontSize: TYPOGRAPHY.sizes.md,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    roleError: {
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.status.error,
        marginBottom: SPACING.xs,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    roleCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.glass.background,
        borderWidth: 1,
        borderColor: COLORS.glass.border,
    },
    roleCardSelected: {
        borderColor: COLORS.primary.main,
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
        shadowColor: COLORS.primary.main,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    roleIcon: {
        fontSize: 24,
        marginBottom: SPACING.xs,
    },
    roleName: {
        fontSize: TYPOGRAPHY.sizes.sm,
        fontWeight: '600',
        color: COLORS.text.secondary,
        marginBottom: 2,
    },
    roleNameSelected: {
        color: COLORS.primary.main,
    },
    roleDescription: {
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.text.muted,
        textAlign: 'center',
    },
    registerButton: {
        marginTop: SPACING.md,
    },
    signInLink: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    signInText: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.secondary,
    },
    signInAccent: {
        color: COLORS.primary.main,
        fontWeight: '600',
    },
});
