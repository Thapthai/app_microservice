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
};
