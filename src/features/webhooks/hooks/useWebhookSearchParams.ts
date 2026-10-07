import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export const useWebhookSearchParams = () => {
  const [params, setParams] = useSearchParams();
  const rawPage = params.get('page');
  const page = parsePage(rawPage);
  const search = params.get('search') ?? '';

  useEffect(() => {
    if (rawPage === null || rawPage === String(page)) return;
    const next = new URLSearchParams(params);
    next.set('page', String(page));
    setParams(next, { replace: true });
  }, [page, params, rawPage, setParams]);

  const setPage = useCallback(
    (nextPage: number, replace = false) => {
      const next = new URLSearchParams(params);
      next.set('page', String(Math.max(1, nextPage)));
      setParams(next, { replace });
    },
    [params, setParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      const next = new URLSearchParams(params);
      const normalized = value.trim();
      if (normalized) next.set('search', normalized);
      else next.delete('search');
      next.set('page', '1');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  return { page, search, setPage, setSearch };
};
