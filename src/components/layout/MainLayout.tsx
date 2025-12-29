import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-background overflow-y-auto h-[calc(100vh-64px)]">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
