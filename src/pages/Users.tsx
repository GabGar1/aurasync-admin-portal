import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/services/api';
import type { User } from '@/types';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Role', dataIndex: 'role', key: 'role', render: (r: User['role']) => <Tag color={r === 'ADMIN' ? 'purple' : 'default'}>{r}</Tag> },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
];

export default function Users() {
  const { data = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6" style={{ color: '#333' }}>Users</h1>
      <Table rowKey="id" loading={isLoading} dataSource={data} columns={columns} bordered size="middle" />
    </div>
  );
}
