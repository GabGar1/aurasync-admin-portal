import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import Login from '@/pages/Login';
import Layout from '@/pages/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TokenExpirationWatcher from '@/hooks/useTokenExpirationWatcher';

// Each screen is its own chunk: the login and the shell load first, charts only on the dashboard.
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/Products'));
const Orders = lazy(() => import('@/pages/Orders'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Users = lazy(() => import('@/pages/Users'));
const Costs = lazy(() => import('@/pages/Costs'));
const Sales = lazy(() => import('@/pages/Sales'));
const Customers = lazy(() => import('@/pages/Customers'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-16 text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="sr-only">Carregando</span>
    </div>
  );
}

const page = (element: React.ReactNode) => <Suspense fallback={<PageFallback />}>{element}</Suspense>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <TokenExpirationWatcher />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<ProtectedRoute permission="dashboard.view">{page(<Dashboard />)}</ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute permission="products.view">{page(<Products />)}</ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute permission="orders.view">{page(<Orders />)}</ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute permission="inventory.view">{page(<Inventory />)}</ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute permission="users.manage">{page(<Users />)}</ProtectedRoute>} />
              <Route path="/costs" element={<ProtectedRoute permission="costs.manage">{page(<Costs />)}</ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute permission="sales.create">{page(<Sales />)}</ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute permission="customers.view">{page(<Customers />)}</ProtectedRoute>} />
              {/* Inside the layout: unknown links keep the menu (signed-out users go to the login first). */}
              <Route path="*" element={page(<NotFound />)} />
            </Route>
          </Routes>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
