# Technical Architecture — OttoPulse

> **Last updated:** 2026-03-30
> **Cross-references:** [claude.md](./claude.md) · [database.md](./database.md) · [ui_spec.md](./ui_spec.md)

---

## 1. Directory Structure

```
src/
├── App.tsx                      # Root: routes, AuthProvider, ProtectedRoute
├── main.tsx                     # Entry point: renders App
├── index.css                    # Global styles, CSS variables, Tailwind layers
├── components/
│   ├── ui/                      # shadcn/ui primitives + custom UI components
│   │   ├── button.tsx           # Button variants (default, destructive, outline, etc.)
│   │   ├── card.tsx             # Card, CardHeader, CardContent, CardFooter
│   │   ├── dialog.tsx           # Modal dialogs
│   │   ├── page-header.tsx      # Reusable page title + actions
│   │   ├── metric-card.tsx      # KPI display card
│   │   ├── score-badge.tsx      # NPS score color-coded badge
│   │   ├── status-badge.tsx     # Invitation status badge
│   │   ├── channel-badge.tsx    # Email/SMS channel indicator
│   │   ├── bulk-action-bar.tsx  # Multi-select action bar
│   │   ├── empty-state.tsx      # Empty list placeholder
│   │   ├── loading-skeleton.tsx # Shimmer loading states
│   │   ├── sortable-table-head.tsx # Clickable sort headers
│   │   ├── column-visibility-toggle.tsx # Show/hide columns
│   │   ├── multi-select.tsx     # Multi-select with checkboxes
│   │   └── ... (all shadcn primitives)
│   ├── layout/
│   │   ├── MainLayout.tsx       # Sidebar + TopNav + Outlet
│   │   ├── Sidebar.tsx          # Collapsible nav with permission filtering
│   │   ├── TopNav.tsx           # Brand/location/date global filters
│   │   ├── GlobalFilters.tsx    # Filter dropdowns component
│   │   ├── HelpSupportMenu.tsx  # Help menu in sidebar
│   │   └── PlaybookContent.tsx  # Playbook page content
│   ├── nps/
│   │   ├── ResponseDetailModal.tsx # Full response viewer
│   │   ├── AnswerDisplay.tsx    # Type-aware answer rendering
│   │   ├── FeedbackCategorySelect.tsx
│   │   ├── InternalNotesSection.tsx
│   │   └── SetAlertModal.tsx
│   ├── contacts/
│   │   ├── ContactDetailsModal.tsx
│   │   ├── EditContactModal.tsx
│   │   ├── DuplicateDetectionModal.tsx
│   │   ├── ImportHistoryModal.tsx
│   │   └── ContactTagsSelect.tsx
│   ├── distribution/
│   │   ├── SendWizard.tsx       # Manual survey send
│   │   ├── AutomatedSendsTab.tsx # Wrapper for integration cards
│   │   ├── ShareLinkTab.tsx     # Link + QR code sharing
│   │   ├── SftpIntegrationCard.tsx
│   │   ├── WebhookIntegrationCard.tsx
│   │   ├── OttoOnboardCard.tsx
│   │   └── SftpSyncHistoryModal.tsx
│   ├── events/
│   │   ├── EventSetupTab.tsx
│   │   └── EventQuestionsTab.tsx
│   ├── users/
│   │   ├── InviteUserWizard.tsx # Multi-step user invite/edit
│   │   ├── ManageRolesTab.tsx   # Custom role management
│   │   └── CreateRoleModal.tsx
│   └── resources/
│       └── CreateResourceModal.tsx
├── pages/
│   ├── Auth.tsx                 # Login/signup page
│   ├── Index.tsx                # Redirects to /nps/dashboard
│   ├── NotFound.tsx
│   ├── nps/
│   │   ├── Dashboard.tsx        # NPS metrics + charts
│   │   ├── Questions.tsx        # Response list + detail
│   │   ├── SentLogs.tsx         # Invitation tracking
│   │   ├── ManageEvents.tsx     # Event list with Send/Automate actions
│   │   ├── CreateEvent.tsx      # 5-step event wizard
│   │   └── EventDetail.tsx      # Send + Automate tabs
│   ├── contacts/
│   │   ├── AllContacts.tsx      # Contact list + import + duplicates
│   │   └── Unsubscribed.tsx
│   ├── settings/
│   │   ├── Profile.tsx
│   │   ├── Templates.tsx
│   │   ├── AutomationRules.tsx
│   │   ├── Brands.tsx           # Brand + location management
│   │   ├── ReviewSettings.tsx
│   │   └── Users.tsx            # User + role management
│   ├── Reviews.tsx
│   ├── Resources.tsx
│   ├── ResourceDetail.tsx
│   └── Playbook.tsx
├── hooks/
│   ├── usePermissions.ts        # RBAC permission checks
│   ├── useSortableTable.ts      # Table sort state management
│   ├── useBrandLocationContext.ts # Brand/location scoped data
│   ├── use-mobile.tsx           # Mobile breakpoint detection
│   └── use-toast.ts             # Toast hook (shadcn)
├── stores/
│   ├── authStore.ts             # User, session, profile, roles
│   ├── filterStore.ts           # Global filters (persisted)
│   └── permissionStore.ts       # Computed permission checks
├── types/
│   ├── database.ts              # Domain model interfaces
│   └── permissions.ts           # RBAC types + defaults
├── data/
│   └── demo-data.ts             # Fallback data (brands, locations, events, contacts)
├── integrations/
│   └── supabase/
│       ├── client.ts            # Auto-generated Supabase client (DO NOT EDIT)
│       └── types.ts             # Auto-generated DB types (DO NOT EDIT)
├── lib/
│   └── utils.ts                 # cn() utility for Tailwind class merging
└── App.css                      # Additional global styles

supabase/
├── config.toml                  # Supabase project configuration
├── functions/
│   └── categorize-feedback/
│       └── index.ts             # AI feedback categorization edge function
└── migrations/                  # SQL migration files (DO NOT EDIT directly)
```

