import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-gradient-main overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
