/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, Space, message, Card, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/services/api';
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Users() {
  const { getUser } = useAuth();
  const currentUser = getUser();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 500);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch, roleFilter],
    queryFn: () => usersApi.getAll({
      page,
      limit,
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      message.success('Usuário criado com sucesso');
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreateModalOpen(false);
      createForm.resetFields();
    },
    onError: (err: any) => message.error(
      `Falha ao criar: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`
    ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      message.success('Usuário atualizado');
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditModalOpen(false);
      setEditingUser(null);
    },
    onError: (err: any) => message.error(
      `Falha ao atualizar: ${err?.response?.data?.error || err?.message}`
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      message.success('Usuário removido');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => message.error(
      `Falha ao remover: ${err?.response?.data?.error || err?.message}`
    ),
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Nome',
      key: 'name',
      render: (_: any, r: User) => `${r.first_name} ${r.last_name}`,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) => <Tag color={r === 'ADMIN' || r === 'SUPER_ADMIN' ? 'purple' : 'default'}>{r}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag>,
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString('pt-BR') : '-',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 160,
      render: (_: any, record: User) => (
        <Space>
          {isAdmin(currentUser?.role) && (
            <Button
              size="small"
              onClick={() => {
                setEditingUser(record);
                editForm.setFieldsValue({
                  first_name: record.first_name,
                  last_name: record.last_name,
                  status: record.status,
                });
                setEditModalOpen(true);
              }}
            >
              Editar
            </Button>
          )}
          {isAdmin(currentUser?.role) && (
            <Button
              danger
              size="small"
              onClick={() => {
                Modal.confirm({
                  title: 'Remover usuário?',
                  content: `Tem certeza que deseja remover ${record.first_name} ${record.last_name}?`,
                  okText: 'Remover',
                  okType: 'danger',
                  cancelText: 'Cancelar',
                  onOk: () => deleteMutation.mutate(record.id),
                });
              }}
            >
              Remover
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-gray-400 text-xs">Gerenciamento de usuários do sistema</p>
        </div>
        {isAdmin(currentUser?.role) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Novo Usuário
          </Button>
        )}
      </div>

      <Card className="mb-6" size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Input
              placeholder="Pesquisar por nome ou email..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={search}
              allowClear
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </Col>
          <Col xs={24} md={10}>
            <Select
              className="w-full"
              placeholder="Filtrar por Role"
              allowClear
              value={roleFilter}
              onChange={(value) => { setRoleFilter(value); setPage(1); }}
              options={[
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'EMPLOYEE', label: 'EMPLOYEE' },
                { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data?.users || []}
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

      {/* Create Modal */}
      <Modal
        title="Novo Usuário"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        onOk={() => createForm.submit()}
        okText="Criar"
        cancelText="Cancelar"
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={(values) => {
          createMutation.mutate({
            email: values.email,
            password: values.password,
            first_name: values.first_name,
            last_name: values.last_name,
          });
        }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Senha" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="first_name" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Sobrenome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Editar Usuário"
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingUser(null); editForm.resetFields(); }}
        onOk={() => editForm.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={updateMutation.isPending}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={(values) => {
          if (editingUser) {
            updateMutation.mutate({
              id: editingUser.id,
              payload: {
                first_name: values.first_name,
                last_name: values.last_name,
                status: values.status,
              },
            });
          }
        }}>
          <Form.Item name="first_name" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Sobrenome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={[
              { value: 'active', label: 'active' },
              { value: 'inactive', label: 'inactive' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
