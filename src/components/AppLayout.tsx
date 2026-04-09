import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Typography } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Products' },
  { key: '/orders', icon: <FileTextOutlined />, label: 'Orders' },
  { key: '/inventory', icon: <DatabaseOutlined />, label: 'Inventory' },
  { key: '/users', icon: <TeamOutlined />, label: 'Users' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getUser, logout } = useAuth();
  const user = getUser();

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{ background: '#fff', borderRight: '1px solid hsl(240 6% 90%)' }}
      >
        <div className="flex items-center justify-center h-16 border-b border-border">
          <Text strong className="text-lg" style={{ color: '#9966CC' }}>
            {collapsed ? 'AS' : 'AuraSync'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between px-6" style={{ background: '#fff', borderBottom: '1px solid hsl(240 6% 90%)', height: 64, lineHeight: '64px', padding: '0 24px' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: logout },
              ],
            }}
            placement="bottomRight"
          >
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#9966CC' }} />
              <Text className="hidden sm:inline">{user?.name || 'Admin'}</Text>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
