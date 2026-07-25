import { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Space, message, Card, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Order, CreateOrderPayload } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

const statusColors: Record<string, string> = {
  PENDING: 'blue',
  PAID: 'green',
  SHIPPED: 'orange',
  CANCELED: 'red',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Orders() {
  const { getUser } = useAuth();
  const currentUser = getUser();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const qc = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, limit, statusFilter, debouncedSearch],
    queryFn: () => ordersApi.getAll({
      page,
      limit,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  useWebSocket('orders_updated', () => {
    qc.invalidateQueries({ queryKey: ['orders'] });
    message.success('Pedidos atualizados em tempo real!');
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.create(payload),
    onSuccess: () => {
      message.success('Pedido criado com sucesso');
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCreateModalOpen(false);
      createForm.resetFields();
    },
    onError: (err: ApiError) => message.error(
      `Falha ao criar pedido: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`
    ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.update(id, { status: status as CreateOrderPayload['status'] }),
    onSuccess: () => {
      message.success('Status atualizado');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: ApiError) => message.error(
      `Falha ao atualizar: ${err?.response?.data?.error || err?.message}`
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      message.success('Pedido cancelado');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: ApiError) => message.error(
      `Falha ao cancelar: ${err?.response?.data?.error || err?.message}`
    ),
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name' },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v: number) => `R$ ${Number(v || 0).toFixed(2)}`,
    },
    {
      title: 'Data',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString('pt-BR') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: Order['status']) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    { title: 'Itens', key: 'items', render: (_: unknown, r: Order) => r.items?.length || 0 },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Order) => (
        <Space>
          {isAdmin(currentUser?.role) && record.status !== 'CANCELED' ? (
            <Select
              size="small"
              value={record.status}
              style={{ width: 110 }}
              onChange={(newStatus) => updateMutation.mutate({ id: record.id, status: newStatus })}
              options={[
                { value: 'PENDING', label: 'PENDING' },
                { value: 'PAID', label: 'PAID' },
                { value: 'SHIPPED', label: 'SHIPPED' },
                { value: 'CANCELED', label: 'CANCELED' },
              ]}
            />
          ) : null}
          {isAdmin(currentUser?.role) ? (
            <Button
              danger
              size="small"
              onClick={() => {
                Modal.confirm({
                  title: 'Cancelar pedido?',
                  content: `Tem certeza que deseja cancelar o pedido ${record.id}?`,
                  okText: 'Cancelar Pedido',
                  okType: 'danger',
                  cancelText: 'Voltar',
                  onOk: () => deleteMutation.mutate(record.id),
                });
              }}
            >
              Cancelar
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-gray-400 text-xs">Gerenciamento de pedidos</p>
        </div>
        {isAdmin(currentUser?.role) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Novo Pedido
          </Button>
        )}
      </div>

      <Card className="mb-6" size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Input
              placeholder="Pesquisar por cliente ou ID..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={search}
              allowClear
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </Col>
          <Col xs={24} md={10}>
            <Select
              className="w-full"
              placeholder="Filtrar por Status"
              allowClear
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value); setPage(1); }}
              options={[
                { value: 'PENDING', label: 'PENDING' },
                { value: 'PAID', label: 'PAID' },
                { value: 'SHIPPED', label: 'SHIPPED' },
                { value: 'CANCELED', label: 'CANCELED' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data?.orders || []}
        columns={columns}
        bordered
        size="middle"
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: (p, s) => { setPage(p); setLimit(s); },
        }}
      />

      <Modal
        title="Novo Pedido"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        onOk={() => createForm.submit()}
        okText="Criar Pedido"
        cancelText="Cancelar"
        confirmLoading={createMutation.isPending}
        width={700}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={(values) => {
          createMutation.mutate({
            customer_name: values.customer_name,
            status: values.status || 'PENDING',
            items: values.items?.map((item: { variant_id: string; quantity: number; unit_price: number; unit_cost: number }) => ({
              variant_id: item.variant_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              unit_cost: item.unit_cost,
            })) || [],
          });
        }}>
          <Form.Item name="customer_name" label="Cliente" rules={[{ required: true, message: 'Nome do cliente é obrigatório' }]}>
            <Input placeholder="Nome do cliente" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="PENDING">
            <Select options={[
              { value: 'PENDING', label: 'PENDING' },
              { value: 'PAID', label: 'PAID' },
              { value: 'SHIPPED', label: 'SHIPPED' },
              { value: 'CANCELED', label: 'CANCELED' },
            ]} />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={[name, 'variant_id']} rules={[{ required: true, message: 'Obrigatório' }]}>
                      <Input placeholder="Variant ID" style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true, message: 'Obrigatório' }]}>
                      <InputNumber placeholder="Qtd" min={1} style={{ width: 70 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit_price']} rules={[{ required: true, message: 'Obrigatório' }]}>
                      <InputNumber placeholder="Preço" min={0} step={0.01} style={{ width: 110 }} prefix="R$" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit_cost']} rules={[{ required: true, message: 'Obrigatório' }]}>
                      <InputNumber placeholder="Custo" min={0} step={0.01} style={{ width: 110 }} prefix="R$" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>X</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Adicionar Item
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
