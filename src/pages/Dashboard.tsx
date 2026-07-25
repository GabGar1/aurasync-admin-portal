import { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Select, Input, Space, DatePicker } from 'antd';
import { DollarSign, TrendingDown, AlertCircle, Search } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ProductVariant {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
}

interface Product {
    nuvemshop_id: string;
    name: string;
    slug: string;
    category: string;
    active: boolean;
    lastUpdate: string;
    variants: ProductVariant[];
}

const mockProducts: Product[] = [
    { nuvemshop_id: '1', name: 'Brinco Argola Cravejada', slug: 'brinco-argola', category: 'Brincos', active: true, lastUpdate: '2026-06-20', variants: [{ id: 'v1', sku: 'BR-01', name: 'Dourado', price: 45, stock: 50 }] },
    { nuvemshop_id: '2', name: 'Anel Solitário Ouro', slug: 'anel-solitario', category: 'Aneis', active: true, lastUpdate: '2026-06-15', variants: [{ id: 'v2', sku: 'AN-01', name: '18', price: 120, stock: 0 }] },
    { nuvemshop_id: '3', name: 'Choker Fita Lisa', slug: 'choker-fita', category: 'Chokers', active: true, lastUpdate: '2026-05-10', variants: [{ id: 'v3', sku: 'CH-01', name: 'Prata', price: 80, stock: 3 }] },
    { nuvemshop_id: '4', name: 'Pulseira Elos', slug: 'pulseira-elos', category: 'Pulseiras', active: true, lastUpdate: '2026-06-01', variants: [{ id: 'v4', sku: 'PU-01', name: 'Única', price: 65, stock: 30 }] },
];

const categoryData = [
    { name: 'Brincos', value: 35 },
    { name: 'Aneis', value: 25 },
    { name: 'Chokers', value: 20 },
    { name: 'Pulseiras', value: 20 },
];

const topMarginData = [
    { name: 'Anel Solitário', margin: 85 },
    { name: 'Choker Fita', margin: 78 },
    { name: 'Brinco Argola', margin: 72 },
    { name: 'Pulseira Elos', margin: 65 }
];

const actionableInsights = [
    { id: '1', type: 'RUPTURA', product: 'Anel Solitário Ouro (18)', action: 'Repor item esgotado', impact: 'Perda de R$ 120/venda' },
    { id: '2', type: 'ESTOQUE BAIXO', product: 'Choker Fita Lisa (Prata)', action: 'Comprar 20 unidades', impact: 'Risco de perda de giro' },
    { id: '3', type: 'ENCALHE', product: 'Pulseira Elos (Única)', action: 'Promoção 20% OFF', impact: 'Libera R$ 1.950,00' },
];

const COLORS = ['#9966CC', '#52c41a', '#faad14', '#1890ff'];

export default function InventoryIntelligence() {
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

    const metrics = useMemo(() => {
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        mockProducts.forEach(product => {
            if (categoryFilter && product.category !== categoryFilter) return;
            if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return;

            if (dateRange && dateRange[0] && dateRange[1]) {
                const productDate = dayjs(product.lastUpdate);
                if (!productDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) return;
            }

            product.variants.forEach(variant => {
                if (variant.stock > 0) {
                    totalValue += variant.price * variant.stock;
                }

                if (variant.stock === 0) {
                    outOfStockCount++;
                } else if (variant.stock <= 5) {
                    lowStockCount++;
                }
            });
        });

        return { totalValue, lowStockCount, outOfStockCount };
    }, [categoryFilter, searchTerm, dateRange]);

    const insightsColumns = [
        {
            title: 'Diagnóstico',
            dataIndex: 'type',
            render: (type: string) => {
                let color = 'warning';
                if (type === 'RUPTURA') color = 'red';
                if (type === 'ENCALHE') color = 'blue';
                return <Tag color={color}>{type}</Tag>;
            }
        },
        { title: 'Produto', dataIndex: 'product', className: 'font-medium' },
        { title: 'Ação Sugerida', dataIndex: 'action', render: (text: string) => <a className="text-blue-600 cursor-pointer">{text}</a> },
        { title: 'Impacto Projetado', dataIndex: 'impact', className: 'text-gray-500' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8">
                <div>
                    <Title level={2} className="!m-0 text-gray-900">Inteligência de Estoque</Title>
                    <Text type="secondary">Análise de valor, risco de ruptura e insights estratégicos.</Text>
                </div>

                <Space className="w-full xl:w-auto" direction="horizontal" size="middle" wrap>
                    <Input
                        prefix={<Search size={16} className="text-gray-400" />}
                        placeholder="Buscar produto..."
                        allowClear
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 220 }}
                    />
                    <Select
                        placeholder="Todas as Categorias"
                        allowClear
                        onChange={setCategoryFilter}
                        style={{ width: 160 }}
                        options={[
                            { value: 'Brincos', label: 'Brincos' },
                            { value: 'Aneis', label: 'Anéis' },
                            { value: 'Chokers', label: 'Chokers' },
                            { value: 'Pulseiras', label: 'Pulseiras' },
                            { value: 'Conjuntos', label: 'Conjuntos' },
                        ]}
                    />
                    <RangePicker
                        onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                        format="DD/MM/YYYY"
                        style={{ width: 260 }}
                        placeholder={['Data Inicial', 'Data Final']}
                    />
                </Space>
            </div>

            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Valor do Estoque (Disponível)"
                            value={metrics.totalValue}
                            precision={2}
                            prefix={<DollarSign size={20} className="mr-1" />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Risco de Ruptura (Estoque ≤ 5)"
                            value={metrics.lowStockCount}
                            prefix={<TrendingDown size={20} className="mr-2" />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Produtos Esgotados"
                            value={metrics.outOfStockCount}
                            prefix={<AlertCircle size={20} className="mr-2" />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} lg={12}>
                    <Card title="Composição do Estoque" bordered={false} className="shadow-sm">
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Top Margens de Lucro Projetadas" bordered={false} className="shadow-sm">
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topMarginData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis unit="%" axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="margin" fill="#9966CC" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title="Ações Recomendadas" bordered={false} className="shadow-sm">
                <Table
                    dataSource={actionableInsights}
                    columns={insightsColumns}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    scroll={{ x: 600 }}
                />
            </Card>
        </div>
    );
}