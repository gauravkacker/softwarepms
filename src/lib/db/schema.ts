import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Type exports for inserts
export type InsertPatient = typeof patients.$inferInsert;
export type SelectPatient = typeof patients.$inferSelect;
export type InsertVisit = typeof visits.$inferInsert;
export type SelectVisit = typeof visits.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;
export type SelectPrescription = typeof prescriptions.$inferSelect;
export type InsertFee = typeof fees.$inferInsert;
export type SelectFee = typeof fees.$inferSelect;
export type InsertPharmacyQueue = typeof pharmacyQueue.$inferInsert;
export type SelectPharmacyQueue = typeof pharmacyQueue.$inferSelect;
export type InsertCombination = typeof combinations.$inferInsert;
export type SelectCombination = typeof combinations.$inferSelect;
export type InsertMedicineMemory = typeof medicineUsageMemory.$inferInsert;
export type SelectMedicineMemory = typeof medicineUsageMemory.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
export type SelectSetting = typeof settings.$inferSelect;

// Patients table
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  mobile: text('mobile').notNull(),
  regNumber: text('reg_number').notNull().unique(),
  regDate: integer('reg_date', { mode: 'timestamp' }).notNull(),
  age: integer('age'),
  sex: text('sex'),
  address: text('address'),
  email: text('email'),
  occupation: text('occupation'),
  weight: real('weight'),
  bloodGroup: text('blood_group'),
  chiefComplaints: text('chief_complaints'),
  history: text('history'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Visits/Cases table
export const visits = sqliteTable('visits', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  visitDate: integer('visit_date', { mode: 'timestamp' }).notNull(),
  visitNumber: integer('visit_number').notNull(),
  tokenNumber: integer('token_number'),
  chiefComplaint: text('chief_complaint'),
  caseText: text('case_text'),
  diagnosis: text('diagnosis'),
  advice: text('advice'),
  testsRequired: text('tests_required'),
  nextVisit: integer('next_visit', { mode: 'timestamp' }),
  prognosis: text('prognosis'),
  remarksToFrontdesk: text('remarks_to_frontdesk'),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Prescriptions table
export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').primaryKey(),
  visitId: text('visit_id').notNull().references(() => visits.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  medicine: text('medicine').notNull(),
  potency: text('potency'),
  quantity: text('quantity').notNull(),
  doseForm: text('dose_form').default('pills'),
  dosePattern: text('dose_pattern'),
  frequency: text('frequency'),
  duration: text('duration'),
  durationDays: integer('duration_days'),
  bottles: integer('bottles').default(1),
  instructions: text('instructions'),
  rowOrder: integer('row_order').notNull(),
  isCombination: integer('is_combination', { mode: 'boolean' }).default(false),
  combinationName: text('combination_name'),
  combinationContent: text('combination_content'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Combination Medicines
export const combinations = sqliteTable('combinations', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  content: text('content').notNull(),
  showComposition: integer('show_composition', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Fee records
export const fees = sqliteTable('fees', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  visitId: text('visit_id').references(() => visits.id),
  amount: real('amount').notNull(),
  feeType: text('fee_type').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'),
  discountPercent: real('discount_percent'),
  discountReason: text('discount_reason'),
  paymentMethod: text('payment_method'),
  collectedBy: text('collected_by'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Pharmacy Queue
export const pharmacyQueue = sqliteTable('pharmacy_queue', {
  id: text('id').primaryKey(),
  visitId: text('visit_id').notNull().references(() => visits.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  prescriptionIds: text('prescription_ids').notNull(),
  priority: integer('priority', { mode: 'boolean' }).default(false),
  status: text('status').notNull().default('pending'),
  stopReason: text('stop_reason'),
  preparedBy: text('prepared_by'),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Medicine usage memory
export const medicineUsageMemory = sqliteTable('medicine_usage_memory', {
  id: text('id').primaryKey(),
  medicine: text('medicine').notNull(),
  potency: text('potency'),
  quantity: text('quantity'),
  doseForm: text('dose_form'),
  dosePattern: text('dose_pattern'),
  frequency: text('frequency'),
  duration: text('duration'),
  useCount: integer('use_count').notNull().default(1),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Settings table
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  category: text('category').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
