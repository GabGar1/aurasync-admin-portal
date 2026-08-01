import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { productsApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';

export interface PickedVariant {
  variant_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  price: number;
  stock_quantity: number;
}

interface Props {
  value: PickedVariant | null;
  onSelect: (variant: PickedVariant) => void;
  placeholder?: string;
}

export default function VariantPicker({ value, onSelect, placeholder = 'Buscar produto ou variante...' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => productsApi.getAll({ search: debouncedSearch || undefined, limit: 10 }),
    enabled: open,
    placeholderData: (previousData) => previousData,
  });

  const options: PickedVariant[] = (data?.products ?? []).flatMap((product) =>
    product.variants.map((variant) => ({
      variant_id: variant.id,
      product_name: product.name,
      variant_name: variant.name,
      sku: variant.sku,
      price: variant.price,
      stock_quantity: variant.stock_quantity,
    }))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? `${value.product_name} — ${value.variant_name}` : placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <CommandInput
              placeholder="Pesquisar produto ou variante..."
              value={search}
              onValueChange={setSearch}
              className="h-9 border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.variant_id}
                  value={`${option.product_name} ${option.variant_name} ${option.sku}`}
                  onSelect={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value?.variant_id === option.variant_id ? 'opacity-100' : 'opacity-0')} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{option.product_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {option.variant_name} · {option.sku} · {option.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
