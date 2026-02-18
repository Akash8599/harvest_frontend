// User Types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  VENDOR = 'VENDOR',
  STORE_KEEPER = 'STORE_KEEPER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  profileImageUrl?: string;
  createdAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  UserApproval: undefined;
  CreateInspectionRequest: undefined;
  SubmitHarvest: { batch: any };
  HarvestReportDetails: { report: any };
  GatePass: undefined;
  CreateGatePass: { batch: any };
  GatePassDetails: { report: any };
  BatchLifecycle: { batch?: any };
  Inspections: { newPhoto?: string };
  Camera: undefined;
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  profileImageUrl?: string;
  expiresIn: number;
  isActive?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Farm Types
export interface Farm {
  id: string;
  farmerName: string;
  location: string;
  latitude: number;
  longitude: number;
  contactNumber?: string;
  totalArea?: number;
  areaUnit: string;
  produceType?: string; // New field
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface FarmRequest {
  farmerName: string;
  location: string;
  latitude: number;
  longitude: number;
  contactNumber?: string;
  totalArea?: number;
  areaUnit?: string;
  produceType?: string; // New field
}

// Inspection Types
export enum InspectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  // Actionable statuses
  ASSIGNED = 'ASSIGNED',
  REQUESTED = 'REQUESTED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export interface FarmInspection {
  id: string;
  requestId?: string;
  farmId: string;
  farmName: string;
  itemName: string;
  farmLocation: string;
  vendorId: string;
  vendorName: string;
  estimatedBoxes: number;
  inspectionNotes?: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy?: number;
  status: InspectionStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  photoUrls: string[];
  createdAt: string;
}

export interface FarmInspectionRequest {
  farmId: string;
  requestId?: string;
  estimatedBoxes: number;
  inspectionNotes?: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy?: number;
  photoUrls?: string[];
}

export interface ApprovalRequest {
  approved: boolean;
  rejectionReason?: string;
}

// Batch Types
export enum BatchStatus {
  CREATED = 'CREATED',
  HARVEST_IN_PROGRESS = 'HARVEST_IN_PROGRESS',
  HARVEST_COMPLETED = 'HARVEST_COMPLETED',
  DISPATCH_IN_PROGRESS = 'DISPATCH_IN_PROGRESS',
  DISPATCH_COMPLETED = 'DISPATCH_COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Batch {
  id: string;
  batchId: string;
  inspectionId?: string;
  farmId?: string;
  farmName?: string;
  vendorId?: string;
  vendorName?: string;
  produceType?: string; // Derived from Farm
  status: BatchStatus;
  estimatedBoxes: number;
  actualBoxes: number;
  allocatedBoxes?: number;
  harvestedBoxes?: number;
  dispatchedBoxes?: number;
  remainingBoxes?: number; // Legacy, will be harvestRemaining
  harvestRemaining?: number;
  gatePassRemaining?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Inventory Types
export enum InventoryCategory {
  BOX = 'BOX',
  LINER = 'LINER',
  CORNER = 'CORNER',
  TAPE = 'TAPE',
  OTHER = 'OTHER',
}

export interface InventoryItem {
  id: string;
  itemName: string;
  itemCode: string;
  category: InventoryCategory;
  unitOfMeasure: string;
  unitCost: number;
  isActive: boolean;
  availableQuantity: number;
  createdAt: string;
}

export interface InventoryAllocationRequest {
  batchId: string;
  itemId: string;
  quantity: number;
  notes?: string;
}

// Harvest Types
export interface DailyHarvestReport {
  id: string;
  batchId: string;
  batchIdCode: string;
  farmName?: string;
  reportDate: string;
  boxesPacked: number;
  boxesWasted: number;
  laborCount: number;
  notes?: string;
  laborCost?: number;
  laborPaymentStatus?: string;
  createdAt: string;
}

export interface DailyHarvestRequest {
  batchId: string;
  reportDate: string;
  boxesPacked: number;
  boxesWasted: number;
  laborCount: number;
  notes?: string;
  laborCost?: number;
}

export enum TransportType {
  OUTWARD = 'OUTWARD',
  INWARD = 'INWARD',
}

export interface TransportCostRequest {
  batchId: string;
  costType: TransportType;
  vendorName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  totalCost: number;
  distanceKm?: number;
  notes?: string;
}

export interface GatePass {
  id: string;
  batchId: string;
  farmName?: string;
  gatePassNo: string;
  truckNumber: string;
  driverName: string;
  driverPhone?: string;
  totalBoxes: number;
  dispatchDate: string;
  receivedBoxes?: number;
  receivedAt?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface GatePassRequest {
  batchId: string;
  truckNumber: string;
  driverName: string;
  driverPhone?: string;
  totalBoxes: number;
  dispatchDate: string;
  notes?: string;
}

// Cost Types
export interface BatchCost {
  id: string;
  batchId: string;
  batchIdCode: string;
  materialCostTotal: number;
  materialCostPerBox: number;
  outwardTransportCost: number;
  outwardTransportPerBox: number;
  laborCostTotal: number;
  laborCostPerBox: number;
  inwardTransportCost: number;
  inwardTransportPerBox: number;
  totalCost: number;
  finalCostPerBox: number;
  calculatedAt?: string;
}

// Sales Types
export enum SaleType {
  DOMESTIC = 'DOMESTIC',
  EXPORT = 'EXPORT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export interface Sale {
  id: string;
  batchId: string;
  batchIdCode: string;
  invoiceNumber: string;
  buyerName: string;
  buyerContact?: string;
  buyerAddress?: string;
  saleType: SaleType;
  totalBoxes: number;
  pricePerBox: number;
  currency: string;
  exchangeRate: number;
  totalAmount: number;
  taxAmount: number;
  taxPercentage: number;
  grandTotal: number;
  invoiceUrl?: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  saleDate: string;
  createdAt: string;
}

export interface SaleRequest {
  batchId: string;
  buyerName: string;
  buyerContact?: string;
  buyerAddress?: string;
  saleType: SaleType;
  totalBoxes: number;
  pricePerBox: number;
  currency?: string;
  exchangeRate?: number;
  taxPercentage?: number;
  saleDate: string;
}

// Report Types
export interface DashboardStats {
  totalFarms: number;
  totalBatches: number;
  activeBatches: number;
  completedBatches: number;
  totalBoxesInStock: number;
  totalFilledBoxes: number;
  totalSales: number;
  totalRevenue: number;
  averageCostPerBox: number;
  averageSalePrice: number;
  totalProfit: number;
}

export interface VendorLedger {
  id: string;
  vendorId: string;
  vendorName: string;
  batchId?: string;
  batchIdCode?: string;
  transactionType: string;
  quantity?: number;
  amount?: number;
  balanceBoxes?: number;
  balanceAmount?: number;
  notes?: string;
  createdAt: string;
}

export interface VendorBalance {
  vendorId: string;
  boxesIssued: number;
  boxesReturned: number;
  boxesPending: number;
  pendingLaborCost: number;
}

export interface ProfitabilityReport {
  batchId: string;
  batchIdCode: string;
  farmName: string;
  totalBoxes: number;
  costPerBox: number;
  salePricePerBox: number;
  totalCost: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  saleDate: string;
  buyerName: string;
}

export interface FarmActivity {
  farmName: string;
  batchId: string;
  boxesPacked: number;
  laborCount: number;
}

export interface DailyActivityReport {
  date: string;
  totalBoxesPacked: number;
  totalFarmsHarvested: number;
  farmActivities: FarmActivity[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
  errorCode?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}
