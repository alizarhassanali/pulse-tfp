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
      // Check if user has a custom role assigned
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, custom_role_id, custom_roles(permissions)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      // If user has a custom role, use those permissions
      if (roleData?.custom_role_id && (roleData as any).custom_roles?.permissions) {
        const customPerms = (roleData as any).custom_roles.permissions as Record<AppSection, PermissionLevel>;
        setPermissions(customPerms);
      } else {
        // Use default permissions based on built-in role
        const role = roleData?.role || userRole;
        const defaultPerms = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.read_only;
        setPermissions(defaultPerms);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Fall back to default permissions based on role
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
