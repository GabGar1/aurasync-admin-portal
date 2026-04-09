import { Card, Statistic, Row, Col, Spin } from 'antd';
import { DollarOutlined, ShoppingOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';

const statCards = [
  { key: 'totalSales', title: 'Total Sales', icon: <DollarOutlined />, prefix: '$', color: '#9966CC' },
  { key: 'activeProducts', title: 'Active Products', icon: <ShoppingOutlined />, color: '#52c41a' },
  { key: 'pendingOrders', title: 'Pending Orders', icon: <ClockCircleOutlined />, color: '#faad14' },
  { key: 'lowStockAlerts', title: 'Low Stock Alerts', icon: <WarningOutlined />, color: '#ff4d4f' },
] as const;

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.getStats });

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6" style={{ color: '#333' }}>Dashboard</h1>
      <Row gutter={[20, 20]}>
        {statCards.map((s) => (
          <Col xs={24} sm={12} lg={6} key={s.key}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={s.title}
                value={data?.[s.key] ?? 0}
                prefix={s.icon}
                precision={s.key === 'totalSales' ? 2 : 0}
                valueStyle={{ color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
