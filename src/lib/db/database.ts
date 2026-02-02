// ============================================
// Local Database Infrastructure
// Offline-first data layer based on Module 1
// Includes Module 2: User Roles, Permissions & Login System
// ============================================

import type { DatabaseConfig } from '@/types';

// Database configuration
const dbConfig: DatabaseConfig = {
  type: 'sqlite',
  name: 'pms_database',
  version: 2, // Incremented for Module 2
};

// In-memory storage for demo (will be replaced with SQLite in production)
class LocalDatabase {
  private static instance: LocalDatabase;
  private store: Map<string, unknown[]>;

  private constructor() {
    this.store = new Map();
    this.initializeStores();
  }

  public static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  private initializeStores(): void {
    // Clinical Domain
    this.store.set('patients', []);
    this.store.set('cases', []);
    this.store.set('symptoms', []);
    this.store.set('diagnoses', []);

    // Operational Domain
    this.store.set('appointments', []);
    this.store.set('queue', []);
    this.store.set('pharmacy', []);
    this.store.set('staffActions', []);

    // Financial Domain
    this.store.set('fees', []);
    this.store.set('receipts', []);
    this.store.set('refunds', []);

    // Knowledge Domain
    this.store.set('materiaMedica', []);
    this.store.set('repertory', []);
    this.store.set('doctorNotes', []);

    // Module 2: User Roles & Permissions
    this.store.set('users', []);
    this.store.set('roles', []);
    this.store.set('permissions', []);
    this.store.set('sessions', []);
    this.store.set('activityLogs', []);
    this.store.set('staffMessages', []);
    this.store.set('roleTemplates', []);

    // System
    this.store.set('settings', []);
    this.store.set('auditLog', []);
  }

  // Generic CRUD operations
  public getAll<T>(collection: string): T[] {
    return (this.store.get(collection) as T[]) || [];
  }

  public getById<T>(collection: string, id: string): T | undefined {
    const items = this.getAll<T>(collection);
    return items.find((item: unknown) => {
      if (item && typeof item === 'object' && 'id' in item) {
        return (item as { id: string }).id === id;
      }
      return false;
    });
  }

  public create<T extends Record<string, unknown>>(collection: string, item: T): T & { id: string; createdAt: Date; updatedAt: Date } {
    const items = this.getAll<T>(collection);
    const newItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T & { id: string; createdAt: Date; updatedAt: Date };
    items.push(newItem);
    this.store.set(collection, items);
    return newItem;
  }

  public update<T extends { id: string }>(collection: string, id: string, updates: Record<string, unknown>): T | undefined {
    const items = this.getAll<T>(collection);
    const index = items.findIndex((item: unknown) => {
      if (item && typeof item === 'object' && 'id' in item) {
        return (item as { id: string }).id === id;
      }
      return false;
    });

    if (index !== -1) {
      const existing = items[index];
      const updated = {
        ...existing,
        ...updates,
        id: existing.id,
        updatedAt: new Date(),
      } as T;
      items[index] = updated;
      this.store.set(collection, items);
      return updated;
    }
    return undefined;
  }

  public delete(collection: string, id: string): boolean {
    const items = this.getAll(collection);
    const index = items.findIndex((item: unknown) => {
      if (item && typeof item === 'object' && 'id' in item) {
        return (item as { id: string }).id === id;
      }
      return false;
    });

    if (index !== -1) {
      items.splice(index, 1);
      this.store.set(collection, items);
      return true;
    }
    return false;
  }

