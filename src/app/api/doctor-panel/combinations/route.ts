import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { combinations } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET - Fetch all combinations
export async function GET() {
  try {
    const allCombinations = await db.select()
      .from(combinations)
      .orderBy(asc(combinations.name));

    return NextResponse.json(allCombinations);
  } catch (error) {
    console.error('Error fetching combinations:', error);
    return NextResponse.json({ error: 'Failed to fetch combinations' }, { status: 500 });
  }
}

// POST - Create or update combination
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, content, showComposition } = body;

    // Check if combination exists
    const existing = await db.select()
      .from(combinations)
      .where(eq(combinations.name, name))
      .limit(1);

    if (existing[0]) {
      // Update existing
      await db.update(combinations)
        .set({
          content,
          showComposition: showComposition !== undefined ? showComposition : true,
          updatedAt: new Date(),
        })
        .where(eq(combinations.id, existing[0].id));

      return NextResponse.json({ success: true, id: existing[0].id, action: 'updated' });
    }

    // Create new
    const newId = id || uuidv4();
    await db.insert(combinations).values({
      id: newId,
      name,
      content,
      showComposition: showComposition !== undefined ? showComposition : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: newId, action: 'created' });
  } catch (error) {
    console.error('Error saving combination:', error);
    return NextResponse.json({ error: 'Failed to save combination' }, { status: 500 });
  }
}

// DELETE - Delete combination
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (!id) {
      return NextResponse.json({ error: 'Missing combination ID' }, { status: 400 });
    }

    await db.delete(combinations).where(eq(combinations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting combination:', error);
    return NextResponse.json({ error: 'Failed to delete combination' }, { status: 500 });
  }
}
