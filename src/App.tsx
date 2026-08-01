import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import Inventory from '@/pages/Inventory';
import Users from '@/pages/Users';
import Costs from '@/pages/Costs';
import Sales from '@/pages/Sales';
import NotFound from '@/pages/NotFound';
import Layout from '@/pages/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TokenExpirationWatcher from '@/hooks/useTokenExpirationWatcher';

const queryClient = new QueryClient();

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { refreshAuth } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    refreshAuth().finally(() => setReady(true));
  }, [refreshAuth]);

  if (!ready) return null;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthInitializer>
        <TokenExpirationWatcher />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/users" element={<Users />} />
            <Route path="/costs" element={<ProtectedRoute adminOnly><Costs /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute adminOnly><Sales /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
