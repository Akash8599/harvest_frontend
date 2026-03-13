import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants';
import { LoginRequest, LoginResponse, ApiResponse, RefreshTokenRequest, CreateUserRequest } from '../types';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', {
            refreshToken,
          } as RefreshTokenRequest);

          if (response.data.success && response.data.data) {
            useAuthStore.getState().setAuth(response.data.data);
            const newToken = response.data.data.token;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', data),

  getCurrentUser: () =>
    apiClient.get<ApiResponse<any>>('/auth/me'),

  getAllUsers: () =>
    apiClient.get<ApiResponse<any[]>>('/auth/users'),

  getUsersByRole: (role: string) =>
    apiClient.get<ApiResponse<any[]>>(`/auth/users/role/${role}`),

  approveUser: (userId: string) =>
    apiClient.post<ApiResponse<void>>(`/auth/approve/${userId}`),

  // Admin creates users (no self-registration)
  createUser: (data: CreateUserRequest) =>
    apiClient.post<ApiResponse<any>>('/auth/admin/create-user', data),

  updateUser: (userId: string, data: Partial<CreateUserRequest>) =>
    apiClient.put<ApiResponse<any>>(`/auth/users/${userId}`, data),

  deactivateUser: (userId: string) =>
    apiClient.post<ApiResponse<void>>(`/auth/users/${userId}/deactivate`),

  activateUser: (userId: string) =>
    apiClient.post<ApiResponse<void>>(`/auth/users/${userId}/activate`),
};

// Farm API
export const farmApi = {
  createFarm: (data: any) =>
    apiClient.post<ApiResponse<any>>('/farms', data),

  getAllFarms: () =>
    apiClient.get<ApiResponse<any[]>>('/farms'),

  getFarmById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/farms/${id}`),

  createInspection: (data: any) =>
    apiClient.post<ApiResponse<any>>('/inspections', data),

  getPendingInspections: () =>
    apiClient.get<ApiResponse<any[]>>('/inspections/pending'),

  getMyInspections: () =>
    apiClient.get<ApiResponse<any[]>>('/inspections/my'),

  getAllInspections: () =>
    apiClient.get<ApiResponse<any[]>>('/inspections'),

  approveInspection: (id: string, data: any) =>
    apiClient.post<ApiResponse<any>>(`/inspections/${id}/approve`, data),

  getInspectionById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/inspections/${id}`),

  getAllBatches: () =>
    apiClient.get<ApiResponse<any[]>>('/batches'),

  getBatchById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/batches/${id}`),

  updateBatchStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<any>>(`/batches/${id}/status`, { status }),

  // Plot Selection Requests (enhanced)
  createInspectionRequest: (data: any) =>
    apiClient.post<ApiResponse<any>>('/inspections/requests', data),

  getMyInspectionRequests: (status?: string) =>
    apiClient.get<ApiResponse<any[]>>('/inspections/requests/my', {
      params: { status },
    }),

  getAllInspectionRequests: (status?: string) =>
    apiClient.get<ApiResponse<any[]>>('/inspections/requests', {
      params: { status },
    }),

  cancelInspectionRequest: (id: string) =>
    apiClient.patch<ApiResponse<any>>(`/inspections/requests/${id}/cancel`),
};

// Inventory API
export const inventoryApi = {
  getAllItems: () =>
    apiClient.get<ApiResponse<any[]>>('/inventory/items'),

  getItemById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/inventory/items/${id}`),

  createItem: (data: any) =>
    apiClient.post<ApiResponse<any>>('/inventory/items', data),

  addStock: (id: string, quantity: number) =>
    apiClient.post<ApiResponse<void>>(`/inventory/items/${id}/stock`, null, {
      params: { quantity },
    }),

  getAvailableStock: (id: string) =>
    apiClient.get<ApiResponse<number>>(`/inventory/items/${id}/stock`),

  allocateInventory: (data: any) =>
    apiClient.post<ApiResponse<void>>('/inventory/allocate', data),
};

// Harvest API
export const harvestApi = {
  createDailyReport: (data: any) =>
    apiClient.post<ApiResponse<any>>('/harvest/daily', data),

  getBatchReports: (batchId: string) =>
    apiClient.get<ApiResponse<any[]>>(`/harvest/batch/${batchId}`),

  getTodayReports: () =>
    apiClient.get<ApiResponse<any[]>>('/harvest/today'),

  getReportsByDate: (date: string) =>
    apiClient.get<ApiResponse<any[]>>('/harvest/reports', {
      params: { date },
    }),

  addTransportCost: (data: any) =>
    apiClient.post<ApiResponse<void>>('/transport', data),

  createGatePass: (data: any) =>
    apiClient.post<ApiResponse<any>>('/gate-passes', data),

  receiveGatePass: (id: string, receivedBoxes: number) =>
    apiClient.post<ApiResponse<any>>(`/gate-passes/${id}/receive`, null, {
      params: { receivedBoxes },
    }),

  getBatchGatePasses: (batchId: string) =>
    apiClient.get<ApiResponse<any[]>>(`/gate-passes/batch/${batchId}`),

  getPendingGatePasses: () =>
    apiClient.get<ApiResponse<any[]>>('/gate-passes/pending'),

  getTodayGatePasses: () =>
    apiClient.get<ApiResponse<any[]>>('/gate-passes/today'),

  getGatePassesByDate: (date: string) =>
    apiClient.get<ApiResponse<any[]>>('/gate-passes/reports', {
      params: { date },
    }),
};

