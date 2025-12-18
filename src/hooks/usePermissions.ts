import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { 
  AppSection, 
  PermissionLevel, 
  DEFAULT_PERMISSIONS,
  canView as checkCanView,
  canEdit as checkCanEdit,
  canRespond as checkCanRespond
} from '@/types/permissions';

interface UsePermissionsReturn {
  permissions: Record<AppSection, PermissionLevel>;
  isLoading: boolean;
  canViewSection: (section: AppSection) => boolean;
  canEditSection: (section: AppSection) => boolean;
  canRespondSection: (section: AppSection) => boolean;
  isSuperAdmin: boolean;
  refetch: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, roles } = useAuthStore();
  const [permissions, setPermissions] = useState<Record<AppSection, PermissionLevel>>(
    {} as Record<AppSection, PermissionLevel>
  );
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = roles.some(r => r.role === 'super_admin');
  const userRole = roles[0]?.role || 'read_only';

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Super admins have full access
    if (isSuperAdmin) {
      setPermissions(DEFAULT_PERMISSIONS.super_admin);
      setIsLoading(false);
      return;
    }

    try {
      // Use type assertion since the table may not be in generated types yet
      const { data, error } = await (supabase
        .from('user_section_permissions' as any)
        .select('section, permission')
        .eq('user_id', user.id) as any);

      if (error) throw error;

      // Start with default permissions based on role
      const defaultPerms = DEFAULT_PERMISSIONS[userRole as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.read_only;
      const perms = { ...defaultPerms };

      // Override with specific permissions from database
      if (data && data.length > 0) {
        data.forEach((p: { section: string; permission: string }) => {
          perms[p.section as AppSection] = p.permission as PermissionLevel;
        });
      }

      setPermissions(perms);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Fall back to default permissions
      const defaultPerms = DEFAULT_PERMISSIONS[userRole as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.read_only;
      setPermissions(defaultPerms);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin, userRole]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const canViewSection = useCallback((section: AppSection): boolean => {
    if (isSuperAdmin) return true;
    return checkCanView(permissions[section] || 'no_access');
  }, [permissions, isSuperAdmin]);

  const canEditSection = useCallback((section: AppSection): boolean => {
    if (isSuperAdmin) return true;
    return checkCanEdit(permissions[section] || 'no_access');
  }, [permissions, isSuperAdmin]);

  const canRespondSection = useCallback((section: AppSection): boolean => {
    if (isSuperAdmin) return true;
    return checkCanRespond(permissions[section] || 'no_access');
  }, [permissions, isSuperAdmin]);

  return {
    permissions,
    isLoading,
    canViewSection,
    canEditSection,
    canRespondSection,
    isSuperAdmin,
    refetch: fetchPermissions,
  };
}
