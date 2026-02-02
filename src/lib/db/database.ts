// ============================================
// Local Database Infrastructure
// Offline-first data layer based on Module 1
// ============================================

import type { DatabaseConfig } from '@/types';

// Database configuration
const dbConfig: DatabaseConfig = {
  type: 'sqlite',
  name: 'pms_database',
  version: 1,
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

  public update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): T | undefined {
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
