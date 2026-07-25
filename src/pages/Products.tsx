import {useState, useMemo, useEffect} from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, Space, message, Card, Row, Col } from 'antd';
import { PlusOutlined, SyncOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import type { Product, ProductVariant } from '@/types';
import { useWebSocket } from "@/hooks/useWebSocket.ts";
import CreateProductModal from "@/components/CreateProductModal.tsx";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Products() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  // Estados de Paginação e Filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 500);

  // Consome a função getAll com a assinatura exata do seu arquivo api.ts
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['products', page, limit, debouncedSearch, category],
    queryFn: async () => {
      return productsApi.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        category: category || undefined,
      });
    },
    placeholderData: (previousData) => previousData,
  });

  useWebSocket('products_updated', () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    message.success('Estoque atualizado em tempo real!');
  });

  const syncMutation = useMutation({
    mutationFn: productsApi.syncNuvemshop,
    onSuccess: (res) => {
      message.success(`Sincronização concluída! ${res.processed || 0} produtos atualizados.`);
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => message.error(`Falha ao sincronizar: ${error.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      message.success('Produto excluído com sucesso');
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => message.error(`Falha ao excluir: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`),
  });

  // Ordenação baseada no seu tipo real: product.is_active
  const sortedProducts = useMemo(() => {
    const productsArray = apiResponse?.products;
    if (!productsArray || !Array.isArray(productsArray)) return [];

    return [...productsArray].sort((a, b) => {
      return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    });
  }, [apiResponse]);

  // Expandir automaticamente as linhas quando houver termo de busca ativa
  const expandedRowKeys = useMemo(() => {
    if (!debouncedSearch) return [];
    return sortedProducts.map(p => p.id);
  }, [debouncedSearch, sortedProducts]);

  // Sub-tabela baseada estritamente nas propriedades do seu ProductVariant
  const expandedRowRender = (product: Product) => {
    const variantColumns = [
      {
        title: 'ID Variante',
        dataIndex: 'id',
        key: 'id',
        width: 150,
        render: (id: string) => <span style={{ color: '#aaa', fontSize: '11px', fontFamily: 'monospace' }}>{id}</span>
      },
      {
        title: 'Nome da Variação',
        dataIndex: 'name',
        key: 'name',
        render: (name: string) => <span style={{ fontWeight: 500, color: '#555' }}>{name || 'Padrão'}</span>
      },
      {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
        render: (sku: string) => sku ? <Tag color="blue">{sku}</Tag> : '-'
      },
      {
        title: 'Preço',
        dataIndex: 'price',
        key: 'price',
        width: 130,
        render: (v: number) => `R$ ${Number(v || 0).toFixed(2)}`
      },
      {
        title: 'Estoque Local',
        dataIndex: 'stock_quantity',
        key: 'stock_quantity',
        width: 130,
        render: (stock: number) => {
          const s = Number(stock || 0);
          return (
              <span style={{ color: s <= 10 ? '#ff4d4f' : '#27ae60', fontWeight: s <= 5 ? 600 : 400 }}>
              {s} {s <= 10 ? '⚠️ Repor' : '✓'}
            </span>
          );
        }
      }
    ];

    return (
        <Table
            columns={variantColumns}
            dataSource={product.variants || []}
            pagination={false}
            rowKey="id"
            size="small"
            bordered
        />
    );
  };

  const columns = [
    {
      title: 'Nome do Produto',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 600, color: '#111' }}>{name}</span>
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug: string) => <span style={{ color: '#666', fontSize: '12px' }}>{slug}</span>
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: string) => cat ? <Tag color="purple">{cat}</Tag> : <Tag color="warning">Geral</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (active: boolean) => (
          <Tag color={active ? 'green' : 'default'}>{active ? 'Ativo' : 'Inativo'}</Tag>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Product) => (
        <Button
          danger
          size="small"
          loading={deleteMutation.isPending}
          onClick={() => {
            Modal.confirm({
              title: 'Excluir produto?',
              content: `Tem certeza que deseja excluir "${record.name}"?`,
              okText: 'Excluir',
              okType: 'danger',
              cancelText: 'Cancelar',
              onOk: () => deleteMutation.mutate(record.id),
            });
          }}
        >
          Excluir
        </Button>
      ),
    }
  ];

  return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Produtos & Estoque</h1>
            <p className="text-gray-400 text-xs">Catálogo master de produtos e variações</p>
          </div>
          <Space>
            <Button
                icon={<SyncOutlined spin={syncMutation.isPending} />}
                onClick={() => syncMutation.mutate()}
                loading={syncMutation.isPending}
            >
              Sincronizar Nuvemshop
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Add Product
            </Button>
          </Space>
        </div>

        <Card className="mb-6" size="small" title={<Space><FilterOutlined />Filtros Estatísticos</Space>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Input
                  placeholder="Pesquisar por nome do produto, SKU interno ou IDs..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={search}
                  allowClear
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </Col>
            <Col xs={24} md={10}>
              <Select
                  className="w-full"
                  placeholder="Filtrar por Categoria"
                  allowClear
                  value={category}
                  onChange={(value) => { setCategory(value); setPage(1); }}
                  options={[
                    { value: 'Brincos ', label: 'Brincos' },
                    { value: 'Anéis', label: 'Anéis' },
                    { value: 'Braceletes ', label: 'Braceletes' },
                    { value: 'Chokers', label: 'Chokers' },
                    { value: 'Conjuntos', label: 'Conjuntos' },
                    { value: 'Pingentes', label: 'Pingentes' },
                    { value: 'Chaveiros', label: 'Chaveiros' },
                    { value: 'Decoração', label: 'Decoração' },
                    { value: 'Pulseiras ', label: 'Pulseiras' },
                    { value: 'Geral', label: 'Geral' },
                  ]}
              />
            </Col>
          </Row>
        </Card>

        <Table
            rowKey="id"
            loading={isLoading}
            dataSource={sortedProducts}
            columns={columns}
            bordered
            size="middle"
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => record.variants && record.variants.length > 0,
              expandedRowKeys: expandedRowKeys.length > 0 ? expandedRowKeys : undefined,
            }}
            pagination={{
              current: page,
              pageSize: limit,
              total: apiResponse?.total || 0,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (p, s) => {
                setPage(p);
                setLimit(s);
              }
            }}
        />

        <CreateProductModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => qc.invalidateQueries({ queryKey: ['products'] })}
        />
      </div>
  );
}