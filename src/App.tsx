import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import Inventory from '@/pages/Inventory';
import Users from '@/pages/Users';
import NotFound from '@/pages/NotFound';
import Layout from '@/pages/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const queryClient = new QueryClient();

const antTheme = {
  token: {
    colorPrimary: '#9966CC',
    colorBgLayout: '#FAF9F6',
    colorBgContainer: '#FFFFFF',
    borderRadius: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

const App = () => (
  <ConfigProvider theme={antTheme}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/users" element={<Users />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </ConfigProvider>
);

export default App;
