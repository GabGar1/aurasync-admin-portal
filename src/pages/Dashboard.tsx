import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, AlertCircle, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  { name: 'Pulseira Elos', margin: 65 },
];

const actionableInsights = [
  { id: '1', type: 'RUPTURA', product: 'Anel Solitário Ouro (18)', action: 'Repor item esgotado', impact: 'Perda de R$ 120/venda' },
  { id: '2', type: 'ESTOQUE BAIXO', product: 'Choker Fita Lisa (Prata)', action: 'Comprar 20 unidades', impact: 'Risco de perda de giro' },
  { id: '3', type: 'ENCALHE', product: 'Pulseira Elos (Única)', action: 'Promoção 20% OFF', impact: 'Libera R$ 1.950,00' },
];

const COLORS = ['#9966CC', '#52c41a', '#faad14', '#1890ff'];

function TypeBadge({ type }: { type: string }) {
  if (type === 'RUPTURA') {
    return <Badge variant="destructive">{type}</Badge>;
  }
  if (type === 'ESTOQUE BAIXO') {
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">{type}</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">{type}</Badge>;
}

export default function InventoryIntelligence() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const metrics = useMemo(() => {
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    mockProducts.forEach((product) => {
      if (categoryFilter !== 'all' && product.category !== categoryFilter) return;
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return;

      if (startDate && endDate) {
        const productDate = new Date(product.lastUpdate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (productDate < start || productDate > end) return;
      }

      product.variants.forEach((variant) => {
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
  }, [categoryFilter, searchTerm, startDate, endDate]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar estatísticas</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            Não foi possível conectar ao servidor.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inteligência de Estoque</h1>
          <p className="text-sm text-muted-foreground">Análise de valor, risco de ruptura e insights estratégicos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="Brincos">Brincos</SelectItem>
              <SelectItem value="Aneis">Anéis</SelectItem>
              <SelectItem value="Chokers">Chokers</SelectItem>
              <SelectItem value="Pulseiras">Pulseiras</SelectItem>
              <SelectItem value="Conjuntos">Conjuntos</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[150px]"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[150px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="hover:-translate-y-0.5 hover:shadow-card transition-all duration-300 motion-safe:animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor do Estoque</CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {metrics.totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="hover:-translate-y-0.5 hover:shadow-card transition-all duration-300 motion-safe:animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risco de Ruptura (Estoque ≤ 5)</CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.lowStockCount}</div>
            </CardContent>
          </Card>
          <Card className="hover:-translate-y-0.5 hover:shadow-card transition-all duration-300 motion-safe:animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Esgotados</CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.outOfStockCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Composição do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Margens de Lucro Projetadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMarginData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="margin" fill="#9966CC" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          {actionableInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma ação recomendada no momento</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Ação Sugerida</TableHead>
                  <TableHead>Impacto Projetado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionableInsights.map((insight) => (
                  <TableRow key={insight.id}>
                    <TableCell>
                      <TypeBadge type={insight.type} />
                    </TableCell>
                    <TableCell className="font-medium">{insight.product}</TableCell>
                    <TableCell>
                      <span className="text-blue-600 cursor-pointer">{insight.action}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{insight.impact}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
