import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/services/api';
import type { InventoryTransaction } from '@/types';

const typeColors: Record<InventoryTransaction['type'], string> = { IN: 'green', OUT: 'red', SALE: 'orange', RESTOCK: 'blue' };

const columns = [
  { title: 'Variant SKU', dataIndex: 'variantSku', key: 'variantSku' },
  { title: 'Type', dataIndex: 'type', key: 'type', render: (t: InventoryTransaction['type']) => <Tag color={typeColors[t]}>{t}</Tag> },
  { title: 'Qty Changed', dataIndex: 'quantityChanged', key: 'quantityChanged', render: (v: number) => <span style={{ color: v < 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>{v > 0 ? `+${v}` : v}</span> },
  { title: 'Date', dataIndex: 'date', key: 'date' },
];

export default function Inventory() {
  const { data = [], isLoading } = useQuery({ queryKey: ['inventory'], queryFn: inventoryApi.getAll });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6" style={{ color: '#333' }}>Inventory Ledger</h1>
      <Table rowKey="id" loading={isLoading} dataSource={data} columns={columns} bordered size="middle" />
    </div>
  );
}
