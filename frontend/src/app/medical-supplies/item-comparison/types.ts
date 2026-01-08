export interface ComparisonItem {
  itemcode: string;
  itemname: string;
  itemTypeId: number;
  itemTypeName: string;
  total_dispensed: number;
  total_used: number;
  difference: number;
  status: string;
}

export interface UsageItem {
  usage_id: number;
  patient_hn: string;
  patient_name: string;
  patient_en?: string;
  department_code?: string;
  usage_datetime: string;
  itemcode: string;
  itemname: string;
  qty_used: number;
  qty_returned?: number;
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  searchItemCode: string;
  startDate: string;
  endDate: string;
  itemTypeFilter: string;
}

export interface SummaryData {
  total: number;
  matched: number;
  notMatched: number;
}
