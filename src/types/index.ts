// User Types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',       // Displayed as "Supervisor" in UI
  VENDOR = 'VENDOR',
  STORE_KEEPER = 'STORE_KEEPER',
  ACCOUNTS = 'ACCOUNTS',
}

export enum VendorType {
  HARVESTING = 'HARVESTING',
  PACKING_MATERIAL = 'PACKING_MATERIAL',
  BOX_SUPPLIER = 'BOX_SUPPLIER',
  COLD_STORAGE = 'COLD_STORAGE',
  CHA = 'CHA',
  TRANSPORTER = 'TRANSPORTER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  vendorType?: VendorType;
  isActive: boolean;
  profileImageUrl?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  vendorType?: VendorType;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  UserApproval: undefined;
  UserManagement: undefined;
  CreateUser: undefined;
  CreateInspectionRequest: undefined;
  SubmitHarvest: { batch: any };
  HarvestReportDetails: { report: any };
  GatePass: undefined;
  CreateGatePass: { batch: any };
  GatePassDetails: { report: any };
  BatchLifecycle: { batch?: any };
  Inspections: { newPhoto?: string };
  Camera: undefined;
  ColdStorageInward: undefined;
  ColdStorageOutward: undefined;
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
  produceType?: string;
  status?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  latestVisitDate?: string;
}

export interface FarmRequest {
  farmerName: string;
  location: string;
  latitude: number;
  longitude: number;
  contactNumber?: string;
  totalArea?: number;
  areaUnit?: string;
  produceType?: string;
}

// Inspection Types
export enum InspectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
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
  proposedRate?: number;
  farmerProposedRate?: number;
  rateStatus?: 'PENDING' | 'ADMIN_COUNTERED' | 'FARMER_COUNTERED' | 'ACCEPTED';
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
  videoUrl?: string;
  expectedHarvestDate?: string;
  allocatedBoxes?: number;
  allocatedLiners?: number;
  allocatedCorners?: number;
  allocatedTape?: number;
  createdAt: string;
}

export interface FarmInspectionRequest {
  farmId: string;
  requestId?: string;
  proposedRate?: number;
  inspectionNotes?: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy?: number;
  farmerProposedRate?: number;
  photoUrls?: string[];
  videoUrl?: string;
}

export interface ApprovalRequest {
  approved: boolean;
  rejectionReason?: string;
  expectedHarvestDate?: string;
  allocatedBoxes?: number;
  allocatedLiners?: number;
  allocatedCorners?: number;
  allocatedTapeMeters?: number;
}

// Plot Selection Request (enhanced)
export interface PlotSelectionRequest {
  id: string;
  farmId: string;
  farmName?: string;
  farmLocation?: string;
  vendorId?: string;
  vendorName?: string;
  visitDate?: string;
  placeOfVisit?: string;
  visitorName?: string;
  visitorContact?: string;
  proposedRate?: number;
  notes?: string;
  status: string;
  createdAt: string;
  itemName?: string;
}

export interface CreatePlotSelectionRequest {
  farmId: string;
  vendorId: string;
  visitDate?: string;
  placeOfVisit?: string;
  visitorName?: string;
  visitorContact?: string;
  proposedRate?: number;
  notes?: string;
}

