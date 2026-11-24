import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MusicListPages({ items, pageSize }: { items: ReactNode[]; pageSize: number }) {
  const [requestedPage, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount - 1);

  return (
    <div className="min-w-0 space-y-1">
      {items.slice(page * pageSize, (page + 1) * pageSize)}
      {pageCount > 1 && (
        <nav aria-label="صفحات الأغاني" className="flex items-center justify-center gap-3 text-xs text-amber-100">
          <button type="button" aria-label="الصفحة السابقة" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-lg bg-white/10 p-1.5 disabled:opacity-30"><ChevronRight size={16} /></button>
          <bdi aria-live="polite">{page + 1} / {pageCount}</bdi>
          <button type="button" aria-label="الصفحة التالية" disabled={page + 1 === pageCount} onClick={() => setPage(page + 1)} className="rounded-lg bg-white/10 p-1.5 disabled:opacity-30"><ChevronLeft size={16} /></button>
        </nav>
      )}
    </div>
  );
}