  public search<T>(collection: string, query: string, fields: string[]): T[] {
    const items = this.getAll<T>(collection);
    const lowerQuery = query.toLowerCase();

    return items.filter((item: unknown) => {
      if (typeof item !== 'object' || item === null) return false;

      return fields.some((field) => {
        const value = (item as Record<string, unknown>)[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });
  }

  public count(collection: string): number {
    return this.getAll(collection).length;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Seed initial data for testing
  public seedInitialData(): void {
    // Seed sample patients
    const patients = [
      {
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1985-03-15',
        gender: 'male' as const,
        contactPhone: '+91-9876543210',
        contactEmail: 'john.smith@email.com',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        medicalHistory: ['Hypertension'],
        allergies: ['Penicillin'],
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: '1990-07-22',
        gender: 'female' as const,
        contactPhone: '+91-9876543211',
        contactEmail: 'sarah.j@email.com',
        address: {
          street: '456 Oak Avenue',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India',
        },
        medicalHistory: [],
        allergies: [],
      },
    ];

    patients.forEach((patient) => {
      this.create('patients', patient);
    });

    // Seed sample materia medica
    const materiaMedica = [
      {
        name: 'Arnica Montana',
        scientificName: 'Arnica montana',
        family: 'Asteraceae',
        description: 'First remedy for trauma, bruises, and muscular soreness. Useful for patients who feel sore and bruised.',
        symptoms: ['Soreness', 'Bruising', 'Trauma', 'Muscle pain', 'Overexertion'],
        modalities: {
          worse: ['Touch', 'Movement', 'Heat'],
          better: ['Rest', 'Lying down'],
        },
        relationships: ['Rhus toxicodendron', 'Bryonia'],
        source: 'Classical Materia Medica',
      },
      {
        name: 'Nux Vomica',
        scientificName: 'Strychnos nux-vomica',
        family: 'Loganiaceae',
        description: 'Remedy for impatient, irritable, and chilly patients. Excellent for digestive complaints and overindulgence.',
        symptoms: ['Irritability', 'Digestive disturbances', 'Headache', 'Sensitivity to noise', 'Overeating'],
        modalities: {
          worse: ['Noise', 'Odors', 'Touch', 'Morning'],
          better: ['Evening', 'Rest', 'Warm applications'],
        },
        relationships: ['Ignatia', 'Lycopodium'],
        source: 'Classical Materia Medica',
      },
    ];

    materiaMedica.forEach((mm) => {
      this.create('materiaMedica', mm);
    });

    // Seed fee structure
    const fees = [
      { name: 'New Patient Consultation', type: 'consultation' as const, amount: 500 },
      { name: 'Follow-up Consultation', type: 'consultation' as const, amount: 300 },
      { name: 'Medicine - Arnica 30', type: 'medicine' as const, amount: 50 },
      { name: 'Medicine - Nux Vomica 30', type: 'medicine' as const, amount: 50 },
    ];

    fees.forEach((fee) => {
      this.create('fees', fee);
    });
  }
}

// Export singleton instance
export const db = LocalDatabase.getInstance();

// Database operations for each domain
export const patientDb = {
  getAll: () => db.getAll('patients'),
  getById: (id: string) => db.getById('patients', id),
  create: (patient: Parameters<typeof db.create>[1]) => db.create('patients', patient),
  update: (id: string, updates: Parameters<typeof db.update>[2]) => db.update('patients', id, updates),
  delete: (id: string) => db.delete('patients', id),
  search: (query: string) => db.search('patients', query, ['firstName', 'lastName', 'contactPhone']),
};

export const appointmentDb = {
  getAll: () => db.getAll('appointments'),
  getById: (id: string) => db.getById('appointments', id),
  create: (appointment: Parameters<typeof db.create>[1]) => db.create('appointments', appointment),
  update: (id: string, updates: Parameters<typeof db.update>[2]) => db.update('appointments', id, updates),
  delete: (id: string) => db.delete('appointments', id),
};

export const materiaMedicaDb = {
  getAll: () => db.getAll('materiaMedica'),
  getById: (id: string) => db.getById('materiaMedica', id),
  create: (item: Parameters<typeof db.create>[1]) => db.create('materiaMedica', item),
  search: (query: string) => db.search('materiaMedica', query, ['name', 'symptoms', 'description']),
};

export const feesDb = {
  getAll: () => db.getAll('fees'),
  getById: (id: string) => db.getById('fees', id),
  create: (fee: Parameters<typeof db.create>[1]) => db.create('fees', fee),
};

export const queueDb = {
  getAll: () => db.getAll('queue'),
  add: (item: Parameters<typeof db.create>[1]) => db.create('queue', item),
  update: (id: string, updates: Parameters<typeof db.update>[2]) => db.update('queue', id, updates),
  remove: (id: string) => db.delete('queue', id),
};

// ============================================
// Module 2: User Roles & Permissions Database Operations
// ============================================

// Default Permissions (Module 2.7)
const defaultPermissions = [
  // Clinical Permissions
  { id: 'p1', category: 'clinical' as const, name: 'View Case', key: 'view_case', description: 'View patient case details', enabled: true },
  { id: 'p2', category: 'clinical' as const, name: 'Edit Case', key: 'edit_case', description: 'Edit patient case details', enabled: true },
  { id: 'p3', category: 'clinical' as const, name: 'Create Prescription', key: 'create_prescription', description: 'Create new prescription', enabled: true },
  { id: 'p4', category: 'clinical' as const, name: 'Edit Prescription', key: 'edit_prescription', description: 'Edit existing prescription', enabled: true },
  { id: 'p5', category: 'clinical' as const, name: 'Delete Prescription', key: 'delete_prescription', description: 'Delete prescription', enabled: true },
  
  // Operational Permissions
  { id: 'p6', category: 'operational' as const, name: 'Book Appointment', key: 'book_appointment', description: 'Book new appointment', enabled: true },
  { id: 'p7', category: 'operational' as const, name: 'Cancel Appointment', key: 'cancel_appointment', description: 'Cancel appointment', enabled: true },
  { id: 'p8', category: 'operational' as const, name: 'Reschedule', key: 'reschedule', description: 'Reschedule appointment', enabled: true },
  { id: 'p9', category: 'operational' as const, name: 'Generate Token', key: 'generate_token', description: 'Generate queue token', enabled: true },
  
  // Financial Permissions
  { id: 'p10', category: 'financial' as const, name: 'View Fees', key: 'view_fees', description: 'View fee structure', enabled: true },
  { id: 'p11', category: 'financial' as const, name: 'Edit Fees', key: 'edit_fees', description: 'Edit fee structure', enabled: true },
  { id: 'p12', category: 'financial' as const, name: 'Refund', key: 'refund', description: 'Process refunds', enabled: true },
  { id: 'p13', category: 'financial' as const, name: 'Override Fee Rules', key: 'override_fees', description: 'Override fee rules', enabled: true },
  
  // Pharmacy Permissions
  { id: 'p14', category: 'pharmacy' as const, name: 'View Prescriptions', key: 'view_prescriptions', description: 'View prescriptions', enabled: true },
  { id: 'p15', category: 'pharmacy' as const, name: 'Edit Labels', key: 'edit_labels', description: 'Edit prescription labels', enabled: true },
  { id: 'p16', category: 'pharmacy' as const, name: 'Mark Prepared', key: 'mark_prepared', description: 'Mark medicine as prepared', enabled: true },
  { id: 'p17', category: 'pharmacy' as const, name: 'Stop Preparation', key: 'stop_preparation', description: 'Stop medicine preparation', enabled: true },
  
  // System Permissions
  { id: 'p18', category: 'system' as const, name: 'Settings', key: 'settings', description: 'Access system settings', enabled: true },
  { id: 'p19', category: 'system' as const, name: 'Backup', key: 'backup', description: 'Create backups', enabled: true },
  { id: 'p20', category: 'system' as const, name: 'Restore', key: 'restore', description: 'Restore from backup', enabled: true },
  { id: 'p21', category: 'system' as const, name: 'Licensing', key: 'licensing', description: 'Manage licensing', enabled: true },
];

// Default Roles (Module 2.3)
const defaultRoles = [
  {
    id: 'role-doctor',
    name: 'Doctor',
    description: 'Full control over everything',
    isSystem: true,
    permissions: {
      // Clinical
      view_case: true,
      edit_case: true,
      create_prescription: true,
      edit_prescription: true,
      delete_prescription: true,
      // Operational
      book_appointment: true,
      cancel_appointment: true,
      reschedule: true,
      generate_token: true,
      // Financial
      view_fees: true,
      edit_fees: true,
      refund: true,
      override_fees: true,
      // Pharmacy
      view_prescriptions: true,
      edit_labels: true,
      mark_prepared: true,
      stop_preparation: true,
      // System
      settings: true,
      backup: true,
      restore: true,
      licensing: true,
    },
  },
  {
    id: 'role-frontdesk',
    name: 'Frontdesk',
    description: 'Appointments, fees, patient info',
    isSystem: true,
    permissions: {
      // Clinical - limited
      view_case: true,
      edit_case: false,
      create_prescription: false,
      edit_prescription: false,
      delete_prescription: false,
      // Operational - full
      book_appointment: true,
      cancel_appointment: true,
      reschedule: true,
      generate_token: true,
      // Financial - limited
      view_fees: true,
      edit_fees: false,
      refund: false,
      override_fees: false,
      // Pharmacy - none
      view_prescriptions: false,
      edit_labels: false,
      mark_prepared: false,
      stop_preparation: false,
      // System - none
      settings: false,
      backup: false,
      restore: false,
      licensing: false,
    },
  },
  {
    id: 'role-pharmacy',
    name: 'Pharmacy',
    description: 'Only prescriptions and labels',
    isSystem: true,
    permissions: {
      // Clinical - none
      view_case: false,
      edit_case: false,
      create_prescription: false,
      edit_prescription: false,
      delete_prescription: false,
      // Operational - none
      book_appointment: false,
      cancel_appointment: false,
      reschedule: false,
      generate_token: false,
      // Financial - none
      view_fees: false,
      edit_fees: false,
      refund: false,
      override_fees: false,
      // Pharmacy - full
      view_prescriptions: true,
      edit_labels: true,
      mark_prepared: true,
      stop_preparation: true,
      // System - none
      settings: false,
      backup: false,
      restore: false,
      licensing: false,
    },
  },
  {
    id: 'role-assistant',
    name: 'Assistant',
    description: 'Case entry, voice notes, uploads',
    isSystem: true,
    permissions: {
      // Clinical - limited
      view_case: true,
      edit_case: true,
      create_prescription: false,
      edit_prescription: false,
      delete_prescription: false,
      // Operational - none
      book_appointment: false,
      cancel_appointment: false,
      reschedule: false,
      generate_token: false,
      // Financial - none
      view_fees: false,
      edit_fees: false,
      refund: false,
      override_fees: false,
      // Pharmacy - none
      view_prescriptions: false,
      edit_labels: false,
      mark_prepared: false,
      stop_preparation: false,
      // System - none
      settings: false,
      backup: false,
      restore: false,
      licensing: false,
    },
  },
];

// Default Users (Module 2.3)
const defaultUsers = [
  {
    id: 'user-doctor',
    username: 'doctor',
    identifierType: 'username' as const,
    identifier: 'doctor',
    password: 'doctor123', // In production, this would be hashed
    roleId: 'role-doctor',
    isActive: true,
    isDoctor: true,
    name: 'Dr. Homeopathic',
  },
  {
    id: 'user-frontdesk',
    username: 'frontdesk',
    identifierType: 'username' as const,
    identifier: 'frontdesk',
    password: 'front123',
    roleId: 'role-frontdesk',
    isActive: true,
    isDoctor: false,
    name: 'Front Desk Staff',
  },
  {
    id: 'user-pharmacy',
    username: 'pharmacy',
    identifierType: 'username' as const,
    identifier: 'pharmacy',
    password: 'pharm123',
    roleId: 'role-pharmacy',
    isActive: true,
    isDoctor: false,
    name: 'Pharmacy Staff',
  },
  {
    id: 'user-assistant',
    username: 'assistant',
    identifierType: 'username' as const,
    identifier: 'assistant',
    password: 'assist123',
    roleId: 'role-assistant',
    isActive: true,
    isDoctor: false,
    name: 'Clinic Assistant',
  },
];

// Seed Module 2 data
export function seedModule2Data(): void {
  // Seed permissions
  defaultPermissions.forEach((perm) => {
    db.create('permissions', perm);
  });

  // Seed roles
  defaultRoles.forEach((role) => {
    db.create('roles', role);
  });

  // Seed users
  defaultUsers.forEach((user) => {
    db.create('users', user);
  });

  // Seed role templates (Module 2.17)
  const roleTemplates = [
    { name: 'Busy Day Mode', description: 'Maximum efficiency settings', roleIds: ['role-doctor', 'role-frontdesk'] },
    { name: 'Solo Clinic Mode', description: 'Single person operation', roleIds: ['role-doctor'] },
    { name: 'Training Mode', description: 'Assistant has more access', roleIds: ['role-doctor', 'role-assistant'] },
  ];
  roleTemplates.forEach((template) => {
    db.create('roleTemplates', template);
  });
}

// User operations
export const userDb = {
  getAll: () => db.getAll('users'),
  getById: (id: string) => db.getById('users', id),
  getByIdentifier: (identifier: string) => {
    const users = db.getAll('users');
    return users.find((u: unknown) => {
      const user = u as { identifier: string };
      return user.identifier === identifier;
    });
  },
  create: (user: Parameters<typeof db.create>[1]) => db.create('users', user),
  update: (id: string, updates: Parameters<typeof db.update>[2]) => db.update('users', id, updates),
  delete: (id: string) => db.delete('users', id),
};

// Role operations
export const roleDb = {
  getAll: () => db.getAll('roles'),
  getById: (id: string) => db.getById('roles', id),
  create: (role: Parameters<typeof db.create>[1]) => db.create('roles', role),
  update: (id: string, updates: Parameters<typeof db.update>[2]) => db.update('roles', id, updates),
  delete: (id: string) => db.delete('roles', id),
};

// Permission operations
export const permissionDb = {
  getAll: () => db.getAll('permissions'),
  getByCategory: (category: string) => {
    const perms = db.getAll('permissions');
    return perms.filter((p: unknown) => {
      const perm = p as { category: string };
      return perm.category === category;
    });
  },
};

// Activity Log operations (Module 2.10)
export const activityLogDb = {
  getAll: () => db.getAll('activityLogs'),
  getByUser: (userId: string) => {
    const logs = db.getAll('activityLogs');
    return logs.filter((l: unknown) => {
      const log = l as { userId: string };
      return log.userId === userId;
    });
  },
  getByPatient: (patientId: string) => {
    const logs = db.getAll('activityLogs');
    return logs.filter((l: unknown) => {
      const log = l as { patientId?: string };
      return log.patientId === patientId;
    });
  },
  create: (log: Parameters<typeof db.create>[1]) => db.create('activityLogs', log),
};

// Staff Message operations (Module 2.11)
export const staffMessageDb = {
  getAll: () => db.getAll('staffMessages'),
  getByUser: (userId: string) => {
    const messages = db.getAll('staffMessages');
    return messages.filter((m: unknown) => {
      const msg = m as { recipientId: string };
      return msg.recipientId === userId;
    });
  },
  getUnread: (userId: string) => {
    const messages = db.getAll('staffMessages');
    return messages.filter((m: unknown) => {
      const msg = m as { recipientId: string; readAt?: Date };
      return msg.recipientId === userId && !msg.readAt;
    });
  },
  create: (message: Parameters<typeof db.create>[1]) => db.create('staffMessages', message),
  markRead: (id: string) => db.update('staffMessages', id, { readAt: new Date() }),
};

// Session operations (Module 2.12)
export const sessionDb = {
  getAll: () => db.getAll('sessions'),
  getActive: () => {
    const sessions = db.getAll('sessions');
    return sessions.filter((s: unknown) => {
      const session = s as { isActive: boolean };
      return session.isActive;
    });
  },
  create: (session: Parameters<typeof db.create>[1]) => db.create('sessions', session),
  update: (id: string, updates: Parameters<typeof db.update>[2]) => db.update('sessions', id, updates),
  deactivate: (id: string) => db.update('sessions', id, { isActive: false }),
};

// Role Template operations
export const roleTemplateDb = {
  getAll: () => db.getAll('roleTemplates'),
  getById: (id: string) => db.getById('roleTemplates', id),
  create: (template: Parameters<typeof db.create>[1]) => db.create('roleTemplates', template),
  apply: (templateId: string) => {
    const template = db.getById('roleTemplates', templateId);
    return template;
  },
};

// Ensure Module 2 data is seeded (called before auth operations)
let module2Seeded = false;
export function ensureModule2DataSeeded(): void {
  if (module2Seeded) return;
  
  // Check if roles exist
  const roles = db.getAll('roles');
  if (roles.length === 0) {
    seedModule2Data();
    module2Seeded = true;
  }
}
