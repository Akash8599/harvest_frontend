import { UserRole } from '../types';

// ============================================
// API Configuration
// ============================================
export const API_BASE_URL = 'http://192.168.31.118:8080/api';
export const API_TIMEOUT = 30000;

// ============================================
// Storage Keys
// ============================================
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

// ============================================
// COLORS - GLASSMORPHISM SPEC COMPLIANT
// ============================================
export const COLORS = {
  // Background Gradient (Deep Dark Navy) - SPEC REQUIRED
  background: {
    dark: '#0A0F1C',
    gradient: ['#0F5132', '#0F2027', '#0A0F1C'],
    radialGlow: 'rgba(34,197,94,0.12)',
  },

  // Primary Green (Active & Highlights) - SPEC REQUIRED
  primary: {
    main: '#22C55E', // Primary green - EXACT
    dark: '#16A34A', // Secondary gradient endpoint - EXACT
    light: 'rgba(34,197,94,0.1)',
    glow: 'rgba(34,197,94,0.35)',
  },

  // Secondary Colors (kept for compatibility)
  secondary: {
    light: '#064E3B',
    main: '#0B3D2E',
    dark: '#022C22',
  },

  // Accent Colors
  accent: {
    light: '#67E8F9',
    main: '#00E5FF',
    dark: '#0891B2',
    glow: 'rgba(0, 229, 255, 0.5)',
  },

  // Glassmorphism Cards - SPEC REQUIRED
  glass: {
    background: 'rgba(255,255,255,0.04)', // EXACT
    backgroundHover: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)', // EXACT
    borderLight: 'rgba(255,255,255,0.10)',
  },

  // Text Colors - SPEC REQUIRED
  text: {
    primary: '#FFFFFF', // EXACT
    secondary: '#94A3B8', // EXACT
    muted: '#64748B', // EXACT
    accent: '#22C55E', // EXACT
  },

  // Status Colors
  status: {
    success: '#22C55E', // Green
    error: '#EF4444', // Red
    warning: '#F59E0B', // Amber
    info: '#3B82F6', // Blue
    pending: '#F59E0B',
  },

  // Badges - SPEC REQUIRED
  badge: {
    success: {
      background: 'rgba(34,197,94,0.15)',
      text: '#22C55E',
      border: 'rgba(34,197,94,0.25)',
    },
    error: {
      background: 'rgba(239,68,68,0.15)',
      text: '#EF4444',
      border: 'rgba(239,68,68,0.25)',
    },
    warning: {
      background: 'rgba(245,158,11,0.15)',
      text: '#F59E0B',
      border: 'rgba(245,158,11,0.25)',
    },
    info: {
      background: 'rgba(59,130,246,0.15)',
      text: '#3B82F6',
      border: 'rgba(59,130,246,0.25)',
    },
  },

  // Input Fields - SPEC REQUIRED
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    placeholder: '#64748B',
    text: '#FFFFFF',
  },

  // Navigation - SPEC REQUIRED
  nav: {
    background: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    active: '#22C55E',
    inactive: '#64748B',
  },

  // Modal & Overlays
  overlay: {
    dark: 'rgba(0,0,0,0.85)',
    semi: 'rgba(0,0,0,0.5)',
  },

  // Button Styles - SPEC REQUIRED
  button: {
    primaryGradient: ['#22C55E', '#16A34A'], // EXACT
    secondaryBg: 'rgba(255,255,255,0.05)',
    secondaryBorder: 'rgba(255,255,255,0.10)',
    shadow: 'rgba(34,197,94,0.35)',
  },

  // Gradient Presets (legacy - kept for compatibility)
  gradients: {
    primary: ['#22C55E', '#16A34A'],
    accent: ['#00E5FF', '#67E8F9'],
    glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
    glow: ['rgba(57, 255, 20, 0.3)', 'transparent'],
  },
};

// ============================================
// TYPOGRAPHY
// ============================================
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 28,
    '3xl': 32,
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// ============================================
// SPACING
// ============================================
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

// ============================================
// BORDER RADIUS
// ============================================
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 18,
  '3xl': 22,
  full: 999,
};

// ============================================
// SHADOWS - PREMIUM ENTERPRISE STYLE
// ============================================
export const SHADOWS = {
  // Glass Card Shadow - SPEC REQUIRED
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 5,
  },

  // Button Glow Shadow - SPEC REQUIRED
  buttonGlow: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },

  // Subtle Shadow
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 2,
  },

  // Modal Shadow
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 10,
  },

  // Legacy sizes (for compatibility)
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
  glow: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
};

// ============================================
// BLUR VALUES - FOR GLASSMORPHISM
// ============================================
export const BLUR = {
  card: 20,
  input: 20,
  nav: 25,
  modal: 30,
};

// ============================================
// ANIMATION CONFIGURATIONS
// ============================================
export const ANIMATIONS = {
  default: {
    duration: 300,
    useNativeDriver: true,
  },
  slow: {
    duration: 500,
    useNativeDriver: true,
  },
  fast: {
    duration: 150,
    useNativeDriver: true,
  },
  spring: {
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  },
};

// ============================================
// GLASS EFFECT PRESETS
// ============================================
export const GLASS_EFFECT = {
  card: {
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: BORDER_RADIUS['2xl'],
    ...SHADOWS.card,
  },
  button: {
    backgroundColor: COLORS.button.secondaryBg,
    borderWidth: 1,
    borderColor: COLORS.button.secondaryBorder,
    borderRadius: BORDER_RADIUS.lg,
  },
  input: {
    backgroundColor: COLORS.input.background,
    borderWidth: 1,
    borderColor: COLORS.input.border,
    borderRadius: BORDER_RADIUS.lg,
  },
};

// ============================================
// ROLE-BASED NAVIGATION ITEMS
// ============================================
export const ROLE_NAV_ITEMS = {
  [UserRole.SUPER_ADMIN]: ['dashboard', 'farms', 'batches', 'inventory', 'sales', 'reports', 'users', 'profile'],
  [UserRole.MANAGER]: ['dashboard', 'farms', 'batches', 'inventory', 'sales', 'reports', 'profile'],
  [UserRole.VENDOR]: ['dashboard', 'my-batches', 'inspections', 'harvest', 'my-ledger', 'profile'],
  [UserRole.STORE_KEEPER]: ['dashboard', 'inventory', 'gate-passes', 'profile'],
};

// ============================================
// ERROR MESSAGES
// ============================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// ============================================
// SUCCESS MESSAGES
// ============================================
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  CREATED: 'Created successfully!',
  UPDATED: 'Updated successfully!',
  DELETED: 'Deleted successfully!',
  SAVED: 'Saved successfully!',
  SUBMITTED: 'Submitted successfully!',
  APPROVED: 'Approved successfully!',
  REJECTED: 'Rejected successfully!',
};
