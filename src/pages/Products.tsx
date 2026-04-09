import { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, Space, message } from 'antd';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import type { Product, ProductVariant } from '@/types';

export default function Products() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModalOpen(false); form.resetFields(); message.success('Product added'); },
  });

  const variantColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `$${v.toFixed(2)}` },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (v: number) => <span style={{ color: v <= 5 ? '#ff4d4f' : undefined, fontWeight: v <= 5 ? 600 : 400 }}>{v}</span> },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Status', dataIndex: 'active', key: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: '#333' }}>Products</h1>
        <Space>
          <Button icon={<SyncOutlined />} onClick={() => message.info('Sync with Nuvemshop triggered')}>Sync with Nuvemshop</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Product</Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={columns}
        expandable={{
          expandedRowRender: (record: Product) => (
            <Table rowKey="id" dataSource={record.variants} columns={variantColumns} pagination={false} size="small" />
          ),
        }}
        bordered
        size="middle"
      />
      <Modal title="Add Product" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} confirmLoading={createMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={[{ value: 'Audio' }, { value: 'Wearables' }, { value: 'Accessories' }, { value: 'Peripherals' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
