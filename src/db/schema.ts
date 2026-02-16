import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Medicines table - individual homeopathic medicines
export const medicines = sqliteTable("medicines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  commonPotencies: text("common_potencies"), // JSON array of common potencies like ["6C", "30C", "200C"]
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Combinations table - combination medicines
export const combinations = sqliteTable("combinations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  content: text("content").notNull(), // The medicines in the combination, e.g., "Arsenicum Album + Bryonia + Rhus Tox"
  description: text("description"), // Optional description of what the combination is used for
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Common homeopathic medicines for seeding
export const commonMedicines = [
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

// Common combinations for seeding
export const commonCombinations = [
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
