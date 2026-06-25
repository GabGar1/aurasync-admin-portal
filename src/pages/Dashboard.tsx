import { useState } from 'react';
import { Card, Table, Tag, Row, Col, Progress, Typography, Space, Alert, Badge } from 'antd';
import { WarningOutlined, ArrowUpOutlined, ArrowDownOutlined, InboxOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// ─── DADOS MOCKADOS (Ajustados para seu nicho real de Semijoias) ─────────────────
const mockLowStock = [
    { id: 'v-101', name: 'Anel Regulável Falange', sku: 'AN-REG-01', category: 'Aneis', stock: 2, status: 'CRÍTICO' },
    { id: 'v-102', name: 'Brinco Argola Cravejada M', sku: 'BR-ARG-02', category: 'Brincos', stock: 5, status: 'REPOR' },
    { id: 'v-103', name: 'Choker Fita Lisa', sku: 'CK-FIT-01', category: 'Chokers', stock: 1, status: 'CRÍTICO' },
    { id: 'v-104', name: 'Pulseira Elos Portugueses', sku: 'PL-ELO-05', category: 'Pulseiras', stock: 4, status: 'REPOR' },
];

const mockTopSelling = [
    { key: '1', name: 'Brinco Ponto de Luz Zircônia', sku: 'BR-PTL-01', category: 'Brincos', soldQty: 142, revenue: 3976.00, stock: 45 },
    { key: '2', name: 'Colar Gravatinha Coração', sku: 'CL-GRA-02', category: 'Chokers', soldQty: 98, revenue: 5782.00, stock: 22 },
    { key: '3', name: 'Anel Solitário Clássico', sku: 'AN-SOL-01', category: 'Aneis', soldQty: 85, revenue: 7565.00, stock: 19 },
    { key: '4', name: 'Bracelete Liso Rígido', sku: 'BC-LIS-01', category: 'Braceletes', soldQty: 64, revenue: 5696.00, stock: 12 },
];

const mockLowSelling = [
    { key: '1', name: 'Chaveiro Olho Grego Patuá', sku: 'CH-OLH-09', category: 'Chaveiros', soldQty: 2, daysInStock: 120, stock: 40 },
    { key: '2', name: 'Pingente Letra Inicial Custom', sku: 'PG-LET-01', category: 'Pingentes', soldQty: 5, daysInStock: 95, stock: 55 },
    { key: '3', name: 'Conjunto Gota Esmeralda Fusion', sku: 'CJ-GOT-04', category: 'Conjuntos', soldQty: 7, daysInStock: 80, stock: 15 },
];

export default function StockControl() {
    // Colunas para Alerta de Reposição
    const lowStockColumns = [
        {
            title: 'Item / Variação',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.category} • SKU: {record.sku}</Text>
                </Space>
            ),
        },
        {
            title: 'Estoque Atual',
            dataIndex: 'stock',
            key: 'stock',
            width: 120,
            render: (stock: number) => <Text strong type="danger">{stock} un.</Text>,
        },
        {
            title: 'Nível de Urgência',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status: string) => (
                <Tag color={status === 'CRÍTICO' ? 'red' : 'orange'} style={{ fontWeight: 600 }}>
                    {status}
                </Tag>
            ),
        },
    ];

    // Colunas para os Mais Vendidos
    const topSellingColumns = [
        {
            title: 'Produto',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Tag color="purple" style={{ fontSize: '10px', lineHeight: '14px' }}>{record.category}</Tag>
                </Space>
            ),
        },
        {
            title: 'Qtd Vendida',
            dataIndex: 'soldQty',
            key: 'soldQty',
            width: 120,
            render: (qty: number) => (
                <Space style={{ color: '#52c41a', fontWeight: 600 }}>
                    <ArrowUpOutlined /> {qty}
                </Space>
            ),
        },
        {
            title: 'Faturamento',
            dataIndex: 'revenue',
            key: 'revenue',
            width: 130,
            render: (val: number) => `R$ ${val.toFixed(2)}`,
        },
    ];

    // Colunas para os Menos Vendidos (Encalhados)
    const lowSellingColumns = [
        {
            title: 'Produto Sem Giro',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>SKU: {record.sku}</Text>
                </Space>
            ),
        },
        {
            title: 'Vendas (Período)',
            dataIndex: 'soldQty',
            key: 'soldQty',
            width: 140,
            render: (qty: number) => (
                <Space style={{ color: '#faad14', fontWeight: 500 }}>
                    <ArrowDownOutlined /> {qty} un.
                </Space>
            ),
        },
        {
            title: 'Dias Parado',
            dataIndex: 'daysInStock',
            key: 'daysInStock',
            width: 120,
            render: (days: number) => <Text type="danger">{days} dias</Text>,
        },
    ];

    return (
        <div className="p-2">
            <div className="mb-6">
                <Title level={2} style={{ margin: 0, color: '#333' }}>Controle de Estoque Analítico</Title>
                <Text type="secondary">Gestão de saúde do inventário, curva ABC e necessidade de compras</Text>
            </div>

            {/* ─── SEÇÃO 1: ALERTAS DE REPOSIÇÃO (Mecanismo Crítico) ─────────────────── */}
            <Card
                title={
                    <Space>
                        <WarningOutlined style={{ color: '#ff4d4f' }} />
                        <span>Alerta de Reposição Imediata</span>
                        <Badge count={mockLowStock.length} style={{ backgroundColor: '#ff4d4f' }} />
                    </Space>
                }
                className="shadow-sm mb-6"
                bordered={false}
            >
                <Alert
                    message="Atenção: Itens abaixo estão operando abaixo do estoque mínimo de segurança determinado para Semijoias."
                    type="error"
                    showIcon
                    className="mb-4"
                />
                <Table
                    dataSource={mockLowStock}
                    columns={lowStockColumns}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                />
            </Card>

            {/* ─── SEÇÃO 2: MAIS VENDIDOS VS MENOS VENDIDOS (Desempenho Comercial) ──── */}
            <Row gutter={[20, 20]}>
                {/* Card da Esquerda: Mais Vendidos */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <ArrowUpOutlined style={{ color: '#52c41a' }} />
                                <span>Produtos Mais Vendidos (Top Giro)</span>
                            </Space>
                        }
                        className="shadow-sm"
                        bordered={false}
                    >
                        <Table
                            dataSource={mockTopSelling}
                            columns={topSellingColumns}
                            pagination={false}
                            size="middle"
                        />
                    </Card>
                </Col>

                {/* Card da Direita: Menos Vendidos / Encalhados */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <InboxOutlined style={{ color: '#faad14' }} />
                                <span>Produtos Menos Vendidos (Alerta de Encalhe)</span>
                            </Space>
                        }
                        className="shadow-sm"
                        bordered={false}
                    >
                        <Table
                            dataSource={mockLowSelling}
                            columns={lowSellingColumns}
                            pagination={false}
                            size="middle"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}