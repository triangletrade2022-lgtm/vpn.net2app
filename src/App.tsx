import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BangladeshNumbers from './components/BangladeshNumbers';
import Extensions from './components/Extensions';
import CarrierManager from './components/CarrierManager';
import CallRecords from './components/CallRecords';
import BillingRates from './components/BillingRates';
import TenantsPage from './components/TenantsPage';
import IpManager from './components/IpManager';
import WireGuard from './components/WireGuard';
import PortScanner from './components/PortScanner';
import OVHRelay from './components/OVHRelay';
import AdminSms from './components/AdminSms';
import Settings from './components/Settings';

// Client portal
import ClientSms from './components/ClientSms';
import ClientLayout from './components/ClientLayout';
import ClientDashboard from './components/ClientDashboard';
import ClientDownloads from './components/ClientDownloads';
import ClientBilling from './components/ClientBilling';
import ClientSettings from './components/ClientSettings';

// ── Wrappers ──

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Allow super_admin AND tenant_admin to access admin panel
  if (user?.role !== 'super_admin' && user?.role !== 'tenant_admin') return <Navigate to="/portal" replace />;
  return <>{children}</>;
}

// ── Routes ──

function AppRoutes() {
  const { isAuthenticated, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        isAuthenticated ? (isSuperAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/portal" replace />) : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? (isSuperAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/portal" replace />) : <Register />
      } />

      {/* Admin Panel (both /admin and /admin/ work) */}
      <Route path="/admin" element={<AdminRoute><Layout><Dashboard /></Layout></AdminRoute>} />
      <Route path="/admin/" element={<AdminRoute><Layout><Dashboard /></Layout></AdminRoute>} />
      <Route path="/admin/tenants" element={<AdminRoute><Layout><TenantsPage /></Layout></AdminRoute>} />
      <Route path="/admin/ips" element={<AdminRoute><Layout><IpManager /></Layout></AdminRoute>} />
      <Route path="/admin/bangladesh" element={<AdminRoute><Layout><BangladeshNumbers /></Layout></AdminRoute>} />
      <Route path="/admin/extensions" element={<AdminRoute><Layout><Extensions /></Layout></AdminRoute>} />
      <Route path="/admin/carriers" element={<AdminRoute><Layout><CarrierManager /></Layout></AdminRoute>} />
      <Route path="/admin/billing" element={<AdminRoute><Layout><BillingRates /></Layout></AdminRoute>} />
      <Route path="/admin/calls" element={<AdminRoute><Layout><CallRecords /></Layout></AdminRoute>} />
      <Route path="/admin/wireguard" element={<AdminRoute><Layout><WireGuard /></Layout></AdminRoute>} />
      <Route path="/admin/ports" element={<AdminRoute><Layout><PortScanner /></Layout></AdminRoute>} />
      <Route path="/admin/ovh" element={<AdminRoute><Layout><OVHRelay /></Layout></AdminRoute>} />
      <Route path="/admin/sms" element={<AdminRoute><Layout><AdminSms /></Layout></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><Layout><Settings /></Layout></AdminRoute>} />

      {/* Client Portal */}
      <Route path="/portal" element={<ProtectedRoute><ClientLayout><ClientDashboard /></ClientLayout></ProtectedRoute>} />
      <Route path="/portal/downloads" element={<ProtectedRoute><ClientLayout><ClientDownloads /></ClientLayout></ProtectedRoute>} />
      <Route path="/portal/sms" element={<ProtectedRoute><ClientLayout><ClientSms /></ClientLayout></ProtectedRoute>} />
      <Route path="/portal/billing" element={<ProtectedRoute><ClientLayout><ClientBilling /></ClientLayout></ProtectedRoute>} />
      <Route path="/portal/settings" element={<ProtectedRoute><ClientLayout><ClientSettings /></ClientLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