---

## 2. Routing Architecture

```typescript
// Simplified route tree from App.tsx
<Routes>
  <Route path="/auth" element={<Auth />} />
  <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
    <Route index element={<Navigate to="/nps/dashboard" />} />
    
    {/* NPS Module */}
    <Route path="nps/dashboard" element={<NPSDashboard />} />
    <Route path="nps/questions" element={<NPSQuestions />} />
    <Route path="nps/sent-logs" element={<SentLogs />} />
    <Route path="nps/manage-events" element={<ManageEvents />} />
    <Route path="nps/events/create" element={<CreateEvent />} />
    <Route path="nps/events/:id/edit" element={<CreateEvent />} />
    <Route path="nps/events/:id" element={<EventDetail />} />
    
    {/* Reviews */}
    <Route path="reviews" element={<Reviews />} />
    
    {/* Resources */}
    <Route path="resources" element={<Resources />} />
    <Route path="resources/playbook" element={<Playbook />} />
    <Route path="resources/:id" element={<ResourceDetail />} />
    
    {/* Contacts */}
    <Route path="contacts" element={<AllContacts />} />
    <Route path="contacts/unsubscribe" element={<Unsubscribed />} />
    
    {/* Settings */}
    <Route path="settings/profile" element={<ProfileSettings />} />
    <Route path="settings/templates" element={<Templates />} />
    <Route path="settings/automations" element={<AutomationRules />} />
    <Route path="settings/brands" element={<Brands />} />
    <Route path="settings/reviews" element={<ReviewSettings />} />
    <Route path="settings/users" element={<UsersPage />} />
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## 3. State Management

### 3.1 Zustand Stores

**`authStore`** — User authentication state
```typescript
interface AuthState {
  user: User | null;          // Supabase auth user
  session: Session | null;     // JWT session
  profile: Profile | null;     // From profiles table
  roles: UserRole[];           // From user_roles table
  isLoading: boolean;
  isSuperAdmin(): boolean;
  hasRole(role: string): boolean;
}
```

**`filterStore`** — Global filters (persisted to localStorage as `userpulse-filters`)
```typescript
interface FilterState {
  selectedBrands: string[];
  selectedLocations: string[];
  selectedType: string;
  selectedEvent: string;
  dateRange: { from: string; to: string };
  datePreset: '7' | '30' | '60' | '90' | 'custom';
}
```

**`permissionStore`** — Computed permission checks
```typescript
interface PermissionState {
  permissions: Record<AppSection, PermissionLevel>;
  isSuperAdmin: boolean;
  canView(section: AppSection): boolean;
  canEdit(section: AppSection): boolean;
  canRespond(section: AppSection): boolean;
}
```

### 3.2 React Query
- All Supabase data fetching wrapped in `useQuery` / `useMutation`
- Query keys scoped by filters (brand, location, date range)
- Mutations use `onSuccess` to invalidate related queries

---

## 4. Authentication Flow

```
User visits /auth
    │
    ├─ Login: supabase.auth.signInWithPassword()
    └─ Signup: supabase.auth.signUp()
         │
         ▼
AuthProvider (App.tsx)
    │
    ├─ supabase.auth.onAuthStateChange()
    │   ├─ setUser(session.user)
    │   ├─ setSession(session)
    │   └─ setTimeout (avoid Supabase deadlock):
    │       ├─ fetch profiles WHERE user_id = user.id
    │       ├─ fetch user_roles WHERE user_id = user.id
    │       ├─ setProfile(profile)
    │       └─ setRoles(roles)
    │
    └─ supabase.auth.getSession() (initial check)
         │
         ▼
