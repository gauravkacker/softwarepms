import { NextResponse } from "next/server";
import { db } from "@/db";
import { combinations } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET all combinations
export async function GET() {
  try {
    const allCombinations = await db.select().from(combinations);
    return NextResponse.json({ combinations: allCombinations });
  } catch (error) {
    console.error("Error fetching combinations:", error);
    return NextResponse.json(
      { error: "Failed to fetch combinations" },
      { status: 500 }
    );
  }
}

// POST - Create or update a combination
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, content, description } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Check if combination with this name already exists
    const existing = await db
      .select()
      .from(combinations)
      .where(eq(combinations.name, name))
      .limit(1);

    if (existing.length > 0) {
      // Update existing combination
      const updated = await db
        .update(combinations)
        .set({ content, description: description || null })
        .where(eq(combinations.name, name))
        .returning();
      return NextResponse.json({ combination: updated[0], created: false });
    }

    // Create new combination
    const created = await db
      .insert(combinations)
      .values({ name, content, description: description || null })
      .returning();

    return NextResponse.json({ combination: created[0], created: true });
  } catch (error) {
    console.error("Error saving combination:", error);
    return NextResponse.json(
      { error: "Failed to save combination" },
      { status: 500 }
    );
  }
}

// DELETE a combination
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Combination ID is required" },
        { status: 400 }
      );
    }

    await db.delete(combinations).where(eq(combinations.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting combination:", error);
    return NextResponse.json(
      { error: "Failed to delete combination" },
      { status: 500 }
    );
  }
}
