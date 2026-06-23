import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './components/Login';
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
import Settings from './components/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/bangladesh" element={<ProtectedRoute><Layout><BangladeshNumbers /></Layout></ProtectedRoute>} />
      <Route path="/extensions" element={<ProtectedRoute><Layout><Extensions /></Layout></ProtectedRoute>} />
      <Route path="/carriers" element={<ProtectedRoute><Layout><CarrierManager /></Layout></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Layout><BillingRates /></Layout></ProtectedRoute>} />
      <Route path="/calls" element={<ProtectedRoute><Layout><CallRecords /></Layout></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><Layout><TenantsPage /></Layout></ProtectedRoute>} />
      <Route path="/ips" element={<ProtectedRoute><Layout><IpManager /></Layout></ProtectedRoute>} />
      <Route path="/wireguard" element={<ProtectedRoute><Layout><WireGuard /></Layout></ProtectedRoute>} />
      <Route path="/ports" element={<ProtectedRoute><Layout><PortScanner /></Layout></ProtectedRoute>} />
      <Route path="/ovh" element={<ProtectedRoute><Layout><OVHRelay /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
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
