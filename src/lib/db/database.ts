import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('homeo-pms.db');
export const db = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      reg_number TEXT NOT NULL UNIQUE,
      reg_date INTEGER NOT NULL,
      age INTEGER,
      sex TEXT,
      address TEXT,
      email TEXT,
      occupation TEXT,
      weight REAL,
      blood_group TEXT,
      chief_complaints TEXT,
      history TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      visit_date INTEGER NOT NULL,
      visit_number INTEGER NOT NULL,
      token_number INTEGER,
      chief_complaint TEXT,
      case_text TEXT,
      diagnosis TEXT,
      advice TEXT,
      tests_required TEXT,
      next_visit INTEGER,
      prognosis TEXT,
      remarks_to_frontdesk TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id),
      patient_id TEXT NOT NULL REFERENCES patients(id),
      medicine TEXT NOT NULL,
      potency TEXT,
      quantity TEXT NOT NULL,
      dose_form TEXT DEFAULT 'pills',
      dose_pattern TEXT,
      frequency TEXT,
      duration TEXT,
      duration_days INTEGER,
      bottles INTEGER DEFAULT 1,
      instructions TEXT,
      row_order INTEGER NOT NULL,
      is_combination INTEGER DEFAULT 0,
      combination_name TEXT,
      combination_content TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS combinations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      show_composition INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      visit_id TEXT REFERENCES visits(id),
      amount REAL NOT NULL,
      fee_type TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      discount_percent REAL,
      discount_reason TEXT,
      payment_method TEXT,
      collected_by TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pharmacy_queue (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id),
      patient_id TEXT NOT NULL REFERENCES patients(id),
      prescription_ids TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      stop_reason TEXT,
      prepared_by TEXT,
      delivered_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medicine_usage_memory (
      id TEXT PRIMARY KEY,
      medicine TEXT NOT NULL,
      potency TEXT,
      quantity TEXT,
      dose_form TEXT,
      dose_pattern TEXT,
      frequency TEXT,
      duration TEXT,
      use_count INTEGER NOT NULL DEFAULT 1,
      last_used_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
    CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_visit ON prescriptions(visit_id);
    CREATE INDEX IF NOT EXISTS idx_fees_patient ON fees(patient_id);
    CREATE INDEX IF NOT EXISTS idx_pharmacy_status ON pharmacy_queue(status);
  `);
}

// Initialize on import
initializeDatabase();
