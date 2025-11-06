'use client';
import { STORAGE_KEYS } from '@/config/localStorageKeys';
import { readStorage, writeStorage } from '@/helpers/localStorageHelper';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// TYPES
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  user_type?: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  avatar_url?: string | null;
  last_login?: string | Date | null;

  specializations?: string[] | null;
  services?: string[] | null;
  education?: string[] | null;
  experience?: string[] | null;
  license_no?: string | null;
  experience_years?: number | null;
  bio?: string | null;
  doctor_id?: string | null;
  clinic_id?: string | null;
  clinic_name?: string | null;
  clinic_address?: string | null;
  status?: string | null;

}

interface Tokens {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresIn?: number | null;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
}

interface UserContextType {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  setAuthData: (data: { user?: User | null; tokens?: Tokens | null }) => void;
  clearAuthData: () => void;
  updateUserType: (type: string) => void;
  clinicDoctors: any[] | null;
  setClinicDoctors: (docs: any[]) => void;
  updateUserDetails: (updates: Partial<User>) => void;
}

// DEFAULT STATE
const defaultState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
};

function normalizeTokens(raw: any): Tokens | null {
  if (!raw) return null;
  return {
    accessToken: raw.accessToken ?? raw.access_token ?? null,
    refreshToken: raw.refreshToken ?? raw.refresh_token ?? null,
    tokenType: raw.tokenType ?? raw.token_type ?? null,
    expiresIn: raw.expiresIn ?? raw.expires_in ?? null,
  };
}

const UserContext = createContext<UserContextType>({
  user: null,
  tokens: null,
  isAuthenticated: false,
  setAuthData: () => { },
  clearAuthData: () => { },
  updateUserType: () => { },
  clinicDoctors: null,
  setClinicDoctors: () => { },
  updateUserDetails: () => { }
});


export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultState);
  const [clinicDoctors, setClinicDoctorsState] = useState<any[] | null>(null);

  const setAuthData = useCallback(({ user, tokens }: { user?: User | null; tokens?: Tokens | null }) => {
    setState((prev) => {
      const normalizedTokens = normalizeTokens(tokens);
      const newData: AuthState = {
        user: user !== undefined ? user : prev.user,
        tokens: tokens !== undefined ? normalizedTokens : prev.tokens,
        isAuthenticated: Boolean((normalizedTokens && (normalizedTokens.accessToken || normalizedTokens.refreshToken)) || user),
      };
      writeStorage(STORAGE_KEYS.user, newData.user);
      writeStorage(STORAGE_KEYS.tokens, newData.tokens);
      return newData;
    });
  }, []);

  const setClinicDoctors = useCallback((data: any[]) => {
    setClinicDoctorsState(data || []);
    writeStorage(STORAGE_KEYS.clinicDoctors, data)
  }, []);

  const clearAuthData = useCallback(() => {
    setState(defaultState);
    localStorage.clear();
  }, []);

  const updateUserType = useCallback((type: string) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, user_type: type };
      writeStorage(STORAGE_KEYS.user, updatedUser);
      return { ...prev, user: updatedUser };
    });
  }, []);

  const updateUserDetails = useCallback((updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates };
      writeStorage(STORAGE_KEYS.user, updatedUser);
      return { ...prev, user: updatedUser };
    });
  }, []);


  //Get Data from Local Storage on load
  useEffect(() => {
    const storedTokensRaw = readStorage(STORAGE_KEYS.tokens);
    const storedTokens = normalizeTokens(storedTokensRaw);
    const storedUser = readStorage<User>(STORAGE_KEYS.user);

    if (storedTokens || storedUser) {
      setAuthData({ user: storedUser ?? null, tokens: storedTokens ?? null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<UserContextType>(() => ({
    user: state.user,
    tokens: state.tokens,
    isAuthenticated: state.isAuthenticated,
    setAuthData,
    clearAuthData,
    updateUserType,
    clinicDoctors,
    setClinicDoctors,
    updateUserDetails
  }), [state.user, state.tokens, state.isAuthenticated, setAuthData, clearAuthData, updateUserType, clinicDoctors, setClinicDoctors]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}