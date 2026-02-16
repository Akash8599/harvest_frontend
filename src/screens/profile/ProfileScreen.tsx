import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList, UserRole } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const userRole = user?.role;

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
  };

  const MenuRow = ({ title, icon, onPress, isLast = false, variant = 'default' }: { title: string, icon: string, onPress: () => void, isLast?: boolean, variant?: 'default' | 'danger' }) => (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.menuRow, !isLast && styles.menuRowBorder]}>
        <View style={styles.menuLeft}>
          <View style={[styles.menuIconBox, variant === 'danger' ? styles.dangerIconBox : styles.defaultIconBox]}>
            <Icon name={icon} size={20} color={variant === 'danger' ? COLORS.status.error : COLORS.text.secondary} />
          </View>
          <Text style={[styles.menuText, variant === 'danger' && styles.dangerText]}>{title}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.text.muted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0D1117', '#0F2027', '#1A3A2F']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.heroContent}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[COLORS.primary.main, COLORS.accent.main]}
                  style={styles.avatarGradient}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{user?.fullName.charAt(0)}</Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={[styles.roleBadge, { backgroundColor: COLORS.glass.card }]}>
                <Icon name="shield-check" size={12} color={COLORS.primary.main} />
                <Text style={styles.roleText}>{user?.role.replace('_', ' ')}</Text>
              </View>

              <Text style={styles.userName}>{user?.fullName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            <GlassCard style={styles.menuGroup}>
              <MenuRow title="Account Settings" icon="account-cog-outline" onPress={() => { }} />
              <MenuRow title="Notifications" icon="bell-outline" onPress={() => { }} />
              <MenuRow title="Privacy & Security" icon="shield-lock-outline" onPress={() => { }} isLast />
            </GlassCard>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <GlassCard style={styles.menuGroup}>
              {user?.role === UserRole.SUPER_ADMIN && (
                <MenuRow title="Manage Users" icon="account-group-outline" onPress={() => navigation.navigate('UserApproval')} />
              )}
              <MenuRow title="Help Center" icon="help-circle-outline" onPress={() => { }} />
              <MenuRow title="Report an Issue" icon="alert-circle-outline" onPress={() => { }} isLast />
            </GlassCard>
          </View>

          {/* Logout */}
          <View style={styles.footerAction}>
            <GlassButton
              title="Logout"
              onPress={handleLogout}
              variant="secondary"
              icon={<Icon name="logout" size={20} color={COLORS.status.error} />}
              style={styles.logoutBtn}
            />
            <Text style={styles.versionText}>Harvest OS v1.0.2 (Build 2024)</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  hero: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  roleBadge: {
    // position: 'absolute', // Removed to prevent overlap
    // bottom: -12,
    // alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: 4,
    minWidth: 100,
    justifyContent: 'center',
    marginBottom: SPACING.sm, // Add space below
    marginTop: -SPACING.sm, // Pull up slightly closer to avatar if needed, or just standard flow
  },
  roleText: {
    fontSize: 10,
    color: COLORS.text.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  editProfileBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  editProfileText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  menuGroup: {
    padding: 0, // Reset default padding for group
    borderRadius: BORDER_RADIUS.xl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dangerIconBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
  },
  dangerText: {
    color: COLORS.status.error,
  },

  // Footer
  footerAction: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  versionText: {
    fontSize: 10,
    color: COLORS.text.muted,
  },
});
