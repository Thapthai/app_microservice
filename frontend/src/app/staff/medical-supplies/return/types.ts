export interface Usage {
  id: number;
  en?: string;
  patient_hn?: string;
  first_name?: string;
  lastname?: string;
  department_code?: string;
  created_at?: string;
  data?: Usage;
}

export interface SupplyItem {
  id: number;
  order_item_code?: string;
  supply_code?: string;
  order_item_description?: string;
  supply_name?: string;
  qty?: number;
  qty_used_with_patient?: number;
  qty_returned_to_cabinet?: number;
}

export interface ReturnHistoryRecord {
  id: number;
  qty_returned: number;
  return_reason: string;
  return_datetime: string;
  return_note?: string;
  return_by_user_id?: string;
  return_by_user_name?: string;
  supply_item?: {
    order_item_code?: string;
    supply_code?: string;
    order_item_description?: string;
    supply_name?: string;
    usage?: {
      patient_hn?: string;
    };
  };
  item_stock?: {
    ItemCode?: string;
    RfidCode?: string;
    item?: { itemcode?: string; itemname?: string };
  };
}

export interface ReturnHistoryData {
  data: ReturnHistoryRecord[];
  total: number;
  page: number;
  limit: number;
}

export type ReturnReason = 'UNWRAPPED_UNUSED' | 'EXPIRED' | 'CONTAMINATED' | 'DAMAGED';
