'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/types/item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CategorySelectProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function CategorySelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'เลือกหมวดหมู่...',
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((cat) => cat.id === value);

  const loadCategories = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (loading || (!reset && !hasMore)) return;

    try {
      setLoading(true);
      const response = await categoriesApi.getAll({
        page: pageNum,
        limit: 20,
      });

      if (response.data) {
        const newCategories = response.data;
        
        setCategories((prev) => reset ? newCategories : [...prev, ...newCategories]);
        
        // Check if there are more pages
        const totalPages = response.pagination?.totalPages || response.lastPage || 1;
        setHasMore(pageNum < totalPages);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  // Load initial categories when opening
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      loadCategories(1, true);
    }
  }, [isOpen, categories.length, loadCategories]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isOpen || !observerTarget.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const nextPage = prev + 1;
            loadCategories(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [isOpen, hasMore, loading, loadCategories]);

  const handleValueChange = (val: string) => {
    if (val === 'none') {
      onValueChange(undefined);
    } else {
      onValueChange(parseInt(val));
    }
  };

  return (
    <Select
      value={value?.toString() || 'none'}
      onValueChange={handleValueChange}
      disabled={disabled}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedCategory ? selectedCategory.name : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value="none" className="text-gray-500 italic">
          ไม่ระบุหมวดหมู่
        </SelectItem>
        
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id.toString()}>
            <div className="flex flex-col">
              <span>{category.name}</span>
              {category.description && (
                <span className="text-xs text-gray-500">{category.description}</span>
              )}
            </div>
          </SelectItem>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-3 px-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">กำลังโหลด...</span>
          </div>
        )}

        {/* Intersection observer target */}
        {hasMore && !loading && (
          <div ref={observerTarget} className="h-2" />
        )}

        {/* No more items indicator */}
        {!hasMore && categories.length > 0 && (
          <div className="text-center py-2 px-2 text-xs text-gray-400">
            โหลดครบทั้งหมดแล้ว
          </div>
        )}

        {/* Empty state */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-3 px-2 text-sm text-gray-500">
            ไม่พบหมวดหมู่
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
