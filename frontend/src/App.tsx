import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Vessels = lazy(() => import('./pages/Vessels'));
const VesselDetail = lazy(() => import('./pages/Vessels/VesselDetail'));
const Ports = lazy(() => import('./pages/Ports'));
const Detection = lazy(() => import('./pages/Detection'));
const Events = lazy(() => import('./pages/Events'));
const SatelliteView = lazy(() => import('./pages/Satellite'));
const Login = lazy(() => import('./pages/Auth/Login'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-xs text-navy-500">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="vessels" element={<Vessels />} />
              <Route path="vessels/:mmsi" element={<VesselDetail />} />
              <Route path="ports" element={<Ports />} />
              <Route path="detection" element={<Detection />} />
              <Route path="events" element={<Events />} />
              <Route path="satellite" element={<SatelliteView />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
