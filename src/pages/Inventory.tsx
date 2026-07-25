import { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/services/api';
import type { InventoryTransaction, CreateInventoryPayload } from '@/types';

const typeColors: Record<string, string> = {
  SALE: 'orange', RESTOCK: 'blue', ADJUSTMENT: 'purple',
};

export default function Inventory() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, limit],
    queryFn: () => inventoryApi.getAll({ page, limit }),
    placeholderData: (previousData) => previousData,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (payload: CreateInventoryPayload) => inventoryApi.create(payload),
    onSuccess: () => {
      message.success('Ajuste de inventário registrado');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => message.error( // eslint-disable-line @typescript-eslint/no-explicit-any
      `Falha ao registrar: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`
    ),
  });

  const columns = [
    { title: 'Variant ID', dataIndex: 'variant_id', key: 'variant_id' },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (t: InventoryTransaction['type']) => <Tag color={typeColors[t]}>{t}</Tag>,
    },
    {
      title: 'Qtd',
      dataIndex: 'quantity_changed',
      key: 'quantity_changed',
      render: (v: number) => (
        <span style={{ color: v < 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          {v > 0 ? `+${v}` : v}
        </span>
      ),
    },
    {
      title: 'Data',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString('pt-BR') : '-',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventário</h1>
          <p className="text-gray-400 text-xs">Histórico de transações de inventário</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Ajuste Manual
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data?.transactions || []}
        columns={columns}
        bordered
        size="middle"
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (p, s) => { setPage(p); setLimit(s); },
        }}
      />

      <Modal
        title="Ajuste Manual de Estoque"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Registrar"
        cancelText="Cancelar"
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => {
          createMutation.mutate({
            variant_id: values.variant_id,
            type: values.type,
            quantity_changed: values.quantity_changed,
            order_id: values.order_id || undefined,
          });
        }}>
          <Form.Item name="variant_id" label="Variant ID" rules={[{ required: true }]}>
            <Input placeholder="ID da variação" />
          </Form.Item>
          <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
            <Select options={[
              { value: 'SALE', label: 'SALE (Venda — negativo)' },
              { value: 'RESTOCK', label: 'RESTOCK (Reabastecimento — positivo)' },
              { value: 'ADJUSTMENT', label: 'ADJUSTMENT (Ajuste manual)' },
            ]} />
          </Form.Item>
          <Form.Item name="quantity_changed" label="Quantidade" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Use valor negativo para SALE, positivo para RESTOCK"
            />
          </Form.Item>
          <Form.Item name="order_id" label="Order ID (opcional)">
            <Input placeholder="ID do pedido relacionado" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