ProtectedRoute
    ├─ isLoading → show loading spinner
    ├─ !user → redirect to /auth
    └─ user → render <MainLayout><Outlet /></MainLayout>
```

---

## 5. RBAC Implementation

### 5.1 Permission Resolution (Client-Side)

`usePermissions()` hook (`src/hooks/usePermissions.ts`):

1. Check if user is `super_admin` → grant all permissions
2. Query `user_roles` with joined `custom_roles(permissions)`
3. If user has `custom_role_id` → use custom role's permissions JSONB
4. Otherwise → use `DEFAULT_PERMISSIONS[role]` from `src/types/permissions.ts`
5. Return: `canViewSection()`, `canEditSection()`, `canRespondSection()`

### 5.2 Permission Levels

| Level | View | Edit | Respond |
|---|---|---|---|
| `no_access` | ✗ | ✗ | ✗ |
| `view` | ✓ | ✗ | ✗ |
| `edit` | ✓ | ✓ | ✗ |
| `respond` | ✓ | ✓ | ✓ |

### 5.3 Sidebar Filtering

```typescript
// In Sidebar.tsx
const { canViewSection } = usePermissions();

// Each nav item has optional `section` field
// Items with section that user can't view are filtered out
navigation.filter(item => 
  !item.section || canViewSection(item.section)
);
```

### 5.4 Database RLS

All tables use Row Level Security policies that reference:
- `is_super_admin(auth.uid())` — bypass for super admins
- `has_brand_access(auth.uid(), brand_id)` — brand-scoped access
- `has_role(auth.uid(), 'brand_admin')` — role-specific policies

---

## 6. Data Access Pattern

### `useBrandLocationContext()` Hook

Central hook for brand/location-aware data fetching:

```typescript
const {
  accessibleBrands,      // All brands user can access
  accessibleLocations,   // All locations user can access
  effectiveBrandId,      // Currently selected brand (or null for all)
  effectiveBrandIds,     // Array of effective brand IDs
  effectiveLocationId,   // Currently selected location
  effectiveLocationIds,  // Array of effective location IDs
  isBrandLocked,         // User has access to only 1 brand
  isLocationLocked,      // User has access to only 1 location
  getLocationsForBrand,  // Helper: locations under a brand
  getBrandName,          // Helper: brand name by ID
  getLocationName,       // Helper: location name by ID
} = useBrandLocationContext();
```

- Reads from `filterStore` for user-selected filters
- Falls back to demo data when Supabase returns empty
- All list pages use this to scope their queries

---

## 7. Edge Function Architecture

### `categorize-feedback`

**Runtime:** Deno (Supabase Edge Functions)
**Authentication:** Service role key (auto-injected)

```
Client                  Edge Function                AI Gateway
  │                         │                           │
  ├─ POST {responseId,      │                           │
  │   eventId,              │                           │
  │   feedbackText,         │                           │
  │   score}                │                           │
  │ ──────────────────────► │                           │
  │                         ├─ Fetch event tags          │
  │                         │  (event_feedback_tags)     │
  │                         │                           │
  │                         ├─ POST /v1/chat/completions│
  │                         │ ─────────────────────────►│
  │                         │                           │
  │                         │◄──── JSON array of tags ──│
  │                         │                           │
  │                         ├─ Delete old AI tags        │
  │                         ├─ Insert new AI tags        │
  │                         │  (response_tag_assignments)│
  │                         │                           │
  │◄─── { tags, tagIds } ──│                           │
```

---

## 8. Key Technical Patterns

### 8.1 Demo Data Fallback
```typescript
// Pattern used across the app
const { data: brands } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const { data } = await supabase.from('brands').select('*');
    return data?.length ? data : DEMO_BRANDS; // fallback
  }
});
```

### 8.2 Accordion Auto-Collapse
```typescript
// Integration cards collapse after successful save
const prevPending = useRef(props.savePending);
useEffect(() => {
  if (prevPending.current && !props.savePending) {
    setIsOpen(false);
  }
  prevPending.current = props.savePending;
}, [props.savePending]);
```

### 8.3 Navigation State Passing
```typescript
// ManageEvents → EventDetail tab selection
navigate(`/nps/events/${id}`, { state: { tab: 'distribution' } });

// EventDetail syncs tab from navigation state
useEffect(() => {
  if (location.state?.tab) {
    setActiveTab(location.state.tab);
  }
}, [location.state?.tab]);
```

### 8.4 Contact Upsert Pattern
```typescript
// Check for existing contact by email or phone within brand
const { data: existing } = await supabase
  .from('contacts')
  .select('id')
  .eq('brand_id', brandId)
  .or(`email.eq.${email},phone.eq.${phone}`)
  .maybeSingle();

if (existing) {
  await supabase.from('contacts').update(contactData).eq('id', existing.id);
} else {
  await supabase.from('contacts').insert(contactData);
}
```
