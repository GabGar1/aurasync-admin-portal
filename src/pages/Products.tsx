import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, getFriendlyError } from "@/services/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTableFilters } from "@/hooks/useTableFilters";
import { formatCurrency } from "@/lib/formatters";
import { totalStock, sortProductsByStock } from "@/lib/stock";
import { toast } from "sonner";
import type { ProductVariant } from "@/types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import DataTablePagination from "@/components/DataTablePagination";
import { Package, Search, ChevronDown, ChevronUp, RefreshCw, AlertTriangle } from "lucide-react";

function StockIndicator({ quantity }: { quantity: number }) {
  if (quantity > 10) {
    return (
      <span className="text-green-600 font-medium flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-green-600" />
        {quantity}
      </span>
    );
  }
  if (quantity >= 5) {
    return (
      <span className="text-amber-600 font-medium flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-amber-600" />
        {quantity}
      </span>
    );
  }
  return (
    <span className="text-red-600 font-semibold flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-red-600" />
      {quantity}
      <Badge variant="destructive" className="ml-1 text-[10px] h-5 px-1.5">Repor</Badge>
    </span>
  );
}

function DimensionsDisplay({ variant }: { variant: ProductVariant }) {
  const v = variant as unknown as Record<string, unknown>;
  const weight = v.weight as number | null | undefined;
  const height = v.height as number | null | undefined;
  const width = v.width as number | null | undefined;
  const depth = v.depth as number | null | undefined;

  const hasDimensions = weight != null || height != null || width != null || depth != null;
  if (!hasDimensions) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="text-xs text-muted-foreground space-y-0.5">
      {weight != null && <div>Peso: {Number(weight).toFixed(3)} kg</div>}
      {(height != null || width != null || depth != null) && (
        <div>
          Dim.: {[width, height, depth]
            .filter((d) => d != null)
            .map((d) => Number(d))
            .join(" × ")}{" "}
          cm
        </div>
      )}
    </div>
  );
}

const categories = ["Brincos", "Anéis", "Braceletes", "Chokers", "Conjuntos", "Pingentes", "Chaveiros", "Decoração", "Pulseiras", "Geral"];

export default function Products() {
  const qc = useQueryClient();

  const { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter } = useTableFilters<{ category: string }>();
  const category = filter?.category ?? 'all';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", page, limit, debouncedSearch, category],
    queryFn: async () => {
      return productsApi.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        category: category !== "all" ? category : undefined,
      });
    },
    placeholderData: (previousData) => previousData,
  });

  useWebSocket("products_updated", useCallback(() => {
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success("Estoque atualizado em tempo real!");
  }, [qc]));

  const syncMutation = useMutation({
    mutationFn: productsApi.syncNuvemshop,
    onSuccess: (res) => {
      toast.success(`Sincronização concluída! ${res.processed || 0} produtos atualizados.`);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast.error(`Falha ao sincronizar: ${getFriendlyError(error)}`),
  });

  const [stockSort, setStockSort] = useState<'asc' | 'desc' | null>(null);

  function toggleStockSort() {
    setStockSort((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null));
  }

  const sortedProducts = useMemo(() => {
    const productsArray = data?.products;
    if (!productsArray || !Array.isArray(productsArray)) return [];
    if (stockSort) {
      return sortProductsByStock(productsArray, stockSort);
    }
    return [...productsArray].sort((a, b) => {
      return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    });
  }, [data, stockSort]);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (debouncedSearch) {
      setExpandedRows(new Set(sortedProducts.map((p) => p.id)));
    } else {
      setExpandedRows(new Set());
    }
  }, [debouncedSearch, sortedProducts]);

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const products = sortedProducts;
  const hasFilters = debouncedSearch || category !== "all";

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Produtos & Estoque</h1>
        <p className="text-sm text-muted-foreground">Catálogo master de produtos e variações</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do produto, SKU interno ou IDs..."
            className="pl-9"
            value={search}
            onChange={(e) => { changeSearch(e.target.value); }}
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => { changeFilter(value === 'all' ? undefined : { category: value }); }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between shrink-0">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} resultado${data.total !== 1 ? "s" : ""}` : ""}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sincronizar Nuvemshop
          </Button>
        </div>
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar produtos</AlertTitle>
              <AlertDescription>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : products.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum produto cadastrado</p>
            <p className="text-sm mb-4">
              {hasFilters ? "Tente ajustar os filtros." : "Nenhum produto cadastrado ainda. Sincronize com a Nuvemshop para começar."}
            </p>
          </div>
        ) : (
          <div className="[&>div]:overflow-visible">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-[3%] min-w-[2rem]" />
                  <TableHead>Nome do Produto</TableHead>
                  <TableHead className="w-[18%]">Categoria</TableHead>
                  <TableHead className="w-[13%]">Status</TableHead>
                  <TableHead className="w-[11%]">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={toggleStockSort}
                      title={stockSort ? "Clique para limpar a ordenação" : "Clique para ordenar por estoque"}
                    >
                      Estoque Local
                      {stockSort ? (
                        stockSort === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32 mt-1" />
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                products.map((product) => (
                  <Fragment key={product.id}>
                    <TableRow
                      key={`${product.id}-data`}
                      className="cursor-pointer transition-colors hover:bg-accent/20"
                      onClick={() => toggleRow(product.id)}
                    >
                      <TableCell>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expandedRows.has(product.id) ? "rotate-180" : ""
                          }`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="truncate font-semibold">{product.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{product.slug}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-transparent">
                          {product.category || "Geral"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StockIndicator quantity={totalStock(product.variants)} />
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(product.id) && (
                      product.variants && product.variants.length > 0 ? (
                        <TableRow key={`${product.id}-variants`} className="hover:bg-accent/20">
                          <TableCell colSpan={5} className="p-0">
                            <div className="bg-muted/30 rounded-xl mx-4 my-2 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                              <table className="w-full table-fixed text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">SKU</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[110px]">Preço</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[130px]">Estoque Local</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[140px]">Dimensões</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.variants.map((variant) => (
                                    <tr key={variant.id} className="border-b last:border-0">
                                      <td className="p-4 align-middle font-medium text-muted-foreground">
                                        {variant.name || "Padrão"}
                                      </td>
                                      <td className="p-4 align-middle">
                                        <div className="flex items-center gap-1">
                                          {variant.sku ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                              {variant.sku}
                                            </Badge>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                          {variant.has_promotional_price ? (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                                              Promoção
                                            </Badge>
                                          ) : null}
                                        </div>
                                      </td>
                                      <td className="p-4 align-middle">{formatCurrency(variant.price)}</td>
                                      <td className="p-4 align-middle">
                                        <StockIndicator quantity={variant.stock_quantity} />
                                      </td>
                                      <td className="p-4 align-middle">
                                        <DimensionsDisplay variant={variant} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={`${product.id}-novariants`} className="hover:bg-accent/20">
                          <TableCell colSpan={5} className="p-0">
                            <div className="bg-muted/30 rounded-xl mx-4 my-2 p-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-200">
                              Nenhuma variação cadastrada
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </Fragment>
                )))}
            </TableBody>
          </Table>
        </div>
        )}
      </div>

      {data && (
        <DataTablePagination
          page={data.page}
          limit={data.limit}
          total={data.total}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      )}
    </div>
  );
}
