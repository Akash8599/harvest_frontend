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
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { LoginRequest } from '../../types';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = async (values: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(values);

      if (response.data.success && response.data.data) {
        // Defensive check: If backend returns token but user is inactive
        if (response.data.data.isActive === false) {
          Toast.show({
            type: 'error',
            text1: 'Account Pending Approval',
            text2: 'Please wait for Super Admin approval.',
          });
          setIsLoading(false);
          return;
        }

        setAuth(response.data.data);
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${response.data.data.fullName} !`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response.data.message || 'Invalid credentials',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
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
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🍌</Text>
            </View>
            <Text style={styles.appName}>Banana Harvest</Text>
            <Text style={styles.tagline}>Smart Farm Management</Text>
          </View>

          {/* Login Form */}
          <GlassCard style={styles.formCard} intensity="high">
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
            >
              {({ handleChange, handleSubmit, values, errors, touched }) => (
                <View style={styles.formContainer}>
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
                    label="Password"
                    placeholder="Enter your password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    secureTextEntry
                    error={touched.password && errors.password ? errors.password : undefined}
                  />

                  <GlassButton
                    title="Sign In"
                    onPress={handleSubmit}
                    loading={isLoading}
                    variant="primary"
                    size="lg"
                    style={styles.loginButton}
                  />
                </View>
              )}
            </Formik>
          </GlassCard>

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.signUpLink}
          >
            <Text style={styles.signUpText}>
              Don't have an account?{' '}
              <Text style={styles.signUpAccent}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footerText}>
            Banana Harvesting & Costing App v1.0
          </Text>
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
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    fontSize: 50,
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
    marginBottom: SPACING.xl,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  formContainer: {
    gap: SPACING.sm,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  signUpLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  signUpText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
  },
  signUpAccent: {
    color: COLORS.primary.main,
    fontWeight: '600',
  },
});
