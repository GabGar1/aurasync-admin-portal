import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { externalSalesApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import type { Customer } from '@/types';

interface Props {
  onSelect: (customer: Customer) => void;
}

export default function CustomerPicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data } = useQuery({
    queryKey: ['external-sales-customers', debouncedSearch],
    queryFn: () => externalSalesApi.searchCustomers({ search: debouncedSearch || undefined, limit: 10 }),
    enabled: open,
    placeholderData: (previousData) => previousData,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          Buscar cliente existente...
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <CommandInput
              placeholder="Buscar por nome ou email..."
              value={search}
              onValueChange={setSearch}
              className="h-9 border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
            <CommandGroup>
              {(data?.customers ?? []).map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} ${customer.email ?? ''}`}
                  onSelect={() => {
                    onSelect(customer);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 opacity-0')} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{customer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
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
