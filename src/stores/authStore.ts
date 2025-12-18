import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  timezone: string;
  avatar_url: string | null;
}

interface UserRole {
  role: 'super_admin' | 'brand_admin' | 'clinic_manager' | 'staff' | 'read_only';
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setRoles: (roles: UserRole[]) => void;
  setIsLoading: (loading: boolean) => void;
  isSuperAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setRoles: (roles) => set({ roles }),
  setIsLoading: (isLoading) => set({ isLoading }),
  isSuperAdmin: () => get().roles.some((r) => r.role === 'super_admin'),
  hasRole: (role) => get().roles.some((r) => r.role === role),
  clearAuth: () => set({ user: null, session: null, profile: null, roles: [] }),
}));
