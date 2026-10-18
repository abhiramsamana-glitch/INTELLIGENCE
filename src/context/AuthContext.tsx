import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";
import { api, getToken, setToken, removeToken } from "../services/api";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sendOtp: (email: string) => Promise<{ success: boolean; message: string; debugCode?: string }>;
  verifyOtp: (email: string, code: string, fullName?: string) => Promise<void>;
  loginWithDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.getMe();
      setUser(res.user);
    } catch (err: any) {
      console.warn("Session check failed:", err.message);
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const sendOtp = async (email: string) => {
    setError(null);
    try {
      return await api.auth.sendOtp(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const verifyOtp = async (email: string, code: string, fullName?: string) => {
    setError(null);
    try {
      const res = await api.auth.verifyOtp(email, code, fullName);
      setToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithDemo = async () => {
    setError(null);
    try {
      const res = await api.auth.demoLogin();
      setToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {}
    removeToken();
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    setError(null);
    try {
      const res = await api.auth.updateProfile(data);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const exportData = async () => {
    await api.auth.exportData();
  };

  const deleteAccount = async () => {
    try {
      await api.auth.deleteAccount();
      removeToken();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        sendOtp,
        verifyOtp,
        loginWithDemo,
        logout,
        updateProfile,
        exportData,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
