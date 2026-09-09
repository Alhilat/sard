import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, tokenStorage } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'individual' | 'org' | 'admin' | string;
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  country?: string;
  joinDate?: string;
  organizationId?: string;
  status?: string;
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'individual' | 'org' | string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = tokenStorage.get();
    if (!savedToken) return null;
    const savedUser = tokenStorage.getUser<User>();
    if (savedUser && savedUser.id && savedUser.name) return savedUser;
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Strictly verify the token and load the authenticated user
  useEffect(() => {
    const storedToken = tokenStorage.get();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      tokenStorage.remove();
      return;
    }

    setToken(storedToken);
    api.get<any>('/users/me')
      .then((userData) => {
        if (userData && userData.id && userData.email) {
          // Strictly set the real verified user
          setUser(userData);
          tokenStorage.setUser(userData);
        } else {
          // Invalid payload -> clear session
          tokenStorage.remove();
          setToken(null);
          setUser(null);
        }
      })
      .catch((_err: any) => {
        // Token is invalid, expired, or user is banned -> clear session immediately
        tokenStorage.remove();
        setToken(null);
        setUser(null);
      });
  }, []);

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'individual' | 'org' | string;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);
    const normalizedEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    if (!cleanName) {
      setIsLoading(false);
      return { success: false, error: 'يرجى كتابة الاسم بالكامل' };
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'يرجى إدخال بريد إلكتروني صالح' };
    }
    if (!data.password || data.password.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن ٦ أحرف' };
    }

    try {
      const result = await api.post<{ success: boolean; token: string; user: User; message?: string }>('/auth/register', {
        email: normalizedEmail,
        password: data.password,
        role: data.role === 'org' ? 'organization' : 'individual',
        full_name: cleanName,
        phone: data.phone?.trim() || '',
      });

      if (result && result.token && result.user) {
        tokenStorage.set(result.token);
        setToken(result.token);
        tokenStorage.setUser(result.user);
        setUser(result.user);
        setIsLoading(false);
        return { success: true, user: result.user };
      }

      setIsLoading(false);
      return { success: false, error: result?.message || 'تعذر إنشاء الحساب، يرجى المحاولة ثانية' };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'حدث خطأ أثناء إنشاء الحساب، يرجى التأكد من البيانات',
      };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setIsLoading(false);
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' };
    }

    try {
      const result = await api.post<{ success: boolean; token: string; user: User; message?: string }>('/auth/login', {
        email: normalizedEmail,
        password,
      });

      if (result && result.token && result.user) {
        tokenStorage.set(result.token);
        setToken(result.token);
        tokenStorage.setUser(result.user);
        setUser(result.user);
        setIsLoading(false);
        return { success: true, user: result.user };
      }

      setIsLoading(false);
      return { success: false, error: result?.message || 'بيانات الدخول غير صحيحة' };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة ثانية.',
      };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updated = await api.patch<User>('/users/me', updates);
      if (updated && updated.id) {
        setUser(updated);
        tokenStorage.setUser(updated);
        return;
      }
    } catch {
      // Fallback local update for optimistic UI
    }

    const optimistic: User = { ...user, ...updates };
    setUser(optimistic);
    tokenStorage.setUser(optimistic);
  };

  const logout = () => {
    tokenStorage.remove();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
