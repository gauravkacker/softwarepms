import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { visits, prescriptions, fees, pharmacyQueue, patients } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET - Fetch visit details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const visitId = searchParams.get('visitId');

  try {
    if (visitId) {
      // Fetch specific visit with patient info
      const visit = await db.select({
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

      if (!visit[0]) {
        return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
      }

      // Fetch prescriptions for this visit
      const visitPrescriptions = await db.select()
        .from(prescriptions)
        .where(eq(prescriptions.visitId, visitId))
        .orderBy(prescriptions.rowOrder);

      // Fetch fees for this visit
      const visitFees = await db.select()
        .from(fees)
        .where(eq(fees.visitId, visitId))
        .orderBy(desc(fees.createdAt));

      return NextResponse.json({
        ...visit[0],
        prescriptions: visitPrescriptions,
        fees: visitFees,
      });
    }

    if (patientId) {
      // Fetch all visits for a patient
      const patientVisits = await db.select()
        .from(visits)
        .where(eq(visits.patientId, patientId))
        .orderBy(desc(visits.visitDate));

      return NextResponse.json(patientVisits);
    }

    return NextResponse.json({ error: 'Missing patientId or visitId' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching visit:', error);
    return NextResponse.json({ error: 'Failed to fetch visit' }, { status: 500 });
  }
}

// POST - Create new visit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      chiefComplaint,
      caseText,
      diagnosis,
      advice,
      testsRequired,
      nextVisit,
      prognosis,
      remarksToFrontdesk,
      prescriptions: prescriptionData,
      feeAmount,
      feeType,
      paymentStatus,
      discountPercent,
      discountReason,
    } = body;

    // Get next visit number for this patient
    const lastVisit = await db.select()
      .from(visits)
      .where(eq(visits.patientId, patientId))
      .orderBy(desc(visits.visitNumber))
      .limit(1);

    const visitNumber = (lastVisit[0]?.visitNumber || 0) + 1;
    const visitId = uuidv4();

    // Create visit
    await db.insert(visits).values({
      id: visitId,
      patientId,
      visitDate: new Date(),
      visitNumber,
      chiefComplaint,
      caseText,
      diagnosis,
      advice,
      testsRequired,
      nextVisit: nextVisit ? new Date(nextVisit) : null,
      prognosis,
      remarksToFrontdesk,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create prescriptions if provided
    if (prescriptionData && prescriptionData.length > 0) {
      for (let i = 0; i < prescriptionData.length; i++) {
        const rx = prescriptionData[i];
        await db.insert(prescriptions).values({
          id: uuidv4(),
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
        });
      }
    }

    // Create fee if provided
    if (feeAmount) {
      await db.insert(fees).values({
        id: uuidv4(),
        patientId,
        visitId,
        amount: parseFloat(feeAmount),
        feeType: feeType || 'consultation',
        paymentStatus: paymentStatus || 'pending',
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        discountReason: discountReason,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ 
      success: true, 
      visitId,
      visitNumber,
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
  }
}

// PUT - Update visit
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      visitId,
      chiefComplaint,
      caseText,
      diagnosis,
      advice,
      testsRequired,
      nextVisit,
      prognosis,
      remarksToFrontdesk,
      prescriptions: prescriptionData,
      status,
    } = body;

    // Update visit
    await db.update(visits)
      .set({
        chiefComplaint,
        caseText,
        diagnosis,
        advice,
        testsRequired,
        nextVisit: nextVisit ? new Date(nextVisit) : null,
        prognosis,
        remarksToFrontdesk,
        status,
        updatedAt: new Date(),
      })
      .where(eq(visits.id, visitId));

    // Update prescriptions if provided
    if (prescriptionData && prescriptionData.length > 0) {
      // Delete existing prescriptions
      await db.delete(prescriptions).where(eq(prescriptions.visitId, visitId));

      // Insert new prescriptions
      for (let i = 0; i < prescriptionData.length; i++) {
        const rx = prescriptionData[i];
        await db.insert(prescriptions).values({
          id: uuidv4(),
          visitId,
          patientId: rx.patientId,
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
        });
      }
    }

    return NextResponse.json({ success: true, visitId });
  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json({ error: 'Failed to update visit' }, { status: 500 });
  }
}

// PATCH - Close visit (end consultation)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitId, action } = body;

    if (action === 'close') {
      await db.update(visits)
        .set({ status: 'locked', updatedAt: new Date() })
        .where(eq(visits.id, visitId));
    }

    return NextResponse.json({ success: true, visitId });
  } catch (error) {
    console.error('Error closing visit:', error);
    return NextResponse.json({ error: 'Failed to close visit' }, { status: 500 });
  }
}
