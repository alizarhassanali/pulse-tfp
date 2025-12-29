import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

import { MainLayout } from '@/components/layout/MainLayout';

import Auth from './pages/Auth';
import NPSDashboard from './pages/nps/Dashboard';
import NPSQuestions from './pages/nps/Questions';
import SentLogs from './pages/nps/SentLogs';
import ManageEvents from './pages/nps/ManageEvents';
import CreateEvent from './pages/nps/CreateEvent';
import Integration from './pages/nps/Integration';
import Reviews from './pages/Reviews';
import AllContacts from './pages/contacts/AllContacts';
import Unsubscribed from './pages/contacts/Unsubscribed';
import ProfileSettings from './pages/settings/Profile';
import Templates from './pages/settings/Templates';

import AutomationRules from './pages/settings/AutomationRules';
import Brands from './pages/settings/Brands';
import UsersPage from './pages/settings/Users';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setRoles, setIsLoading } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
          const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
          setProfile(profile);
          setRoles(roles || []);
          setIsLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft text-primary text-xl font-medium">Loading...</div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/nps/dashboard" replace />} />
              <Route path="nps/dashboard" element={<NPSDashboard />} />
              <Route path="nps/questions" element={<NPSQuestions />} />
              <Route path="nps/sent-logs" element={<SentLogs />} />
              <Route path="nps/manage-events" element={<ManageEvents />} />
              <Route path="nps/events/create" element={<CreateEvent />} />
              <Route path="nps/events/:id/edit" element={<CreateEvent />} />
              <Route path="nps/integration" element={<Integration />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="contacts" element={<AllContacts />} />
              <Route path="contacts/unsubscribe" element={<Unsubscribed />} />
              <Route path="settings" element={<Navigate to="/settings/profile" replace />} />
              <Route path="settings/profile" element={<ProfileSettings />} />
              <Route path="settings/templates" element={<Templates />} />
              <Route path="settings/automations" element={<AutomationRules />} />
              
              <Route path="settings/brands" element={<Brands />} />
              <Route path="settings/users" element={<UsersPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
