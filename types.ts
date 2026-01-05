
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum RequestStatus {
  SUBMITTED = 'SUBMITTED',     // 待受理
  ACCEPTED = 'ACCEPTED',       // 已受理
  INFO_NEEDED = 'INFO_NEEDED', // 待补充信息
  BOOKING = 'BOOKING',         // 预定中
  SUCCESS = 'SUCCESS',         // 预定成功
  FAILED = 'FAILED',           // 预定失败
  CANCELLED = 'CANCELLED',     // 已取消
  CLOSED = 'CLOSED'            // 已关闭
}

export const StatusTranslation: Record<RequestStatus, string> = {
  [RequestStatus.SUBMITTED]: '待受理',
  [RequestStatus.ACCEPTED]: '已受理',
  [RequestStatus.INFO_NEEDED]: '待补充信息',
  [RequestStatus.BOOKING]: '预定中',
  [RequestStatus.SUCCESS]: '预定成功',
  [RequestStatus.FAILED]: '预定失败',
  [RequestStatus.CANCELLED]: '已取消',
  [RequestStatus.CLOSED]: '已关闭'
};

export enum RequestType {
  FLIGHT = 'FLIGHT',
  HOTEL = 'HOTEL',
  CAR_RENTAL = 'CAR_RENTAL',
  CHARTER = 'CHARTER',
  OTHER = 'OTHER'
}

export const TypeTranslation: Record<RequestType, string> = {
  [RequestType.FLIGHT]: '机票',
  [RequestType.HOTEL]: '酒店',
  [RequestType.CAR_RENTAL]: '租车',
  [RequestType.CHARTER]: '包车',
  [RequestType.OTHER]: '其他/自由需求'
};

export enum Urgency {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT'
}

export const UrgencyTranslation: Record<Urgency, string> = {
  [Urgency.NORMAL]: '普通',
  [Urgency.URGENT]: '加急'
};

// Profile Types
export interface IdentityDocument {
  type: string; // 身份证, 护照, etc.
  number: string;
  expiryDate?: string;
}

export interface Traveler {
  name: string;
  idType: string;
  idNumber: string;
  idExpiryDate?: string;
  phone: string;
}

export interface UserProfile {
  chineseName: string;
  englishName?: string;
  nationality?: string;
  gender?: '男' | '女';
  birthday?: string;
  birthPlace?: string;
  phone?: string;
  email?: string;
  documents: IdentityDocument[];
  contacts: Traveler[]; // 常用联系人
}

// Base Interface for all requests
export interface BaseRequestData {
  purpose: string;
  urgency: Urgency;
  budgetCap?: number;
  currency?: string;
  costCenter?: string; // e.g., Department, Project
  notes?: string;
  travelers: Traveler[];
}

// Scenario Specific Data
export interface FlightRequestData extends BaseRequestData {
  tripType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  returnDate?: string;
  preferredTime?: string;
  cabinClass: 'ECONOMY' | 'BUSINESS' | 'FIRST';
  airlinePreference?: string;
  flightNumber?: string; // Added field
}

export interface HotelRequestData extends BaseRequestData {
  city: string;
  checkInDate: string;
  checkOutDate: string;
  roomCount: number;
  guestCount: number;
  roomType: string;
  starRating?: string;
  locationPreference?: string;
}

export interface CarRentalRequestData extends BaseRequestData {
  pickupCity: string;
  pickupDate: string;
  returnDate: string;
  carType: string; // SUV, Sedan
  drivingLicense: string;
}

export interface CharterRequestData extends BaseRequestData {
  city: string;
  usageDate: string;
  startTime: string;
  endTime: string;
  passengerCount: number;
  routeDescription: string;
  carType: string; // 7-seater, Bus
}

export interface OtherRequestData extends BaseRequestData {
  description: string; // 自由文本描述
  requirements?: string;
}

// Union Type for Request Details
export type RequestDetails = FlightRequestData | HotelRequestData | CarRentalRequestData | CharterRequestData | OtherRequestData;

export interface Comment {
  id: string;
  author: string;
  role: Role;
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface TravelRequest {
  id: string;
  userId: string; // Creator
  userName: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  data: RequestDetails;

  // Admin fields
  assignedTo?: string; // Admin ID
  bookingResult?: {
    platform?: string;
    orderId?: string;
    price?: number;
    currency?: string;
    files?: string[]; // URLs to attachments
    failureReason?: string;
  };

  comments: Comment[];
  history: AuditLog[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

// --- Reimbursement Types ---

export enum ReimbursementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ReimbursementCategory {
  MEALS = 'MEALS',
  TRANSPORT = 'TRANSPORT',
  ACCOMMODATION = 'ACCOMMODATION',
  OTHER = 'OTHER'
}

export const ReimbursementCategoryTranslation: Record<ReimbursementCategory, string> = {
  [ReimbursementCategory.MEALS]: '餐饮',
  [ReimbursementCategory.TRANSPORT]: '交通',
  [ReimbursementCategory.ACCOMMODATION]: '住宿',
  [ReimbursementCategory.OTHER]: '其他'
};

export interface Reimbursement {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  category: ReimbursementCategory;
  description: string;
  date: string;
  attachments: string[]; // Base64 or URLs
  status: ReimbursementStatus;
  createdAt: string;
  approvedBy?: string;
  rejectionReason?: string;
}
