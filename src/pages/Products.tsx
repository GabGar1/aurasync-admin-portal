import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/services/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, ChevronDown, ChevronLeft, ChevronRight, Plus, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
import CreateProductModal from "@/components/CreateProductModal";

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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
  const v = variant as Record<string, unknown>;
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
  const { getUser } = useAuth();
  const currentUser = getUser();
  const admin = isAdmin(currentUser?.role);
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const debouncedSearch = useDebounce(search, 500);

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

  useWebSocket("products_updated", () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success("Estoque atualizado em tempo real!");
  });

  const syncMutation = useMutation({
    mutationFn: productsApi.syncNuvemshop,
    onSuccess: (res) => {
      toast.success(`Sincronização concluída! ${res.processed || 0} produtos atualizados.`);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast.error(`Falha ao sincronizar: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      toast.success("Produto excluído com sucesso");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: ApiError) => toast.error(
      `Falha ao excluir: ${err?.response?.data?.error || err?.message || "Erro desconhecido"}`,
    ),
  });

  const sortedProducts = useMemo(() => {
    const productsArray = data?.products;
    if (!productsArray || !Array.isArray(productsArray)) return [];
    return [...productsArray].sort((a, b) => {
      return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    });
  }, [data]);

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

  function handleDeleteClick(product: Product) {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
    setDeleteDialogOpen(false);
    setDeletingProduct(null);
  }

  const products = sortedProducts;
  const hasFilters = debouncedSearch || category !== "all";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Produtos & Estoque</h1>
        <p className="text-sm text-muted-foreground">Catálogo master de produtos e variações</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome do produto, SKU interno ou IDs..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              value={category}
              onValueChange={(value) => { setCategory(value); setPage(1); }}
            >
              <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} resultado${data.total !== 1 ? "s" : ""}` : ""}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sincronizar Nuvemshop
          </Button>
          {admin ? (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar produtos</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : products.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum produto cadastrado</p>
          <p className="text-sm mb-4">
            {hasFilters ? "Tente ajustar os filtros." : "Cadastre seu primeiro produto para começar."}
          </p>
          {admin && !hasFilters ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Produto
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]" />
                <TableHead>Nome do Produto</TableHead>
                <TableHead className="w-[130px]">Categoria</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[90px]">Variações</TableHead>
                {admin ? <TableHead className="w-[80px] text-center">Ações</TableHead> : null}
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
                    {admin ? <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell> : null}
                  </TableRow>
                ))
              ) : (
              products.map((product) => (
                <Collapsible
                  key={product.id}
                  open={expandedRows.has(product.id)}
                  onOpenChange={() => toggleRow(product.id)}
                >
                  <TableRow
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
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.slug}</div>
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
                    <TableCell className="text-muted-foreground">
                      {product.variants?.length || 0}
                    </TableCell>
                    {admin ? (
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(product);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                  <CollapsibleContent>
                    {product.variants && product.variants.length > 0 ? (
                      <TableRow className="hover:bg-accent/20">
                        <TableCell colSpan={admin ? 6 : 5} className="p-0">
                          <div className="bg-muted/30 rounded-xl mx-4 my-2 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[140px]">ID Variante</TableHead>
                                  <TableHead>Nome</TableHead>
                                  <TableHead className="w-[100px]">SKU</TableHead>
                                  <TableHead className="w-[110px]">Preço</TableHead>
                                  <TableHead className="w-[130px]">Estoque Local</TableHead>
                                  <TableHead className="w-[140px]">Dimensões</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {product.variants.map((variant) => (
                                  <TableRow key={variant.id}>
                                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                                      {variant.id}
                                    </TableCell>
                                    <TableCell className="font-medium text-muted-foreground">
                                      {variant.name || "Padrão"}
                                    </TableCell>
                                    <TableCell>
                                      {variant.sku ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {variant.sku}
                                        </Badge>
                                      ) : "-"}
                                    </TableCell>
                                    <TableCell>{formatCurrency(variant.price)}</TableCell>
                                    <TableCell>
                                      <StockIndicator quantity={variant.stock_quantity} />
                                    </TableCell>
                                    <TableCell>
                                      <DimensionsDisplay variant={variant} />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow className="hover:bg-accent/20">
                        <TableCell colSpan={admin ? 6 : 5} className="p-0">
                          <div className="bg-muted/30 rounded-xl mx-4 my-2 p-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-200">
                            Nenhuma variação cadastrada
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
        {data && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {data.page} de {Math.ceil(data.total / data.limit)}
              </span>
              <Select
                value={String(limit)}
                onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(data.total / data.limit)}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        </>
      )}

      <CreateProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["products"] })}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingProduct?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
