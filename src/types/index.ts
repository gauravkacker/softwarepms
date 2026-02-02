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
