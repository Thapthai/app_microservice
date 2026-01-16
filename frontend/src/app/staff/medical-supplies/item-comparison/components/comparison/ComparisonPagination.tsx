import { Button } from '@/components/ui/button';

interface ComparisonPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function ComparisonPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: ComparisonPaginationProps) {
  const generatePageNumbers = (current: number, total: number) => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (total <= maxVisible + 2) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} จากทั้งหมด {totalItems} รายการ
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            หน้า {currentPage} / {totalPages}
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            ก่อนหน้า
          </Button>
          
          {generatePageNumbers(currentPage, totalPages).map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                ...
              </span>
            ) : (
              <Button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={currentPage === page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={currentPage === page ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {page}
              </Button>
            )
          )}
          
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}
