"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw, Filter } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { cabinetApi, departmentApi } from "@/lib/api";

interface Department {
  ID: number;
  DepName?: string;
  DepName2?: string;
}

interface Cabinet {
  id: number;
  cabinet_name?: string;
  cabinet_code?: string;
}

interface FilterSectionProps {
  onSearch: (filters: {
    searchTerm: string;
    departmentId: string;
    cabinetId: string;
    statusFilter: string;
  }) => void;
}

export default function FilterSection({ onSearch }: FilterSectionProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCabinets, setLoadingCabinets] = useState(false);

  // Form state (local)
  const [formFilters, setFormFilters] = useState({
    searchTerm: "",
    departmentId: "",
    cabinetId: "",
    statusFilter: "all",
  });

  // Load departments with search
  const loadDepartments = async (keyword?: string) => {
    try {
      setLoadingDepartments(true);
      const response = await departmentApi.getAll({ limit: 50, keyword });
      if (response.success && response.data) {
        setDepartments(response.data as Department[]);
      }
    } catch (error) {
      console.error("Failed to load departments:", error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Load cabinets with search
  const loadCabinets = async (keyword?: string) => {
    try {
      setLoadingCabinets(true);
      const response = await cabinetApi.getAll({ page: 1, limit: 50, keyword });
      if (response.success && response.data) {
        setCabinets(response.data as Cabinet[]);
      }
    } catch (error) {
      console.error("Failed to load cabinets:", error);
    } finally {
      setLoadingCabinets(false);
    }
  };

  const handleSearch = () => {
    onSearch(formFilters);
  };

  const handleReset = () => {
    const defaultFilters = {
      searchTerm: "",
      departmentId: "",
      cabinetId: "",
      statusFilter: "all",
    };
    setFormFilters(defaultFilters);
    onSearch(defaultFilters);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <CardTitle>ค้นหาและกรอง</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>ค้นหาชื่อหรือรหัสอุปกรณ์</Label>
            <Input
              placeholder="ค้นหา..."
              value={formFilters.searchTerm}
              onChange={(e) => setFormFilters({ ...formFilters, searchTerm: e.target.value })}
              className="mt-2"
            />
          </div>

          <SearchableSelect
            label="แผนก"
            placeholder="ทั้งหมด"
            value={formFilters.departmentId}
            onValueChange={(value) => setFormFilters({ ...formFilters, departmentId: value })}
            options={[
              { value: "", label: "ทั้งหมด" },
              ...departments.map((dept) => ({
                value: dept.ID.toString(),
                label: dept.DepName || "",
                subLabel: dept.DepName2 || "",
              })),
            ]}
            loading={loadingDepartments}
            onSearch={loadDepartments}
            searchPlaceholder="ค้นหาชื่อแผนก..."
          />

          <SearchableSelect
            label="ตู้ Cabinet"
            placeholder="ทั้งหมด"
            value={formFilters.cabinetId}
            onValueChange={(value) => setFormFilters({ ...formFilters, cabinetId: value })}
            options={[
              { value: "", label: "ทั้งหมด" },
              ...cabinets.map((cabinet) => ({
                value: cabinet.id.toString(),
                label: cabinet.cabinet_name || "",
                subLabel: cabinet.cabinet_code || "",
              })),
            ]}
            loading={loadingCabinets}
            onSearch={loadCabinets}
            searchPlaceholder="ค้นหารหัสหรือชื่อตู้..."
          />

          <div>
            <Label>สถานะ</Label>
            <Select
              value={formFilters.statusFilter}
              onValueChange={(value) => setFormFilters({ ...formFilters, statusFilter: value })}
            >
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleSearch} className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            ค้นหา
          </Button>
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            รีเซ็ต
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
