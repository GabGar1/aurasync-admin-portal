import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import Inventory from '@/pages/Inventory';
import Users from '@/pages/Users';
import Costs from '@/pages/Costs';
import Sales from '@/pages/Sales';
import Customers from '@/pages/Customers';
import NotFound from '@/pages/NotFound';
import Layout from '@/pages/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TokenExpirationWatcher from '@/hooks/useTokenExpirationWatcher';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <TokenExpirationWatcher />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute permission="products.view"><Products /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute permission="orders.view"><Orders /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute permission="inventory.view"><Inventory /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute permission="users.manage"><Users /></ProtectedRoute>} />
              <Route path="/costs" element={<ProtectedRoute permission="costs.manage"><Costs /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute permission="sales.create"><Sales /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute permission="customers.view"><Customers /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