// Cold Storage API
export const coldStorageApi = {
  // Inward
  createInward: (data: any) =>
    apiClient.post<ApiResponse<any>>('/cold-storage/inward', data),

  getAllInwards: () =>
    apiClient.get<ApiResponse<any[]>>('/cold-storage/inward'),

  getInwardsByBatch: (batchId: string) =>
    apiClient.get<ApiResponse<any[]>>(`/cold-storage/inward/batch/${batchId}`),

  // Outward (Container Loading)
  createOutward: (data: any) =>
    apiClient.post<ApiResponse<any>>('/cold-storage/outward', data),

  getAllOutwards: () =>
    apiClient.get<ApiResponse<any[]>>('/cold-storage/outward'),

  // Inventory summary (what's currently in cold storage)
  getInventorySummary: () =>
    apiClient.get<ApiResponse<any>>('/cold-storage/inventory'),
};

// Cost API
export const costApi = {
  getBatchCost: (batchId: string) =>
    apiClient.get<ApiResponse<any>>(`/costs/batch/${batchId}`),

  getCostByBatchCode: (batchId: string) =>
    apiClient.get<ApiResponse<any>>(`/costs/batch/code/${batchId}`),

  getAllBatchCosts: () =>
    apiClient.get<ApiResponse<any[]>>('/costs'),
};

// Sales API
export const salesApi = {
  createSale: (data: any) =>
    apiClient.post<ApiResponse<any>>('/sales', data),

  getAllSales: () =>
    apiClient.get<ApiResponse<any[]>>('/sales'),

  getSaleById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/sales/${id}`),

  getSaleByInvoiceNumber: (invoiceNumber: string) =>
    apiClient.get<ApiResponse<any>>(`/sales/invoice/${invoiceNumber}`),

  getBatchSales: (batchId: string) =>
    apiClient.get<ApiResponse<any[]>>(`/sales/batch/${batchId}`),

  updatePaymentStatus: (id: string, status: string, amount?: number) =>
    apiClient.put<ApiResponse<void>>(`/sales/${id}/payment`, null, {
      params: { status, amount },
    }),

  downloadInvoicePdf: (id: string) =>
    apiClient.get(`/sales/${id}/invoice/pdf`, {
      responseType: 'blob',
    }),

  shareInvoiceViaWhatsApp: (id: string, phoneNumber: string) =>
    apiClient.post<ApiResponse<void>>(`/sales/${id}/invoice/share/whatsapp`, null, {
      params: { phoneNumber },
    }),

  shareInvoiceViaEmail: (id: string, email: string) =>
    apiClient.post<ApiResponse<void>>(`/sales/${id}/invoice/share/email`, null, {
      params: { email },
    }),

  getWhatsAppShareLink: (id: string, phoneNumber: string) =>
    apiClient.get<ApiResponse<string>>(`/sales/${id}/invoice/share/whatsapp-link`, {
      params: { phoneNumber },
    }),
};

// Report API
export const reportApi = {
  getDashboardStats: () =>
    apiClient.get<ApiResponse<any>>('/reports/dashboard'),

  getVendorLedger: (vendorId: string) =>
    apiClient.get<ApiResponse<any>>(`/reports/vendor-ledger/${vendorId}`),

  getVendorBalance: (vendorId: string) =>
    apiClient.get<ApiResponse<any>>(`/reports/vendor-balance/${vendorId}`),

  getProfitabilityReport: () =>
    apiClient.get<ApiResponse<any[]>>('/reports/profitability'),

  getDailyActivityReport: () =>
    apiClient.get<ApiResponse<any>>('/reports/daily-activity'),

  getMyLedger: () =>
    apiClient.get<ApiResponse<any[]>>('/reports/my-ledger'),

  getMyBalance: () =>
    apiClient.get<ApiResponse<any>>('/reports/my-balance'),
};

// Photo Upload API
export const uploadApi = {
  uploadPhoto: (file: FormData, inspectionId?: string) =>
    apiClient.post<ApiResponse<string>>('/upload/photo', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: inspectionId ? { inspectionId } : undefined,
    }),

  uploadMultiplePhotos: (files: FormData, inspectionId?: string) =>
    apiClient.post<ApiResponse<string[]>>('/upload/photos', files, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: inspectionId ? { inspectionId } : undefined,
    }),

  uploadVideo: (file: FormData, inspectionId?: string) =>
    apiClient.post<ApiResponse<string>>('/upload/video', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: inspectionId ? { inspectionId } : undefined,
    }),

  deleteFile: (fileUrl: string) =>
    apiClient.delete<ApiResponse<void>>('/upload/file', {
      params: { fileUrl },
    }),
};

export default apiClient;
