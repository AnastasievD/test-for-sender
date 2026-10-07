import { useSearchParams } from 'react-router-dom';

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export const useWebhookSearchParams = () => {
  const [params, setParams] = useSearchParams();
  const page = parsePage(params.get('page'));
  const search = params.get('search') ?? '';

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(Math.max(1, nextPage)));
    setParams(next);
  };

  const setSearch = (value: string) => {
    const next = new URLSearchParams(params);
    const normalized = value.trim();
    if (normalized) next.set('search', normalized);
    else next.delete('search');
    next.set('page', '1');
    setParams(next, { replace: true });
  };

  return { page, search, setPage, setSearch };
};
