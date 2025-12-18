import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
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
      { icon: BarChart3, label: 'Dashboard', href: '/nps/dashboard' },
      { icon: MessageSquareText, label: 'Questions', href: '/nps/questions' },
      { icon: Send, label: 'Sent Logs', href: '/nps/sent-logs' },
      { icon: Calendar, label: 'Manage Events', href: '/nps/manage-events' },
      { icon: Plug, label: 'Integration', href: '/nps/integration' },
    ],
  },
  { icon: Star, label: 'Reviews', href: '/reviews' },
  {
    icon: Users,
    label: 'Contacts',
    items: [
      { icon: Users, label: 'All Contacts', href: '/contacts' },
      { icon: UserX, label: 'Unsubscribed', href: '/contacts/unsubscribe' },
    ],
  },
  {
    icon: Settings,
    label: 'Settings',
    items: [
      { icon: User, label: 'Profile', href: '/settings/profile' },
      { icon: FileText, label: 'Templates', href: '/settings/templates' },
      { icon: Building2, label: 'Brands', href: '/settings/brands' },
      { icon: UserCog, label: 'Users', href: '/settings/users' },
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

function NavGroupComponent({ group }: { group: NavGroup }) {
  const location = useLocation();
  const isGroupActive = group.items.some((item) => location.pathname === item.href);
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
        {group.items.map((item) => (
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

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-sidebar h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          if (isNavGroup(item)) {
            return <NavGroupComponent key={index} group={item} />;
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
      
      <div className="p-4 border-t border-sidebar-hover">
        <div className="text-xs text-muted-foreground text-center">
          UserPulse v1.0.0
        </div>
      </div>
    </aside>
  );
}
