import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { fees } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET - Fetch fees
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const visitId = searchParams.get('visitId');

  try {
    if (visitId) {
      const fee = await db.select()
        .from(fees)
        .where(eq(fees.visitId, visitId))
        .orderBy(desc(fees.createdAt))
        .limit(1);
      return NextResponse.json(fee[0] || null);
    }

    if (patientId) {
      const patientFees = await db.select()
        .from(fees)
        .where(eq(fees.patientId, patientId))
        .orderBy(desc(fees.createdAt));
      return NextResponse.json(patientFees);
    }

    return NextResponse.json({ error: 'Missing patientId or visitId' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching fees:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}

// POST - Create or update fee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, visitId, amount, feeType, paymentStatus, discountPercent, discountReason, paymentMethod, collectedBy, notes } = body;

    // Check for pending fee
    const condition = visitId 
      ? and(eq(fees.patientId, patientId), eq(fees.visitId, visitId), eq(fees.paymentStatus, 'pending'))
      : and(eq(fees.patientId, patientId), eq(fees.visitId, null as any), eq(fees.paymentStatus, 'pending'));

    const existing = await db.select()
      .from(fees)
      .where(condition!)
      .limit(1);

    if (existing[0]) {
      await db.update(fees)
        .set({
          amount: parseFloat(amount),
          feeType,
          paymentStatus,
          discountPercent: discountPercent ? parseFloat(discountPercent) : null,
          discountReason,
          paymentMethod,
          collectedBy,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(fees.id, existing[0].id));
      return NextResponse.json({ success: true, feeId: existing[0].id, action: 'updated' });
    }

    const feeId = uuidv4();
    await db.insert(fees).values({
      id: feeId,
      patientId,
      visitId,
      amount: parseFloat(amount),
      feeType,
      paymentStatus: paymentStatus || 'pending',
      discountPercent: discountPercent ? parseFloat(discountPercent) : null,
      discountReason,
      paymentMethod,
      collectedBy,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, feeId, action: 'created' });
  } catch (error) {
    console.error('Error saving fee:', error);
    return NextResponse.json({ error: 'Failed to save fee' }, { status: 500 });
  }
}
