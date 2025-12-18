import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  MessageSquareText,
  Send,
  Calendar,
  Plug,
  Star,
  Users,
  UserX,
  Settings,
  User,
  FileText,
  Building2,
  UserCog,
  ChevronDown,
  ChevronRight,
  LogOut,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { AppSection } from '@/types/permissions';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  section?: AppSection;
}

interface NavGroup {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigation: (NavItem | NavGroup)[] = [
  {
    icon: BarChart3,
    label: 'NPS',
    defaultOpen: true,
    items: [
      { icon: BarChart3, label: 'Dashboard', href: '/nps/dashboard', section: 'dashboard' },
      { icon: MessageSquareText, label: 'Questions', href: '/nps/questions', section: 'questions' },
      { icon: Send, label: 'Sent Logs', href: '/nps/sent-logs', section: 'sent_logs' },
      { icon: Calendar, label: 'Manage Events', href: '/nps/manage-events', section: 'manage_events' },
      { icon: Plug, label: 'Integration', href: '/nps/integration', section: 'integration' },
    ],
  },
  { icon: Star, label: 'Reviews', href: '/reviews', section: 'reviews' },
  {
    icon: Users,
    label: 'Contacts',
    items: [
      { icon: Users, label: 'All Contacts', href: '/contacts', section: 'contacts' },
      { icon: UserX, label: 'Unsubscribed', href: '/contacts/unsubscribe', section: 'contacts' },
    ],
  },
  {
    icon: Settings,
    label: 'Settings',
    items: [
      { icon: User, label: 'Profile', href: '/settings/profile' },
      { icon: FileText, label: 'Templates', href: '/settings/templates', section: 'templates' },
      { icon: Tag, label: 'Feedback Categories', href: '/settings/feedback-categories', section: 'templates' },
      { icon: Building2, label: 'Brands', href: '/settings/brands', section: 'brands' },
      { icon: UserCog, label: 'Users', href: '/settings/users', section: 'users' },
    ],
  },
];

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item;
}

function NavItemComponent({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={cn('sidebar-item', isActive && 'sidebar-item-active')}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroupComponent({ group, canViewSection }: { group: NavGroup; canViewSection: (section?: AppSection) => boolean }) {
  const location = useLocation();
  
  // Filter items based on permissions
  const visibleItems = group.items.filter(item => {
    if (!item.section) return true; // No section means always visible (e.g., Profile)
    return canViewSection(item.section);
  });

  // Don't render the group if no items are visible
  if (visibleItems.length === 0) return null;

  const isGroupActive = visibleItems.some((item) => location.pathname === item.href);
  const [isOpen, setIsOpen] = useState(group.defaultOpen || isGroupActive);
  const Icon = group.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            'sidebar-item justify-between',
            isGroupActive && !isOpen && 'bg-sidebar-hover'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{group.label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 mt-1 space-y-1">
        {visibleItems.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={location.pathname === item.href}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function UserMenu() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : profile?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-hover transition-colors text-left">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-48">
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { canViewSection, isSuperAdmin, isLoading } = usePermissions();

  // Helper function that handles undefined section
  const checkCanView = (section?: AppSection): boolean => {
    if (!section) return true; // No section means always visible
    if (isSuperAdmin) return true;
    return canViewSection(section);
  };

  return (
    <aside className="w-60 bg-sidebar h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          if (isNavGroup(item)) {
            return <NavGroupComponent key={index} group={item} canViewSection={checkCanView} />;
          }
          
          // For non-group items, check permission
          if (item.section && !checkCanView(item.section)) {
            return null;
          }
          
          return (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={location.pathname === item.href}
            />
          );
        })}
      </nav>
      
      <div className="p-3 border-t border-sidebar-hover">
        <UserMenu />
      </div>
    </aside>
  );
}
