import { NextResponse } from "next/server";
import { db } from "@/db";
import { medicines, combinations } from "@/db/schema";
import { like, or, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  if (!query || query.length < 1) {
    return NextResponse.json({ medicines: [], combinations: [] });
  }

  try {
    // Search medicines
    const medicineResults = await db
      .select()
      .from(medicines)
      .where(like(sql`LOWER(${medicines.name})`, `%${query}%`))
      .limit(10);

    // Search combinations
    const combinationResults = await db
      .select()
      .from(combinations)
      .where(
        or(
          like(sql`LOWER(${combinations.name})`, `%${query}%`),
          like(sql`LOWER(${combinations.content})`, `%${query}%`)
        )
      )
      .limit(10);

    return NextResponse.json({
      medicines: medicineResults,
      combinations: combinationResults,
    });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to search medicines" },
      { status: 500 }
    );
  }
}

// Seed initial data
export async function POST() {
  try {
    // Check if data already exists
    const existingMedicines = await db.select().from(medicines);
    const existingCombinations = await db.select().from(combinations);

    if (existingMedicines.length === 0) {
      // Insert common medicines
      const commonMedicines = [
        "Aconitum Napellus",
        "Allium Cepa",
        "Antimonium Tartaricum",
        "Apis Mellifica",
        "Arnica Montana",
        "Arsenicum Album",
        "Baptisia Tinctoria",
        "Belladonna",
        "Bryonia Alba",
        "Calcarea Carbonica",
        "Cantharis",
        "Carbo Vegetabilis",
        "Causticum",
        "Chamomilla",
        "China Officinalis",
        "Colocynthis",
        "Drosera Rotundifolia",
        "Eupatorium Perfoliatum",
        "Ferrum Phosphoricum",
        "Gelsemium Sempervirens",
        "Hepar Sulphuris",
        "Hypericum Perforatum",
        "Ignatia Amara",
        "Ipecacuanha",
        "Kali Bichromicum",
        "Kali Carbonicum",
        "Lachesis",
        "Ledum Palustre",
        "Lycopodium Clavatum",
        "Magnesia Phosphorica",
        "Mercurius Solubilis",
        "Natrum Muriaticum",
        "Nux Vomica",
        "Phosphorus",
        "Podophyllum Peltatum",
        "Pulsatilla Nigricans",
        "Rhus Toxicodendron",
        "Ruta Graveolens",
        "Sabadilla",
        "Sanguinaria Canadensis",
        "Sepia",
        "Silicea",
        "Spongia Tosta",
        "Sulphur",
        "Thuja Occidentalis",
        "Veratrum Album",
        "Zincum Metallicum",
      ];

      for (const name of commonMedicines) {
        await db.insert(medicines).values({ name });
      }
    }

    if (existingCombinations.length === 0) {
      // Insert common combinations
      const commonCombinations = [
        { name: "BC", content: "Bryonia + Causticum", description: "For cough and respiratory conditions" },
        { name: "BCR", content: "Bryonia + Causticum + Rhus Tox", description: "For joint pain and inflammation" },
        { name: "ARS", content: "Arsenicum Album + Rhus Tox + Sulphur", description: "For skin conditions" },
        { name: "AB", content: "Arnica + Belladonna", description: "For injuries and inflammation" },
        { name: "ABC", content: "Arnica + Belladonna + Calendula", description: "For wounds and injuries" },
        { name: "GHA", content: "Gelsemium + Aconite + Bryonia", description: "For flu and fever" },
        { name: "RST", content: "Rhus Tox + Sulphur + Thuja", description: "For skin eruptions" },
        { name: "NBS", content: "Nux Vomica + Bryonia + Sulphur", description: "For digestive issues" },
        { name: "PCC", content: "Phosphorus + Carbo Veg + China", description: "For weakness and exhaustion" },
        { name: "HSC", content: "Hepar Sulph + Silicea + Calendula", description: "For infections and abscesses" },
      ];

      for (const combo of commonCombinations) {
        await db.insert(combinations).values(combo);
      }
    }

    return NextResponse.json({ success: true, message: "Data seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}
