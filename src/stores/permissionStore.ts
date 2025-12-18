import { create } from 'zustand';
import { AppSection, PermissionLevel } from '@/types/permissions';

interface PermissionState {
  permissions: Record<AppSection, PermissionLevel>;
  isLoading: boolean;
  isSuperAdmin: boolean;
  setPermissions: (permissions: Record<AppSection, PermissionLevel>) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSuperAdmin: (isSuperAdmin: boolean) => void;
  canView: (section: AppSection) => boolean;
  canEdit: (section: AppSection) => boolean;
  canRespond: (section: AppSection) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: {} as Record<AppSection, PermissionLevel>,
  isLoading: true,
  isSuperAdmin: false,
  setPermissions: (permissions) => set({ permissions }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSuperAdmin: (isSuperAdmin) => set({ isSuperAdmin }),
  canView: (section) => {
    const state = get();
    if (state.isSuperAdmin) return true;
    const perm = state.permissions[section];
    return perm !== 'no_access' && perm !== undefined;
  },
  canEdit: (section) => {
    const state = get();
    if (state.isSuperAdmin) return true;
    const perm = state.permissions[section];
    return perm === 'edit' || perm === 'respond';
  },
  canRespond: (section) => {
    const state = get();
    if (state.isSuperAdmin) return true;
    return state.permissions[section] === 'respond';
  },
}));
