"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
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
    cabinetId: string;
    departmentId: string;
    status: string;
  }) => void;
}

export default function FilterSection({ onSearch }: FilterSectionProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCabinets, setLoadingCabinets] = useState(false);

  // Form state (local)
  const [formFilters, setFormFilters] = useState({
    cabinetId: "",
    departmentId: "",
    status: "ALL",
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
      cabinetId: "",
      departmentId: "",
      status: "ALL",
    };
    setFormFilters(defaultFilters);
    onSearch(defaultFilters);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>ค้นหาและกรอง</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

          <div>
            <Label>สถานะ</Label>
            <Select
              value={formFilters.status}
              onValueChange={(value) => setFormFilters({ ...formFilters, status: value })}
            >
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="mt-2">
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
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
