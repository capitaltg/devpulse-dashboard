import { useMemo, useState } from 'react';

export function usePaginatedFilter<T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  pageSize = 10
) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((item) => filterFn(item, q)) : items;
  }, [items, search, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    search,
    setSearch: (v: string) => { setSearch(v); setPage(1); },
    page: safePage,
    setPage,
    totalPages,
    filtered,
    paginated,
    totalCount: filtered.length,
  };
}
