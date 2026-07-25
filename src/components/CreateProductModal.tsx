import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsApi } from "@/services/api";
import type { CreateProductPayload } from "@/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = ["Brincos", "Anéis", "Braceletes", "Chokers", "Conjuntos", "Pingentes", "Chaveiros", "Decoração", "Pulseiras", "Geral"];

export default function CreateProductModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [platformFeePercent, setPlatformFeePercent] = useState("");
  const [fixedFee, setFixedFee] = useState("");

  function resetForm() {
    setName("");
    setSlug("");
    setCategory("");
    setSku("");
    setPrice("");
    setStockQuantity("");
    setCostPrice("");
    setPackagingCost("");
    setPlatformFeePercent("");
    setFixedFee("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug || !category || !sku || !price || !stockQuantity || !costPrice || !packagingCost || !platformFeePercent || !fixedFee) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateProductPayload = {
        slug,
        name,
        category,
        is_active: true,
        variants: [{
          sku,
          name: "Padrão",
          price: parseFloat(price),
          stock_quantity: parseInt(stockQuantity),
          cost_price: parseFloat(costPrice),
          packaging_cost: parseFloat(packagingCost),
          platform_fee_percent: parseFloat(platformFeePercent),
          fixed_fee: parseFloat(fixedFee),
        }],
      };
      await productsApi.create(payload);
      toast.success("Produto criado com sucesso!");
      onSuccess();
      resetForm();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error?.response?.data?.error || error?.message || "Erro ao criar produto");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent side="right" className="w-[640px] sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Criar Produto</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                placeholder="Ex: Anel Solitário Ouro 18k"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="Ex: anel-solitario-ouro-18k"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="Ex: AN-SOL-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço de Venda (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Estoque</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                placeholder="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Preço de Custo (R$)</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packaging_cost">Custo de Embalagem (R$)</Label>
              <Input
                id="packaging_cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform_fee_percent">Taxa da Plataforma (%)</Label>
              <Input
                id="platform_fee_percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fixed_fee">Taxa Fixa (R$)</Label>
              <Input
                id="fixed_fee"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Produto"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
