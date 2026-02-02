// ============================================
// Core Type Definitions for PMS
// Based on Module 1 Architecture Specification
// ============================================

// Clinical Domain Types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  contactPhone: string;
  contactEmail?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: Date;
  updatedAt: Date;
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
// Module 2 END
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
