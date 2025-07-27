import { apiRequest } from "./queryClient";

export interface Statistics {
  totalClients: number;
  pendingInvoices: number;
  sentThisMonth: number;
  failedDeliveries: number;
}

export interface BatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export const api = {
  // Client operations
  getClients: () => 
    apiRequest("GET", "/api/clients").then(res => res.json()),
  
  createClient: (data: any) =>
    apiRequest("POST", "/api/clients", data).then(res => res.json()),
    
  updateClient: (id: string, data: any) =>
    apiRequest("PUT", `/api/clients/${id}`, data).then(res => res.json()),
    
  deleteClient: (id: string) =>
    apiRequest("DELETE", `/api/clients/${id}`),

  // Invoice operations
  getInvoices: (params?: { status?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const url = `/api/invoices${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest("GET", url).then(res => res.json());
  },
  
  createInvoice: (data: any) =>
    apiRequest("POST", "/api/invoices", data).then(res => res.json()),
    
  sendInvoice: (id: string) =>
    apiRequest("POST", `/api/invoices/${id}/send`).then(res => res.json()),
    
  runBatchProcess: (): Promise<BatchResult> =>
    apiRequest("POST", "/api/invoices/batch").then(res => res.json()),

  // Template operations
  getTemplates: () =>
    apiRequest("GET", "/api/templates").then(res => res.json()),
    
  createTemplate: (data: any) =>
    apiRequest("POST", "/api/templates", data).then(res => res.json()),
    
  activateTemplate: (id: string) =>
    apiRequest("POST", `/api/templates/${id}/activate`).then(res => res.json()),

  // Logs
  getLogs: (params?: { limit?: number; invoiceId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.invoiceId) searchParams.append('invoiceId', params.invoiceId);
    
    const url = `/api/logs${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest("GET", url).then(res => res.json());
  },

  // Statistics
  getStatistics: (): Promise<Statistics> =>
    apiRequest("GET", "/api/statistics").then(res => res.json()),
};
