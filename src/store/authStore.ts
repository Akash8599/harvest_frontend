import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginResponse, UserRole } from '../types';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (data: LoginResponse) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Getters
  getUserRole: () => UserRole | null;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isVendor: () => boolean;
  isStoreKeeper: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (data: LoginResponse) => {
        const user: User = {
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          isActive: true,
          profileImageUrl: data.profileImageUrl,
          createdAt: new Date().toISOString(),
        };

        set({
          user,
          token: data.token,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Getters
      getUserRole: () => {
        return get().user?.role || null;
      },

      hasRole: (roles: UserRole[]) => {
        const userRole = get().user?.role;
        return userRole ? roles.includes(userRole) : false;
      },

      isAdmin: () => {
        return get().user?.role === UserRole.SUPER_ADMIN;
      },

      isManager: () => {
        return get().user?.role === UserRole.MANAGER;
      },

      isVendor: () => {
        return get().user?.role === UserRole.VENDOR;
      },

      isStoreKeeper: () => {
        return get().user?.role === UserRole.STORE_KEEPER;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