// Batch Types
export enum BatchStatus {
  CREATED = 'CREATED',
  HARVEST_IN_PROGRESS = 'HARVEST_IN_PROGRESS',
  HARVEST_COMPLETED = 'HARVEST_COMPLETED',
  DISPATCH_IN_PROGRESS = 'DISPATCH_IN_PROGRESS',
  DISPATCH_COMPLETED = 'DISPATCH_COMPLETED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface Batch {
  id: string;
  batchId: string;
  inspectionId?: string;
  farmId?: string;
  farmName?: string;
  farmLocation?: string;
  vendorId?: string;
  vendorName?: string;
  produceType?: string;
  status: BatchStatus;
  estimatedBoxes: number;
  actualBoxes: number;
  allocatedBoxes?: number;
  harvestedBoxes?: number;
  dispatchedBoxes?: number;
  remainingBoxes?: number;
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
export enum PackingWeightType {
  KG_13 = '13',
  KG_13_5 = '13.5',
  KG_7 = '7',
  KG_16 = '16',
}

export const PACKING_WEIGHT_OPTIONS = [
  { label: '13 kg (Dubai)', value: PackingWeightType.KG_13 },
  { label: '13.5 kg (Iran)', value: PackingWeightType.KG_13_5 },
  { label: '7 kg (Oman)', value: PackingWeightType.KG_7 },
  { label: '16 kg (Russia/Afghanistan)', value: PackingWeightType.KG_16 },
];

export interface DailyHarvestReport {
  id: string;
  batchId: string;
  batchIdCode: string;
  farmName?: string;
  reportDate: string;
  // Packing
  packingWeightType?: string;
  boxesPacked: number;
  // Damaged
  damagedBoxes?: number;
  damagedBoxPhotoUrls?: string[];
  // Wastage
  boxesWasted: number;
  wastageWeightKg?: number;
  wastagePhotoUrl?: string;
  // Transport
  vehicleNumber?: string;
  odometerStartKm?: number;
  odometerEndKm?: number;
  odometerStartPhotoUrl?: string;
  odometerEndPhotoUrl?: string;
  distanceKm?: number;
  ratePerKm?: number;
  transportCost?: number;
  // Toll
  tollAmount?: number;
  tollReceiptPhotoUrl?: string;
  weighBridgePhotoUrl?: string;
  // Labor
  laborCount: number;
  laborCost?: number;
  laborPaymentStatus?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyHarvestRequest {
  batchId: string;
  reportDate: string;
  // Packing
  packingWeightType?: string;
  boxesPacked: number;
  // Damaged
  damagedBoxes?: number;
  damagedBoxPhotoUrls?: string[];
  // Wastage
  boxesWasted: number;
  wastageWeightKg?: number;
  wastagePhotoUrl?: string;
  // Transport
  vehicleNumber?: string;
  odometerStartKm?: number;
  odometerEndKm?: number;
  odometerStartPhotoUrl?: string;
  odometerEndPhotoUrl?: string;
  ratePerKm?: number;
  // Toll
  tollAmount?: number;
  tollReceiptPhotoUrl?: string;
  weighBridgePhotoUrl?: string;
  // Labor
  laborCount: number;
  laborCost?: number;
  laborPaymentStatus?: string;
  notes?: string;
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

// Cold Storage Types
export enum HandType {
  HAND_4 = '4',
  HAND_5 = '5',
  HAND_6 = '6',
  HAND_8 = '8',
}

export interface ColdStorageInward {
  id: string;
  batchId: string;
  batchIdCode?: string;
  farmName?: string;
  vendorId?: string;
  vendorName?: string;
  packingWeightType?: string;
  boxes4Hand: number;
  boxes5Hand: number;
  boxes6Hand: number;
  boxes8Hand: number;
  totalBoxes: number;
  coldStorageName?: string;
  coldStorageLocation?: string;
  receiptPhotoUrl?: string;
  receiptTime?: string;
  inwardDate: string;
  createdAt: string;
}

export interface CreateColdStorageInwardRequest {
  batchId: string;
  packingWeightType?: string;
  boxes4Hand: number;
  boxes5Hand: number;
  boxes6Hand: number;
  boxes8Hand: number;
  coldStorageName?: string;
  coldStorageLocation?: string;
  receiptPhotoUrl?: string;
  inwardDate: string;
  notes?: string;
}

export interface ColdStorageOutward {
  id: string;
  containerNumber: string;
  destination?: string;
  packingWeightType?: string;
  boxes4Hand: number;
  boxes5Hand: number;
  boxes6Hand: number;
  boxes8Hand: number;
  totalBoxes: number;
  dispatchDate: string;
  createdAt: string;
}

export interface CreateColdStorageOutwardRequest {
  containerNumber: string;
  destination?: string;
  packingWeightType?: string;
  boxes4Hand: number;
  boxes5Hand: number;
  boxes6Hand: number;
  boxes8Hand: number;
  dispatchDate: string;
  notes?: string;
}

export const CONTAINER_CAPACITY = 1540;

export const EXPORT_DESTINATIONS = ['Dubai', 'Iran', 'Oman', 'Russia', 'Afghanistan', 'Other'];

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
