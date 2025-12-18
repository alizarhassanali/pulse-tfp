import { GlobalFilters } from './GlobalFilters';

export function TopNav() {
  return (
    <header className="h-16 bg-topbar text-topbar-foreground flex items-center justify-between px-4 border-b border-border z-50">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">U</span>
        </div>
        <span className="font-semibold text-lg tracking-tight hidden sm:inline">UserPulse</span>
      </div>

      {/* Global Filters */}
      <div className="flex-1 flex items-center justify-center px-4">
        <GlobalFilters />
      </div>

      {/* Empty right side for balance */}
      <div className="w-8 shrink-0" />
    </header>
  );
}
