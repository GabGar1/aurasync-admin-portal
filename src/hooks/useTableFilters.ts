import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface Options {
  defaultLimit?: number;
}

export function useTableFilters<TFilter>(options: Options = {}) {
  const { defaultLimit = 10 } = options;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TFilter | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 500);

  function resetPage() {
    setPage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function changeLimit(value: number) {
    setLimit(value);
    resetPage();
  }

  function changeFilter(value: TFilter | undefined) {
    setFilter(value);
    resetPage();
  }

  return { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter };
}
