import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListControlsProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (p: number) => void;
  label?: string;
}

export function SearchBar({ search, onSearchChange, placeholder = 'Search…' }: Pick<ListControlsProps, 'search' | 'onSearchChange' | 'placeholder'>) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

export function PaginationBar({ page, totalPages, totalCount, onPageChange, label = 'items' }: Omit<ListControlsProps, 'search' | 'onSearchChange' | 'placeholder'>) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-muted-foreground">
        {totalCount} {label} · Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
