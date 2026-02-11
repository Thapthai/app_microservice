import staffApi from './index';

export const staffReportApi = {
    exportEquipmentDisbursementExcel: async (params?: {
        dateFrom?: string;
        dateTo?: string;
        hospital?: string;
        department?: string;
    }): Promise<Blob> => {
        const queryParams = new URLSearchParams();
        if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
        if (params?.hospital) queryParams.append('hospital', params.hospital);
        if (params?.department) queryParams.append('department', params.department);

        const response = await staffApi.get(`/reports/equipment-disbursement/excel?${queryParams.toString()}`, {
            responseType: 'blob',
        });
        return response.data;
    },

      exportEquipmentDisbursementPDF: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.hospital) queryParams.append('hospital', params.hospital);
    if (params?.department) queryParams.append('department', params.department);

    const response = await staffApi.get(`/reports/equipment-disbursement/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadCabinetStockExcel: async (params?: { cabinetId?: number; cabinetCode?: string; departmentId?: number }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.cabinetId != null) queryParams.append('cabinetId', params.cabinetId.toString());
    if (params?.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params?.departmentId != null) queryParams.append('departmentId', params.departmentId.toString());
    const response = await staffApi.get(`/reports/cabinet-stock/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cabinet_stock_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadCabinetStockPdf: async (params?: { cabinetId?: number; cabinetCode?: string; departmentId?: number }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.cabinetId != null) queryParams.append('cabinetId', params.cabinetId.toString());
    if (params?.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params?.departmentId != null) queryParams.append('departmentId', params.departmentId.toString());
    const response = await staffApi.get(`/reports/cabinet-stock/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cabinet_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
