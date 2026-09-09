import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';

import Landing from '@/pages/landing/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

import AppLayout from '@/layouts/AppLayout';
import AppDashboard from '@/pages/app/Dashboard';
import AppFeed from '@/pages/app/Feed';
import AppProfile from '@/pages/app/Profile';
import AppActivities from '@/pages/app/Activities';
import AppCourses from '@/pages/app/Courses';
import AppGroups from '@/pages/app/Groups';
import AppMessages from '@/pages/app/Messages';
import AppNotifications from '@/pages/app/Notifications';
import AppSettings from '@/pages/app/Settings';
import AppSearch from '@/pages/app/Search';

import OrgLayout from '@/layouts/OrgLayout';
import OrgDashboard from '@/pages/org/Dashboard';
import OrgActivities from '@/pages/org/Activities';
import OrgCourses from '@/pages/org/Courses';
import OrgMembers from '@/pages/org/Members';
import OrgAnalytics from '@/pages/org/Analytics';
import OrgPosts from '@/pages/org/Posts';
import OrgProfile from '@/pages/org/Profile';
import OrgSettings from '@/pages/org/Settings';

import Petra from '@/pages/petra/Petra';

import NotFound from '@/pages/not-found';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'org' | 'individual' }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0C10] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#9E2A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (role === 'org' && user?.role !== 'org') {
    navigate('/app');
    return null;
  }

  return <>{children}</>;
}

function RootPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'org') {
        navigate('/org');
      } else {
        navigate('/app/feed');
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0C10] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#9E2A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0E0C10] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#9E2A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootPage} />
      <Route path="/landing" component={Landing} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />

      {/* Individual User Routes (Protected - Login Required) */}
      <Route path="/app" component={() => <ProtectedRoute><AppLayout><AppDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/app/feed" component={() => <ProtectedRoute><AppLayout><AppFeed /></AppLayout></ProtectedRoute>} />
      <Route path="/app/profile" component={() => <ProtectedRoute><AppLayout><AppProfile /></AppLayout></ProtectedRoute>} />
      <Route path="/app/profile/:id" component={(props: any) => <ProtectedRoute><AppLayout><AppProfile targetUserId={props?.params?.id} /></AppLayout></ProtectedRoute>} />
      <Route path="/app/activities" component={() => <ProtectedRoute><AppLayout><AppActivities /></AppLayout></ProtectedRoute>} />
      <Route path="/app/courses" component={() => <ProtectedRoute><AppLayout><AppCourses /></AppLayout></ProtectedRoute>} />
      <Route path="/app/groups" component={() => <ProtectedRoute><AppLayout><AppGroups /></AppLayout></ProtectedRoute>} />
      <Route path="/app/messages" component={() => <ProtectedRoute><AppLayout><AppMessages /></AppLayout></ProtectedRoute>} />
      <Route path="/app/notifications" component={() => <ProtectedRoute><AppLayout><AppNotifications /></AppLayout></ProtectedRoute>} />
      <Route path="/app/settings" component={() => <ProtectedRoute><AppLayout><AppSettings /></AppLayout></ProtectedRoute>} />
      <Route path="/app/search" component={() => <ProtectedRoute><AppLayout><AppSearch /></AppLayout></ProtectedRoute>} />

      {/* Organization Routes (Protected - Org Login Required) */}
      <Route path="/org" component={() => <ProtectedRoute role="org"><OrgLayout><OrgDashboard /></OrgLayout></ProtectedRoute>} />
      <Route path="/org/activities" component={() => <ProtectedRoute role="org"><OrgLayout><OrgActivities /></OrgLayout></ProtectedRoute>} />
      <Route path="/org/courses" component={() => <ProtectedRoute role="org"><OrgLayout><OrgCourses /></OrgLayout></ProtectedRoute>} />
      <Route path="/org/members" component={() => <ProtectedRoute role="org"><OrgLayout><OrgMembers /></OrgLayout></ProtectedRoute>} />
      <Route path="/org/analytics" component={() => <ProtectedRoute role="org"><OrgLayout><OrgAnalytics /></OrgLayout></ProtectedRoute>} />
      <Route path="/org/posts" component={() => <ProtectedRoute role="org"><OrgLayout><OrgPosts /></OrgLayout></ProtectedRoute>} />
      <Route path="/org/profile" component={() => <ProtectedRoute role="org"><OrgLayout><OrgProfile /></OrgLayout></ProtectedRoute>} />
      <Route path="/org/settings" component={() => <ProtectedRoute role="org"><OrgLayout><OrgSettings /></OrgLayout></ProtectedRoute>} />

      {/* Secret Petra Central Control Route (Dedicated obscure gate only) */}
      <Route path="/system-control-gate-9921" component={Petra} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
