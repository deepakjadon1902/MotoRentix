import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminPaginationProps = {
  page: number;
  pageSize?: number;
  total: number;
  onPageChange: (page: number) => void;
};

const AdminPagination = ({ page, pageSize = 10, total, onPageChange }: AdminPaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);

  const goTo = (nextPage: number) => onPageChange(Math.min(Math.max(nextPage, 1), totalPages));

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => {
    if (totalPages <= 5) return true;
    return item === 1 || item === totalPages || Math.abs(item - safePage) <= 1;
  });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-muted-foreground">
        Showing <span className="text-foreground">{start}-{end}</span> of <span className="text-foreground">{total}</span> records
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => goTo(safePage - 1)}
          disabled={safePage <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-bold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft size={15} />
          Prev
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((item, index) => {
            const previous = pages[index - 1];
            const needsGap = previous && item - previous > 1;
            return (
              <div key={item} className="flex items-center gap-1">
                {needsGap && <span className="px-1 text-xs font-bold text-muted-foreground">...</span>}
                <button
                  type="button"
                  onClick={() => goTo(item)}
                  className={`h-9 min-w-9 rounded-md px-3 text-xs font-bold transition ${
                    item === safePage ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {item}
                </button>
              </div>
            );
          })}
        </div>

        <span className="rounded-md bg-secondary px-3 py-2 text-xs font-bold text-foreground sm:hidden">
          {safePage}/{totalPages}
        </span>

        <button
          type="button"
          onClick={() => goTo(safePage + 1)}
          disabled={safePage >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-bold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
