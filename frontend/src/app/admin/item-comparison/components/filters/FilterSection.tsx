import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import type { FilterState } from '../../types';

interface FilterSectionProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onSearch: (keyword?: string) => void;
  onClear: () => void;
  onRefresh: () => void;
  itemTypes: Array<{ id: string; name: string }>;
  loading: boolean;
  items?: unknown[];
}

export function FilterSection({
  filters,
  onFilterChange,
  onSearch,
  onClear,
  onRefresh,
  itemTypes: _itemTypes,
  loading,
  items: _items = [],
}: FilterSectionProps) {
  const [searchInput, setSearchInput] = useState('');

  const submitSearch = () => {
    const keyword = searchInput.trim();
    onFilterChange('searchItemCode', keyword);
    if (keyword) {
      onSearch(keyword);
    } else {
      onSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>กรองข้อมูล</CardTitle>
        <CardDescription>ค้นหาและกรองรายการเปรียบเทียบ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Search - Full Width */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">รหัส/ชื่อเวชภัณฑ์</label>
          <Input
            placeholder="ค้นหารหัสหรือชื่อเวชภัณฑ์..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitSearch();
              }
            }}
          />
        </div>

        {/* Row 2: Single Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">วันที่</label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              const selectedDate = e.target.value;
              // Set both startDate and endDate to the same value
              onFilterChange('startDate', selectedDate);
              onFilterChange('endDate', selectedDate);
            }}
          />
        </div>

        {/* Row 3: Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              submitSearch();
            }}
            disabled={loading}
          >
            <Search className="h-4 w-4 mr-2" />
            ค้นหา
          </Button>
          <Button
            onClick={() => {
              setSearchInput('');
              onClear();
            }}
            variant="outline"
          >
            ล้าง
          </Button>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
