import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import type { Order } from '@/types';

const statusColors: Record<Order['status'], string> = { PENDING: 'blue', PAID: 'green', CANCELED: 'red' };

const columns = [
  { title: 'Order ID', dataIndex: 'id', key: 'id' },
  { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
  { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `$${v.toFixed(2)}` },
  { title: 'Date', dataIndex: 'date', key: 'date' },
  { title: 'Status', dataIndex: 'status', key: 'status', render: (s: Order['status']) => <Tag color={statusColors[s]}>{s}</Tag> },
];

export default function Orders() {
  const { data = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.getAll });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6" style={{ color: '#333' }}>Orders</h1>
      <Table rowKey="id" loading={isLoading} dataSource={data} columns={columns} bordered size="middle" />
    </div>
  );
}
