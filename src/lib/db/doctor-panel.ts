import { db } from './database';
import { 
  visits, 
  prescriptions, 
  fees, 
  pharmacyQueue, 
  combinations as combinationsTable,
  medicineUsageMemory,
  patients,
  settings,
  InsertVisit,
  InsertPrescription,
  InsertFee,
  InsertPharmacyQueue,
  InsertCombination,
  InsertMedicineMemory,
  SelectVisit,
} from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, format } from 'date-fns';

// ===== VISIT OPERATIONS =====

export async function createVisit(visitData: InsertVisit) {
  const visitId = uuidv4();
  await db.insert(visits).values({
    ...visitData,
    id: visitId,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return visitId;
}

export async function updateVisit(visitId: string, data: Partial<InsertVisit>) {
  await db.update(visits)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(visits.id, visitId));
}

export async function getVisitById(visitId: string) {
  const result = await db.select({
    visit: visits,
    patient: {
      id: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
      mobile: patients.mobile,
      regNumber: patients.regNumber,
      age: patients.age,
      sex: patients.sex,
    }
  })
  .from(visits)
  .innerJoin(patients, eq(visits.patientId, patients.id))
  .where(eq(visits.id, visitId))
  .limit(1);
  
  return result[0] as { visit: SelectVisit; patient: typeof patients.$inferSelect } | undefined;
}

export async function getPatientActiveVisit(patientId: string): Promise<SelectVisit | undefined> {
  const result = await db.select()
    .from(visits)
    .where(and(
      eq(visits.patientId, patientId),
      eq(visits.status, 'active')
    ))
    .orderBy(desc(visits.visitDate))
    .limit(1);
  
  return result[0] as SelectVisit | undefined;
}

export async function getPatientVisits(patientId: string, limit = 10): Promise<SelectVisit[]> {
  return await db.select()
    .from(visits)
    .where(eq(visits.patientId, patientId))
    .orderBy(desc(visits.visitDate))
    .limit(limit) as SelectVisit[];
}

export async function closeVisit(visitId: string) {
  await db.update(visits)
    .set({ status: 'locked', updatedAt: new Date() })
    .where(eq(visits.id, visitId));
}

// ===== PRESCRIPTION OPERATIONS =====

export async function savePrescriptions(visitId: string, patientId: string, prescriptionsData: any[]) {
  await db.delete(prescriptions).where(eq(prescriptions.visitId, visitId));
  
  for (let i = 0; i < prescriptionsData.length; i++) {
    const rx = prescriptionsData[i];
    const prescriptionId = uuidv4();
    
    await db.insert(prescriptions).values({
      id: prescriptionId,
      visitId,
      patientId,
      medicine: rx.medicine,
      potency: rx.potency,
      quantity: rx.quantity,
      doseForm: rx.doseForm || 'pills',
      dosePattern: rx.dosePattern,
      frequency: rx.frequency,
      duration: rx.duration,
      durationDays: rx.durationDays,
      bottles: rx.bottles || 1,
      instructions: rx.instructions,
      rowOrder: i,
      isCombination: rx.isCombination || false,
      combinationName: rx.combinationName,
      combinationContent: rx.combinationContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as InsertPrescription);

    await updateMedicineMemory(rx);
  }
}

export async function getVisitPrescriptions(visitId: string) {
  return await db.select()
    .from(prescriptions)
    .where(eq(prescriptions.visitId, visitId))
    .orderBy(prescriptions.rowOrder);
}

export async function getPatientLastPrescription(patientId: string) {
  const result = await db.select()
    .from(prescriptions)
    .innerJoin(visits, eq(prescriptions.visitId, visits.id))
    .where(and(
      eq(prescriptions.patientId, patientId),
      eq(visits.status, 'locked')
    ))
    .orderBy(desc(visits.visitDate))
    .limit(1);
  
  return result;
}

// ===== FEE OPERATIONS =====

export async function createOrUpdateFee(feeData: InsertFee) {
  const existing = await db.select()
    .from(fees)
    .where(and(
      eq(fees.patientId, feeData.patientId!),
      eq(fees.visitId, feeData.visitId || null as any),
      eq(fees.paymentStatus, 'pending')
    ))
    .limit(1);

  if (existing[0]) {
    await db.update(fees)
      .set({ ...feeData, updatedAt: new Date() })
      .where(eq(fees.id, existing[0].id));
    return existing[0].id;
  } else {
    const feeId = uuidv4();
    await db.insert(fees).values({
      ...feeData,
      id: feeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as InsertFee);
    return feeId;
  }
}

export async function getPatientLastFee(patientId: string) {
  const result = await db.select()
    .from(fees)
    .where(eq(fees.patientId, patientId))
    .orderBy(desc(fees.createdAt))
    .limit(1);
  
  return result[0];
}

// ===== COMBINATION MEDICINES =====

export async function saveCombination(comboData: InsertCombination) {
  const existing = await db.select()
    .from(combinationsTable)
    .where(eq(combinationsTable.name, comboData.name))
    .limit(1);

  if (existing[0]) {
    await db.update(combinationsTable)
      .set({ ...comboData, updatedAt: new Date() })
      .where(eq(combinationsTable.id, existing[0].id));
    return existing[0].id;
  } else {
    const id = uuidv4();
    await db.insert(combinationsTable).values({
      ...comboData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as InsertCombination);
    return id;
  }
}

export async function getCombinations() {
  return await db.select()
    .from(combinationsTable)
    .orderBy(combinationsTable.name);
}

export async function getCombinationByName(name: string) {
  const result = await db.select()
    .from(combinationsTable)
    .where(eq(combinationsTable.name, name))
    .limit(1);
  return result[0];
}

// ===== MEDICINE USAGE MEMORY =====

export async function updateMedicineMemory(rx: any) {
  const potencyCondition = rx.potency 
    ? eq(medicineUsageMemory.potency, rx.potency)
    : eq(medicineUsageMemory.potency, null as any);

  const existing = await db.select()
    .from(medicineUsageMemory)
    .where(and(
      eq(medicineUsageMemory.medicine, rx.medicine),
      potencyCondition
    ))
    .limit(1);

  if (existing[0]) {
    await db.update(medicineUsageMemory)
      .set({ 
        quantity: rx.quantity,
        doseForm: rx.doseForm,
        dosePattern: rx.dosePattern,
        frequency: rx.frequency,
        duration: rx.duration,
        useCount: (existing[0].useCount || 0) + 1,
        lastUsedAt: new Date(),
      })
      .where(eq(medicineUsageMemory.id, existing[0].id));
  } else {
    const id = uuidv4();
    await db.insert(medicineUsageMemory).values({
      id,
      medicine: rx.medicine,
      potency: rx.potency,
      quantity: rx.quantity,
      doseForm: rx.doseForm,
      dosePattern: rx.dosePattern,
      frequency: rx.frequency,
      duration: rx.duration,
      useCount: 1,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    } as InsertMedicineMemory);
  }
}

export async function getMedicineMemory(medicine: string, potency?: string) {
  if (potency) {
    return await db.select()
      .from(medicineUsageMemory)
      .where(and(
        eq(medicineUsageMemory.medicine, medicine),
        eq(medicineUsageMemory.potency, potency)
      ))
      .orderBy(desc(medicineUsageMemory.useCount))
      .limit(5);
  }

  return await db.select()
    .from(medicineUsageMemory)
    .where(eq(medicineUsageMemory.medicine, medicine))
    .orderBy(desc(medicineUsageMemory.useCount))
    .limit(5);
}

// ===== PHARMACY QUEUE =====

export async function addToPharmacyQueue(data: InsertPharmacyQueue) {
  const id = uuidv4();
  await db.insert(pharmacyQueue).values({
    ...data,
    id,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InsertPharmacyQueue);
  return id;
}

export async function updatePharmacyStatus(
  queueId: string, 
  status: 'preparing' | 'ready' | 'delivered' | 'stopped',
  stopReason?: string
) {
  const updateData: any = { status, updatedAt: new Date() };
  
  if (status === 'delivered') {
    updateData.deliveredAt = new Date();
  }
  if (status === 'stopped') {
    updateData.stopReason = stopReason;
  }

  await db.update(pharmacyQueue)
    .set(updateData)
    .where(eq(pharmacyQueue.id, queueId));
}

export async function getPharmacyQueue() {
  return await db.select()
    .from(pharmacyQueue)
    .where(eq(pharmacyQueue.status, 'pending'))
    .orderBy(desc(pharmacyQueue.priority), desc(pharmacyQueue.createdAt));
}

// ===== VISIT STATISTICS =====

export async function getVisitStats(patientId: string) {
  const visitsList = await db.select()
    .from(visits)
    .where(eq(visits.patientId, patientId))
    .orderBy(desc(visits.visitDate));

  if (visitsList.length === 0) {
    return {
      totalVisits: 0,
      lastVisitDate: null,
      daysSinceLastVisit: null,
      lastPrescription: null,
    };
  }

  const lastVisit = visitsList[0] as SelectVisit;
  const lastVisitDate = lastVisit?.visitDate ? new Date(lastVisit.visitDate) : null;
  const daysSinceLastVisit = lastVisitDate 
    ? differenceInDays(new Date(), lastVisitDate)
    : null;

  return {
    totalVisits: visitsList.length,
    lastVisitDate: lastVisitDate ? format(lastVisitDate, 'dd MMM yyyy') : null,
    daysSinceLastVisit,
    lastVisit: lastVisit,
  };
}

// ===== SETTINGS HELPERS =====

export async function getSetting(key: string) {
  const result = await db.select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return result[0]?.value;
}

export async function saveSetting(key: string, value: string, category: string) {
  const existing = await db.select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (existing[0]) {
    await db.update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.id, existing[0].id));
  } else {
    await db.insert(settings).values({
      id: uuidv4(),
      key,
      value,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
