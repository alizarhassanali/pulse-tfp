// Permission types for RBAC system
export type PermissionLevel = 'no_access' | 'view' | 'edit' | 'respond';

export type AppSection = 
  | 'dashboard'
  | 'questions'
  | 'sent_logs'
  | 'manage_events'
  | 'integration'
  | 'reviews'
  | 'contacts'
  | 'templates'
  | 'brands'
  | 'users';

export type AppRole = 'super_admin' | 'brand_admin' | 'clinic_manager' | 'staff' | 'read_only';

export interface SectionPermission {
  section: AppSection;
  permission: PermissionLevel;
}

export interface UserWithAccess {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  status: string;
  role: AppRole;
  brands: string[];
  locations: string[];
  permissions: SectionPermission[];
}

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<AppRole, Record<AppSection, PermissionLevel>> = {
  super_admin: {
    dashboard: 'edit',
    questions: 'edit',
    sent_logs: 'edit',
    manage_events: 'edit',
    integration: 'edit',
    reviews: 'respond',
    contacts: 'edit',
    templates: 'edit',
    brands: 'edit',
    users: 'edit',
  },
  brand_admin: {
    dashboard: 'view',
    questions: 'edit',
    sent_logs: 'view',
    manage_events: 'edit',
    integration: 'edit',
    reviews: 'respond',
    contacts: 'edit',
    templates: 'edit',
    brands: 'no_access',
    users: 'no_access',
  },
  clinic_manager: {
    dashboard: 'view',
    questions: 'view',
    sent_logs: 'view',
    manage_events: 'view',
    integration: 'view',
    reviews: 'respond',
    contacts: 'view',
    templates: 'view',
    brands: 'no_access',
    users: 'no_access',
  },
  staff: {
    dashboard: 'view',
    questions: 'view',
    sent_logs: 'view',
    manage_events: 'no_access',
    integration: 'no_access',
    reviews: 'view',
    contacts: 'view',
    templates: 'no_access',
    brands: 'no_access',
    users: 'no_access',
  },
  read_only: {
    dashboard: 'view',
    questions: 'view',
    sent_logs: 'view',
    manage_events: 'no_access',
    integration: 'no_access',
    reviews: 'view',
    contacts: 'view',
    templates: 'no_access',
    brands: 'no_access',
    users: 'no_access',
  },
};

// Section display configuration
export const SECTION_CONFIG: Record<AppSection, { label: string; group: string; supportsRespond?: boolean }> = {
  dashboard: { label: 'Dashboard', group: 'NPS' },
  questions: { label: 'Questions', group: 'NPS' },
  sent_logs: { label: 'Sent Logs', group: 'NPS' },
  manage_events: { label: 'Manage Events', group: 'NPS' },
  integration: { label: 'Integration', group: 'NPS' },
  reviews: { label: 'Reviews', group: 'Reviews', supportsRespond: true },
  contacts: { label: 'Contacts', group: 'Contacts' },
  templates: { label: 'Templates', group: 'Settings' },
  brands: { label: 'Brands', group: 'Settings' },
  users: { label: 'Users', group: 'Settings' },
};

// Role display configuration
export const ROLE_CONFIG: Record<AppRole, { label: string; description: string; color: string }> = {
  super_admin: { 
    label: 'Super Admin', 
    description: 'Full access across all brands and locations',
    color: 'bg-destructive'
  },
  brand_admin: { 
    label: 'Brand Admin', 
    description: 'Manage assigned brands and locations',
    color: 'bg-primary'
  },
  clinic_manager: { 
    label: 'Clinic Manager', 
    description: 'Manage specific clinic locations',
    color: 'bg-info'
  },
  staff: { 
    label: 'Staff', 
    description: 'View and limited edit access',
    color: 'bg-success'
  },
  read_only: { 
    label: 'Read Only', 
    description: 'View-only access, can export data',
    color: 'bg-muted-foreground'
  },
};

// Helper function to check if permission level allows viewing
export function canView(permission: PermissionLevel): boolean {
  return permission !== 'no_access';
}

// Helper function to check if permission level allows editing
export function canEdit(permission: PermissionLevel): boolean {
  return permission === 'edit' || permission === 'respond';
}

// Helper function to check if permission level allows responding (for reviews)
export function canRespond(permission: PermissionLevel): boolean {
  return permission === 'respond';
}
