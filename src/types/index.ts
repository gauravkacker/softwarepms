// ============================================
// Core Type Definitions for PMS
// Based on Module 1 Architecture Specification
// ============================================

// ============================================
// Clinical Domain Types - Updated for Module 3
// ============================================

// Patient Tag
export interface PatientTag {
  id: string;
  name: string;
  color: string; // e.g., '#ef4444' for red badge
  description?: string;
  isSystem: boolean; // System tags cannot be deleted
}

// Visit Mode
export type VisitMode = 'in-person' | 'video' | 'self-repeat';

// Visit Status
export type VisitStatus = 'completed' | 'cancelled' | 'no-show';

// Visit / Case Record
export interface Visit {
  id: string;
  patientId: string;
  registrationNumber: string;
  caseId?: string; // Linked case if any
  visitNumber: number; // Sequential visit count for patient
  visitDate: Date;
  visitTime: string; // HH:mm format
  doctorId: string;
  doctorName: string;
  mode: VisitMode;
  status: VisitStatus;
  chiefComplaint?: string;
  diagnosis?: string;
  prescriptionId?: string;
  feeId?: string;
  notes?: string;
  isSelfRepeat: boolean; // If patient came only for medicines
  createdAt: Date;
  updatedAt: Date;
}

// Investigation / Lab Report
export interface Investigation {
  id: string;
  patientId: string;
  visitId?: string;
  fileName: string;
  fileType: 'pdf' | 'jpg' | 'jpeg' | 'png' | 'webp';
  fileSize: number; // bytes
  fileUrl: string; // Blob URL or path
  title: string;
  description?: string;
  investigationDate: Date;
  uploadedBy: string;
  uploadedAt: Date;
}

// Voice Note
export interface VoiceNote {
  id: string;
  patientId: string;
  visitId?: string;
  fileName: string;
  fileUrl: string;
  duration: number; // seconds
  transcript?: string;
  language: string;
  recordedBy: string; // Patient or staff
  createdAt: Date;
}

// Fee Exemption
export interface FeeExemption {
  id: string;
  patientId: string;
  reason: string;
  exemptedBy: string;
  exemptedAt: Date;
  isActive: boolean;
}

// Prescription History Entry
export interface PrescriptionHistory {
  id: string;
  patientId: string;
  visitId: string;
  prescriptionId: string;
  prescriptionDate: Date;
  doctorId: string;
  doctorName: string;
  medicines: string[];
  diagnosis?: string;
  notes?: string;
}

// Fee History Entry
export interface FeeHistoryEntry {
  id: string;
  patientId: string;
  visitId?: string;
  receiptId: string;
  feeType: 'first-visit' | 'follow-up' | 'exempt' | 'consultation' | 'medicine';
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'cheque' | 'insurance' | 'exempt';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'refunded';
  paidDate: Date;
  daysSinceLastFee?: number;
}

// Patient Type - Module 3 Complete
export interface Patient {
  // Core Identity
  id: string;
  registrationNumber: string; // Unique, auto-generated, never reused
  
  // Name Fields
  firstName: string;
  lastName: string;
  fullName: string; // Computed: firstName + lastName
  
  // Demographics
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  age: number; // Computed from DOB
  gender: 'male' | 'female' | 'other';
  
  // Contact Details
  mobileNumber: string; // Primary contact
  alternateMobile?: string;
  email?: string;
  
  // Address
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  // Additional Info
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
  occupation?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  religion?: string;
  referredBy?: string; // Referral source
  
  // Profile Photo
  photoUrl?: string; // Blob URL or path
  photoThumbnail?: string;
  
  // Tags
  tags: string[]; // Array of tag IDs
  
  // Fee Exemption
  feeExempt: boolean;
  feeExemptionReason?: string;
  
  // Privacy Controls
  privacySettings: {
    hideMentalSymptoms: boolean; // From Frontdesk
    hideDiagnosis: boolean;
    hidePrognosis: boolean;
    hideFees: boolean; // From Pharmacy
    hideCaseNotes: boolean;
  };
  
  // Medical Info
  medicalHistory?: string[];
  allergies?: string[];
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Statistics (computed on demand)
  totalVisits?: number;
  lastVisitDate?: Date;
  lastFeeAmount?: number;
  lastFeeDate?: Date;
}

// Registration Number Settings
export interface RegNumberSettings {
  prefix: string; // e.g., 'DK-'
  startingNumber: number; // e.g., 1001
  padding: number; // e.g., 4 for 0001
  separator: string; // e.g., '-' or '/'
}

// Duplicate Patient Warning
export interface DuplicateWarning {
  patientId: string;
  matchedPatientId: string;
  matchedPatientName: string;
  matchedMobile: string;
  matchScore: number; // 0-100
  matchReasons: string[]; // ['Mobile number matches', 'Name similarity: 85%']
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Case {
  id: string;
  patientId: string;
  caseNumber: string;
  chiefComplaints: Symptom[];
  history: string;
  symptoms: Symptom[];
  diagnosis?: Diagnosis;
  prognosis?: string;
  prescriptionId?: string;
  status: 'active' | 'closed' | 'follow-up';
  createdAt: Date;
  updatedAt: Date;
}

export interface Symptom {
  id: string;
  name: string;
  location?: string;
  sensation?: string;
  modality?: string;
  intensity: 'mild' | 'moderate' | 'severe';
  duration?: string;
  notes?: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: 'primary' | 'secondary';
}

// Operational Domain Types
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  dateTime: Date;
  duration: number; // in minutes
  type: 'new' | 'follow-up' | 'consultation' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  reminderSent: boolean;
  createdAt: Date;
}

export interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  queueNumber: number;
  status: 'waiting' | 'in-consultation' | 'completed' | 'skipped';
  checkInTime: Date;
  estimatedWaitTime?: number;
  priority: 'normal' | 'priority' | 'emergency';
  notes?: string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  scientificName?: string;
  potency: string[];
  stock: number;
  unit: string;
  minStock: number;
  price: number;
  category: string;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffAction {
  id: string;
  staffId: string;
  action: string;
  module: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

// Financial Domain Types
export interface FeeStructure {
  id: string;
  name: string;
  type: 'consultation' | 'medicine' | 'procedure' | 'lab' | 'other';
  amount: number;
  discount?: number;
  validFrom: Date;
  validTo?: Date;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  patientId: string;
  patientName: string;
  items: ReceiptItem[];
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'cheque' | 'insurance';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'refunded';
  notes?: string;
  createdAt: Date;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Refund {
  id: string;
  receiptId: string;
  amount: number;
  reason: string;
  approvedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// Knowledge Domain Types
export interface MateriaMedica {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  description: string;
  symptoms: string[];
  modalities: string[];
  relationships: string[];
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepertoryEntry {
  id: string;
  remedy: string;
  symptom: string;
  grade: number; // 1-4 grading scale
  page?: string;
  source: string;
}

export interface DoctorNote {
  id: string;
  caseId: string;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Module Configuration Types
export interface ModuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  version: string;
  settings: Record<string, unknown>;
}

export interface AppSettings {
  clinicName: string;
  clinicAddress: Address;
  doctorName: string;
  doctorRegistrationNumber?: string;
  modules: ModuleConfig[];
  
  // Module 3: Registration Number Settings
  registrationNumber: {
    prefix: string;
    startingNumber: number;
    padding: number;
    separator: string;
  };
  
  generalSettings: {
    dateFormat: string;
    timeFormat: string;
    currency: string;
    language: string;
    theme: 'light' | 'dark';
  };
  backupSettings: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly';
    retentionDays: number;
  };
}

// ============================================
// Module 2: User Roles, Permissions & Login System
// ============================================

// Login Mode Types
export type LoginMode = 'none' | 'basic' | 'role';

// Permission Categories
export type PermissionCategory = 
  | 'clinical' 
  | 'operational' 
  | 'financial' 
  | 'pharmacy' 
  | 'system';

// Permission Action Types
export interface Permission {
  id: string;
  category: PermissionCategory;
  name: string;
  key: string; // e.g., 'view_case', 'edit_case', 'book_appointment'
  description: string;
  enabled: boolean;
}

// Role Definition
export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // System roles cannot be deleted
  permissions: Record<string, boolean>; // permissionKey -> boolean
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export type UserIdentifierType = 'email' | 'mobile' | 'username';

export interface User {
  id: string;
  username: string;
  identifierType: UserIdentifierType;
  identifier: string; // email, mobile, or username value
  password?: string; // Optional, hashed
  pin?: string; // Optional PIN for quick access
  roleId: string;
  isActive: boolean;
  isDoctor: boolean; // Only one doctor per system
  name: string;
  phone?: string;
  email?: string;
  profileImage?: string;
  lastLogin?: Date;
  lastActivity?: Date;
  deviceTokens?: string[]; // For multi-device support
  createdAt: Date;
  updatedAt: Date;
}

// Session Management
export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
}

// Activity Log
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: Record<string, unknown>;
  patientId?: string; // Optional, for patient-related actions
  ipAddress: string;
  timestamp: Date;
}

// Staff Message
export interface StaffMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  subject?: string;
  content: string;
  priority: 'normal' | 'urgent' | 'critical';
  readAt?: Date;
  createdAt: Date;
}

// Role Template
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  roleIds: string[];
  createdAt: Date;
}

// Emergency Mode
export interface EmergencyMode {
  enabled: boolean;
  enabledBy: string;
  enabledAt: Date;
  reason?: string;
  restrictionsDisabled: boolean;
}

// Frontdesk Override
export interface FrontdeskOverride {
  enabled: boolean;
  enabledBy: string;
  enabledAt: Date;
  expiresAt?: Date;
}

// Authentication State
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: Role | null;
  loginMode: LoginMode;
  sessionId: string | null;
  emergencyMode: boolean;
  frontdeskOverride: boolean;
}

// ============================================
// Module 3 END - Patient Master Database
// ============================================

// Utility Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  filters?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DatabaseConfig {
  type: 'sqlite' | 'indexeddb';
  path?: string;
  name: string;
  version: number;
}
