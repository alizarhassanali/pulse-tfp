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
  custom_role_id?: string | null;
  custom_role_name?: string | null;
  brands: string[];
  locations: string[];
  permissions: SectionPermission[];
}

export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<AppSection, PermissionLevel>;
  created_at: string;
  updated_at: string;
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
    description: 'Full access to all brands, locations, and settings',
    color: 'bg-destructive'
  },
  brand_admin: { 
    label: 'Brand Admin', 
    description: 'Manage assigned brands and respond to reviews',
    color: 'bg-primary'
  },
  clinic_manager: { 
    label: 'Clinic Manager', 
    description: 'View data and respond to reviews for assigned locations',
    color: 'bg-info'
  },
  staff: { 
    label: 'Staff', 
    description: 'View-only access to assigned brands/locations',
    color: 'bg-success'
  },
  read_only: { 
    label: 'Read Only', 
    description: 'View-only access, no actions allowed',
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

// Get all app sections as array
export const ALL_SECTIONS: AppSection[] = [
  'dashboard',
  'questions',
  'sent_logs',
  'manage_events',
  'integration',
  'reviews',
  'contacts',
  'templates',
  'brands',
  'users',
];

// Permission level options for dropdowns
export const PERMISSION_OPTIONS: { value: PermissionLevel; label: string }[] = [
  { value: 'no_access', label: 'No Access' },
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'Edit' },
  { value: 'respond', label: 'Respond' },
];
