import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { pharmacyQueue } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET - Fetch pharmacy queue
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    if (status) {
      const queueItems = await db.select()
        .from(pharmacyQueue)
        .where(eq(pharmacyQueue.status, status))
        .orderBy(desc(pharmacyQueue.priority), desc(pharmacyQueue.createdAt));
      return NextResponse.json(queueItems);
    }

    const queueItems = await db.select()
      .from(pharmacyQueue)
      .where(eq(pharmacyQueue.status, 'pending'))
      .orderBy(desc(pharmacyQueue.priority), desc(pharmacyQueue.createdAt));

    return NextResponse.json(queueItems);
  } catch (error) {
    console.error('Error fetching pharmacy queue:', error);
    return NextResponse.json({ error: 'Failed to fetch pharmacy queue' }, { status: 500 });
  }
}

// POST - Add to pharmacy queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitId, patientId, prescriptionIds, priority = false } = body;

    const queueId = uuidv4();
    await db.insert(pharmacyQueue).values({
      id: queueId,
      visitId,
      patientId,
      prescriptionIds: JSON.stringify(prescriptionIds),
      priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, queueId });
  } catch (error) {
    console.error('Error adding to pharmacy queue:', error);
    return NextResponse.json({ error: 'Failed to add to pharmacy queue' }, { status: 500 });
  }
}

// PATCH - Update pharmacy status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueId, status, stopReason, preparedBy } = body;

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pharmacy status:', error);
    return NextResponse.json({ error: 'Failed to update pharmacy status' }, { status: 500 });
  }
}
