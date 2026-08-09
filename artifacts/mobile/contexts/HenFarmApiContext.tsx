import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification } from '@/constants/types';

import { Platform } from 'react-native';

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  return 'http://192.168.100.5:3000/api';
};

export const API_URL = getApiUrl();

// Types
export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  referralCode: string;
  referredBy?: string;
  referralFirstOrderDiscountUsed: boolean;
  completedReferralCount: number;
  location?: string;
  rating?: number;
  verified?: boolean;
  easyPaisaAccount?: string;
  jazzCashAccount?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountTitle?: string;
  whatsappNumber?: string;
  availableHens: number;
  henSellPrice: number;
  hensOwned: number;
  availableEggs: number;
  eggBuyRate: number;
  dealerResponseMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// Every real egg-earning event - daily hen yield and referral bonuses. The
// app never holds or moves money. All buy-hen/sell-egg payments happen
// directly between buyer and seller.
export interface ReferralActivity {
  _id: string;
  userId: string;
  type: 'referral-egg-bonus' | 'hen-egg-yield';
  quantity: number;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface HenFarmContextType {
  user: ApiUser | null;
  hensOwned: number;      // real hens owned from completed buy-hen orders
  availableEggs: number;  // real egg stock credited daily (1 egg/hen/day) - must be sold to a dealer for cash, never auto-paid
  referralActivity: ReferralActivity[];
  totalEggsEarned: number; // lifetime sum of every egg ever credited (hen yield + referral bonuses)
  notifications: AppNotification[];
  unreadCount: number;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<ApiUser>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  // Referral (real eggs only, never cash; see routes/orders.ts applyReferralRewardsOnFirstOrder)
  myReferralCode: string;
  completedReferralCount: number;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  // Loading & refresh
  isLoaded: boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Auth token - every protected backend route requires this as a Bearer
  // header. Use authFetch below instead of raw fetch() for any /orders,
  // /admin or authenticated /auth call.
  token: string | null;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const HenFarmContext = createContext<HenFarmContextType | undefined>(undefined);

// Standalone helper (no closures over component state) so the app-boot flow
// can call it with a token freshly read from storage, before React state has
// caught up.
async function rawApiCall(endpoint: string, method: string = 'GET', data?: any, authToken?: string | null) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const options: RequestInit = { method, headers };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export function HenFarmProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [referralActivity, setReferralActivity] = useState<ReferralActivity[]>([]);
  const [totalEggsEarned, setTotalEggsEarned] = useState(0);

  // API Helper - uses the current token from state
  const apiCall = useCallback((endpoint: string, method: string = 'GET', data?: any) => {
    return rawApiCall(endpoint, method, data, token);
  }, [token]);

  // Reusable authenticated fetch for screens that need custom fetch calls
  // (marketplace, orders, admin) instead of the success-wrapped apiCall.
  const authFetch = useCallback((url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }, [token]);

  const loadUserData = useCallback(async (userId: string, authToken?: string | null) => {
    setIsLoading(true);
    try {
      const effectiveToken = authToken !== undefined ? authToken : token;
      const userResult = await rawApiCall(`/auth/user/${userId}`, 'GET', undefined, effectiveToken);
      setUser(userResult.user);

      const activityResult = await rawApiCall(`/orders/referral-activity/${userId}`, 'GET', undefined, effectiveToken);
      setReferralActivity(activityResult.activity);
      setTotalEggsEarned(activityResult.totalEarned || 0);
    } catch (error) {
      console.error('Failed to load user data:', error);
      throw error; // Re-throw so the caller can handle it
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load user ID + token from storage and fetch data
  useEffect(() => {
    (async () => {
      try {
        const [userId, storedToken] = await Promise.all([
          AsyncStorage.getItem('@henfarm/userId'),
          AsyncStorage.getItem('@henfarm/token'),
        ]);

        if (userId && storedToken) {
          setToken(storedToken);
          try {
            await loadUserData(userId, storedToken);
          } catch (loadErr) {
            // Failed to load user data - clear stored session and continue
            console.log('Failed to load user data, clearing storage');
            await AsyncStorage.multiRemove(['@henfarm/userId', '@henfarm/token']);
            setToken(null);
          }
        } else if (userId) {
          // Legacy session saved before auth tokens existed - must re-login.
          await AsyncStorage.removeItem('@henfarm/userId');
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const refreshData = useCallback(async () => {
    if (user?._id) {
      await loadUserData(user._id);
    }
  }, [user?._id, loadUserData]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await rawApiCall('/auth/login', 'POST', { email, password });

      setUser(result.user);
      setToken(result.token);
      await AsyncStorage.setItem('@henfarm/userId', result.user._id);
      await AsyncStorage.setItem('@henfarm/token', result.token);
      await loadUserData(result.user._id, result.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData]);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string, referralCode?: string) => {
    setIsLoading(true);
    try {
      const phoneNumber = phone || `030${Date.now().toString().slice(-8)}`;

      const result = await rawApiCall('/auth/register', 'POST', {
        name,
        email,
        password,
        phone: phoneNumber,
        referralCode,
      });

      setUser(result.user);
      setToken(result.token);
      await AsyncStorage.setItem('@henfarm/userId', result.user._id);
      await AsyncStorage.setItem('@henfarm/token', result.token);
      await loadUserData(result.user._id, result.token);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['@henfarm/userId', '@henfarm/token']);
    setUser(null);
    setToken(null);
    setReferralActivity([]);
    setTotalEggsEarned(0);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<ApiUser>) => {
    if (!user) throw new Error('No user logged in');
    setIsLoading(true);
    try {
      const result = await apiCall(`/auth/profile/${user._id}`, 'PATCH', updates);
      setUser(result.user);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, apiCall]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    setIsLoading(true);
    try {
      await apiCall('/auth/change-password', 'POST', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, apiCall]);

  const markNotificationRead = useCallback((id: string) => {
    // Stub for now
  }, []);

  const markAllRead = useCallback(() => {
    // Stub for now
  }, []);

  return (
    <HenFarmContext.Provider
      value={{
        user,
        hensOwned: user?.hensOwned || 0,
        availableEggs: user?.availableEggs || 0,
        referralActivity,
        totalEggsEarned,
        notifications: [],
        unreadCount: 0,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        myReferralCode: user?.referralCode || '',
        completedReferralCount: user?.completedReferralCount || 0,
        markNotificationRead,
        markAllRead,
        isLoaded,
        isLoading,
        refreshData,
        token,
        authFetch,
      }}
    >
      {children}
    </HenFarmContext.Provider>
  );
}

export function useHenFarm() {
  const context = useContext(HenFarmContext);
  if (!context) throw new Error('useHenFarm must be used within HenFarmProvider');
  return context;
}
