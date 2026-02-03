"use client";

import { useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ChevronDown, ChevronRight, Loader2, Package } from "lucide-react";
import { cabinetDepartmentApi } from "@/lib/api";
import { toast } from "sonner";
import CabinetDetailsCard from "./CabinetDetailsCard";

interface CabinetDepartment {
  id: number;
  cabinet_id: number;
  department_id: number;
  status: string;
  description?: string;
  itemstock_count?: number;
  cabinet?: {
    id: number;
    cabinet_name?: string;
    cabinet_code?: string;
  };
  department?: {
    ID: number;
    DepName?: string;
  };
}

interface ItemCount {
  itemcode: string;
  itemname: string;
  total_qty: number;
  count_rows: number;
}

interface MappingTableProps {
  mappings: CabinetDepartment[];
  onEdit: (mapping: CabinetDepartment) => void;
  onDelete: (mapping: CabinetDepartment) => void;
}

export default function MappingTable({ mappings, onEdit, onDelete }: MappingTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<CabinetDepartment | null>(null);
  const [expandedDropdown, setExpandedDropdown] = useState<number | null>(null);
  const [itemCounts, setItemCounts] = useState<{ [key: number]: ItemCount[] }>({});
  const [loadingItemStock, setLoadingItemStock] = useState<number | null>(null);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil(mappings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMappings = mappings.slice(startIndex, endIndex);

  const handleDropdownToggle = async (e: React.MouseEvent, mapping: CabinetDepartment) => {
    e.stopPropagation();
    const cabinetId = mapping.cabinet_id;

    // Toggle dropdown
    if (expandedDropdown === mapping.id) {
      setExpandedDropdown(null);
      return;
    }

    setExpandedDropdown(mapping.id);

    // If already loaded, don't fetch again
    if (itemCounts[cabinetId]) {
      return;
    }

    // Fetch item counts
    try {
      setLoadingItemStock(cabinetId);
      const response = await cabinetDepartmentApi.getItemStocksByCabinet(cabinetId, {
        page: 1,
        limit: 1, // Only need item_counts, not the full data list
      });

      if (response.success && (response as any).item_counts) {
        setItemCounts(prev => ({ ...prev, [cabinetId]: (response as any).item_counts }));
      } else {
        toast.error("ไม่สามารถโหลดข้อมูลสรุปอุปกรณ์ได้");
      }
    } catch (error: any) {
      console.error("Error loading item counts:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoadingItemStock(null);
    }
  };

  const handleRowClick = (mapping: CabinetDepartment) => {
    setSelectedRow(mapping);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>รายการเชื่อมโยง ({mappings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>รหัสตู้</TableHead>
                  <TableHead>ชื่อตู้</TableHead>      
                  <TableHead>แผนก</TableHead>
                  <TableHead className="text-center">จำนวนอุปกรณ์</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMappings.map((mapping, index) => (
                    <Fragment key={`mapping-${mapping.id}-${startIndex + index}`}>
                      <TableRow
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedRow?.id === mapping.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleRowClick(mapping)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDropdownToggle(e, mapping)}
                            className="hover:bg-gray-200 p-1 rounded"
                          >
                            {expandedDropdown === mapping.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell>{mapping.cabinet?.cabinet_code || "-"}</TableCell>
                        <TableCell>{mapping.cabinet?.cabinet_name || "-"}</TableCell>
                        <TableCell>{mapping.department?.DepName || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-600">
                              {mapping.itemstock_count !== undefined ? mapping.itemstock_count : 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={mapping.status === "ACTIVE" ? "default" : "secondary"}>
                            {mapping.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {mapping.description || "-"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => onEdit(mapping)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(mapping)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Dropdown - Item Counts Summary */}
                      {expandedDropdown === mapping.id && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-gray-50 p-4" >
                            {loadingItemStock === mapping.cabinet_id ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
                              </div>
                            ) : itemCounts[mapping.cabinet_id]?.length > 0 ? (
                              <div>
                                <h4 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  สรุปจำนวนอุปกรณ์ในตู้ ({itemCounts[mapping.cabinet_id].length} ชนิด)
                                </h4>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">ลำดับ</TableHead>
                                        <TableHead>รหัสอุปกรณ์</TableHead>
                                        <TableHead>ชื่ออุปกรณ์</TableHead>
                                        <TableHead className="text-center">จำนวน (ชิ้น)</TableHead>
                                        <TableHead className="text-center">จำนวนรายการ</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {itemCounts[mapping.cabinet_id].map((itemCount, index) => (
                                        <TableRow key={`mapping-${mapping.id}-count-${index}-${itemCount.itemcode ?? ""}`}>
                                          <TableCell className="font-medium">{index + 1}</TableCell>
                                          <TableCell className="font-semibold">{itemCount.itemcode}</TableCell>
                                          <TableCell>{itemCount.itemname}</TableCell>
                                          <TableCell className="text-center">
                                            <span className="font-bold text-blue-600 text-lg">
                                              {itemCount.total_qty}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-center text-gray-500">
                                            {itemCount.count_rows}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                ไม่พบอุปกรณ์ในตู้นี้
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                แสดง {startIndex + 1}-{Math.min(endIndex, mappings.length)} จาก {mappings.length} รายการ
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page, paginationIndex) => (
                    <Button
                      key={`pagination-${paginationIndex}-${page}`}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Row Details Card */}
      {selectedRow && (
        <CabinetDetailsCard 
          selectedRow={selectedRow} 
          onClose={() => setSelectedRow(null)} 
        />
      )}
    </>
  );
}
