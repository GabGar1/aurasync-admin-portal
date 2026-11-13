import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { externalSalesApi } from '@/services/api';
import { isPreviewable } from '@/lib/sales';
import type { ExternalSalePayload } from '@/types';

const DEBOUNCE_MS = 400;

/** Debounced live preview of the sale being filled in (cost and margin come from the API). */
export function useSalePreview(payload: ExternalSalePayload) {
  // The customer does not change the numbers: leave it out so typing a name does not refetch.
  const { customer_name: _name, customer_email: _email, ...numbers } = payload;
  const key = JSON.stringify(numbers);
  const [debouncedKey, setDebouncedKey] = useState(key);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKey(key), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key]);

  const enabled = isPreviewable(payload) && debouncedKey === key;
  return useQuery({
    queryKey: ['sale-preview', debouncedKey],
    queryFn: () => externalSalesApi.preview(JSON.parse(debouncedKey)),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    retry: false,
  });
}
