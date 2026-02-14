"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Types
interface PrescriptionRow {
  id: string;
  medicine: string;
  potency: string;
  quantity: string;
  doseForm: string;
  dose: string;
  frequency: string;
  pattern: string;
  duration: string;
  bottles: string;
}

interface ParsedPrescription {
  medicineName: string;
  potency: string;
  quantity: string;
  doseForm: string;
  dosePerIntake: string;
  frequency: string;
  pattern: string;
  duration: string;
  prescriptionText: string;
}

// Smart Parsing Function
function parsePrescriptionText(input: string): ParsedPrescription | null {
  if (!input.trim()) return null;

  const text = input.trim().toLowerCase();
  const originalText = input.trim();

  // Common frequency patterns and their conversions
  const frequencyMap: Record<string, { pattern: string; frequency: string }> = {
    od: { pattern: "1-0-0", frequency: "OD" },
    bd: { pattern: "1-0-1", frequency: "BD" },
    tds: { pattern: "1-1-1", frequency: "TDS" },
    tid: { pattern: "1-1-1", frequency: "TDS" },
    qid: { pattern: "1-1-1-1", frequency: "QID" },
    hs: { pattern: "0-0-1", frequency: "HS" },
    sos: { pattern: "SOS", frequency: "SOS" },
    weekly: { pattern: "Weekly", frequency: "Weekly" },
    monthly: { pattern: "Monthly", frequency: "Monthly" },
  };

  // Extract duration (e.g., "7 days", "2 weeks", "1 month", "4 weeks")
  const durationMatch = text.match(/(\d+)\s*(days?|weeks?|months?)/i);
  const duration = durationMatch ? `${durationMatch[1]} ${durationMatch[2]}` : "";

  // Extract quantity - support fractions like "1/2oz", "1/2dr"
  // The fraction may be attached to the unit like "1/2oz" or have space "1/2 oz"
  let quantity = "";
  // Match fraction with unit attached (e.g., "1/2oz") or with space (e.g., "1/2 oz")
  const fractionQuantityMatch = text.match(/(\d+)\/(\d+)\s*(dr|oz|ml)/i);
  if (fractionQuantityMatch) {
    quantity = `${fractionQuantityMatch[1]}/${fractionQuantityMatch[2]}${fractionQuantityMatch[3]}`;
  } else {
    // Match whole number quantities - but not if preceded by / (to avoid matching "2" in "1/2oz")
    const wholeQuantityMatch = text.match(/(?<!\/)(\d+)\s*(dr|oz|ml)\b/i);
    if (wholeQuantityMatch) {
      quantity = `${wholeQuantityMatch[1]}${wholeQuantityMatch[2]}`;
    }
  }

  // Extract dose form (pills, drops, tablets, etc.) - may or may not have a number
  // First try with number (e.g., "4 pills")
  let doseForm = "";
  let dosePerIntake = "";
  const doseFormWithNumberMatch = text.match(/(\d+)\s*(pills?|drops?|tablets?|capsules?|powder|ointment|cream)\b/i);
  if (doseFormWithNumberMatch) {
    doseForm = doseFormWithNumberMatch[2].toLowerCase();
    dosePerIntake = doseFormWithNumberMatch[1];
  } else {
    // Try without number (e.g., "liquid")
    const doseFormNoNumberMatch = text.match(/\b(pills?|drops?|tablets?|capsules?|liquid|powder|ointment|cream)\b/i);
    if (doseFormNoNumberMatch) {
      doseForm = doseFormNoNumberMatch[1].toLowerCase();
      dosePerIntake = "";
    }
  }

  // Extract pattern - check for custom patterns like "6-6-6", "1-1-1", "1-0-1" first
  let frequency = "";
  let pattern = "";
  
  // Check for custom numeric pattern (e.g., "6-6-6", "1-1-1", "1-0-0")
  const customPatternMatch = text.match(/\b(\d+)-(\d+)-(\d+)\b/);
  if (customPatternMatch) {
    pattern = `${customPatternMatch[1]}-${customPatternMatch[2]}-${customPatternMatch[3]}`;
    // Derive frequency from pattern - count non-zero doses for times per day
    const doses = [customPatternMatch[1], customPatternMatch[2], customPatternMatch[3]].map(Number);
    const nonZeroDoses = doses.filter(d => d > 0).length;
    if (nonZeroDoses === 1) {
      frequency = "OD";
    } else if (nonZeroDoses === 2) {
      frequency = "BD";
    } else if (nonZeroDoses === 3) {
      frequency = "TDS";
    } else if (nonZeroDoses === 4) {
      frequency = "QID";
    }
  } else {
    // Check for predefined frequency keywords
    for (const [key, value] of Object.entries(frequencyMap)) {
      if (text.includes(key)) {
        frequency = value.frequency;
        pattern = value.pattern;
        break;
      }
    }
  }

  // Extract potency - match numbers followed by potency suffix (c, ch, m, x)
  // Common potencies: 6C, 30C, 200C, 1M, 10M, 30X, 200CH, etc.
  // The pattern needs to match "1m", "1M", "200c", "200C", "30ch", etc.
  const potencyMatch = text.match(/\b(\d+)\s*(c|ch|m|x)\b/i);
  let potency = potencyMatch ? `${potencyMatch[1]}${potencyMatch[2].toUpperCase()}` : "";

  // Extract medicine name - collect words until we hit a potency, quantity, or other marker
  // We need to identify the medicine name BEFORE potency/quantity/pattern
  let medicineName = "";
  const words = originalText.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const lowerWord = word.toLowerCase();
    
    // Check if this word is a potency (number + c/ch/m/x suffix)
    // Match patterns like "1M", "200C", "30CH", "10M"
    if (/^\d+[cchmx]$/i.test(word)) {
      break; // Stop at potency
    }
    
    // Check if this word is a fraction (like "1/2oz" or "1/2")
    if (/^\d+\/\d+/.test(word)) {
      break; // Stop at fraction quantity
    }
    
    // Check if this word is a standalone number that could be potency
    // Only break if followed by a potency suffix in next word or if it's a typical potency number
    if (/^\d+$/.test(word)) {
      // Check if next word is a potency suffix
      const nextWord = words[i + 1]?.toLowerCase();
      if (nextWord && /^[cchmx]$/.test(nextWord)) {
        break; // This number is a potency
      }
      // Check if it's a typical potency value (6, 12, 30, 200, 1000, etc.)
      const numVal = parseInt(word);
      if ([1, 3, 6, 12, 30, 60, 100, 200, 1000, 10000].includes(numVal) && !potency) {
        break; // Likely a potency
      }
    }
    
    // Check for dose forms
    if (["dr", "oz", "ml", "pills", "drops", "tablets", "capsules", "liquid", "powder", "ointment", "cream"].includes(lowerWord)) {
      break;
    }
    
    // Check for frequency keywords
    if (Object.keys(frequencyMap).includes(lowerWord)) {
      break;
    }
    
    // Check for duration keywords
    if (["for", "days", "weeks", "months"].includes(lowerWord)) {
      break;
    }
    
    // Check for pattern
    if (/^\d+-\d+-\d+$/.test(word)) {
      break;
    }
    
    // This word is part of the medicine name
    medicineName = medicineName ? `${medicineName} ${word}` : word;
  }

  // Capitalize medicine name properly (e.g., "Ars alb" -> "Ars Alb")
  medicineName = medicineName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  // Generate prescription text
  let prescriptionText = "";
  if (medicineName && potency) {
    prescriptionText = `${medicineName} ${potency}`;
  } else if (medicineName) {
    prescriptionText = medicineName;
  }

  if (dosePerIntake && doseForm && pattern) {
    const doses = pattern.split("-");
    if (doses.length === 3 && !pattern.includes("SOS") && !pattern.includes("Weekly") && !pattern.includes("Monthly")) {
      const morning = doses[0] !== "0" ? `${dosePerIntake} ${doseForm} morning` : "";
      const afternoon = doses[1] !== "0" ? `${dosePerIntake} ${doseForm} afternoon` : "";
      const evening = doses[2] !== "0" ? `${dosePerIntake} ${doseForm} night` : "";
      const parts = [morning, afternoon, evening].filter(Boolean);
      if (parts.length > 0) {
        prescriptionText += `\n${parts.join(" – ")}`;
      }
    } else if (pattern === "SOS") {
      prescriptionText += `\n${dosePerIntake} ${doseForm} SOS`;
    } else if (pattern === "Weekly") {
      prescriptionText += `\n${dosePerIntake} ${doseForm} Weekly`;
    } else if (pattern === "Monthly") {
      prescriptionText += `\n${dosePerIntake} ${doseForm} Monthly`;
    }
  }

  if (duration) {
    prescriptionText += `\nfor ${duration}`;
  }

  return {
    medicineName,
    potency,
    quantity,
    doseForm,
    dosePerIntake,
    frequency,
    pattern,
    duration,
    prescriptionText,
  };
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create empty prescription row
function createEmptyRow(): PrescriptionRow {
  return {
    id: generateId(),
    medicine: "",
    potency: "",
    quantity: "",
    doseForm: "",
    dose: "",
    frequency: "",
    pattern: "",
    duration: "",
    bottles: "",
  };
}

// Create row from parsed prescription
function createRowFromParsed(parsed: ParsedPrescription): PrescriptionRow {
  return {
    id: generateId(),
    medicine: parsed.medicineName,
    potency: parsed.potency,
    quantity: parsed.quantity,
    doseForm: parsed.doseForm,
    dose: parsed.dosePerIntake,
    frequency: parsed.frequency,
    pattern: parsed.pattern,
    duration: parsed.duration,
    bottles: "",
  };
}

export default function DoctorPanelPage() {
  const [smartParseInput, setSmartParseInput] = useState("");
  const [prescriptionRows, setPrescriptionRows] = useState<PrescriptionRow[]>([createEmptyRow()]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, Record<string, HTMLInputElement | null>>>({});
  const smartParseInputRef = useRef<HTMLInputElement>(null);

  // Focus on smart parse input on mount
  useEffect(() => {
    smartParseInputRef.current?.focus();
  }, []);

  // Handle smart parsing on Enter key
  const handleSmartParseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = parsePrescriptionText(smartParseInput);
      if (parsed && parsed.medicineName) {
        const newRow = createRowFromParsed(parsed);
        setPrescriptionRows((prev) => [...prev, newRow]);
        setSmartParseInput("");
        // Focus on the new row's first field
        setTimeout(() => {
          const field = inputRefs.current[newRow.id]?.["medicine"];
          field?.focus();
        }, 0);
      }
    }
  };

  // Handle field change
  const updateField = (rowId: string, field: keyof PrescriptionRow, value: string) => {
    setPrescriptionRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  // Handle key navigation within prescription rows
  const handleFieldKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowId: string,
    field: keyof PrescriptionRow
  ) => {
    const fields: (keyof PrescriptionRow)[] = [
      "medicine",
      "potency",
      "quantity",
      "doseForm",
      "dose",
      "frequency",
      "pattern",
      "duration",
      "bottles",
    ];
    const currentIndex = fields.indexOf(field);

    if (e.key === "Tab") {
      // Let default Tab behavior work for navigation between fields
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      
      // If on the last field (bottles), create a new row
      if (field === "bottles") {
        const newRow = createEmptyRow();
        setPrescriptionRows((prev) => [...prev, newRow]);
        setTimeout(() => {
          const newField = inputRefs.current[newRow.id]?.["medicine"];
          newField?.focus();
        }, 0);
      } else {
        // Move to next field in the same row
        const nextField = fields[currentIndex + 1];
        const nextInput = inputRefs.current[rowId]?.[nextField];
        nextInput?.focus();
      }
    }
  };

  // Set ref for input field
  const setInputRef = (rowId: string, field: string, el: HTMLInputElement | null) => {
    if (!inputRefs.current[rowId]) {
      inputRefs.current[rowId] = {};
    }
    inputRefs.current[rowId][field] = el;
  };

  // Delete row
  const deleteRow = (rowId: string) => {
    setPrescriptionRows((prev) => {
      if (prev.length === 1) {
        return [createEmptyRow()];
      }
      return prev.filter((row) => row.id !== rowId);
    });
  };

  // Add empty row
  const addEmptyRow = () => {
    const newRow = createEmptyRow();
    setPrescriptionRows((prev) => [...prev, newRow]);
    setTimeout(() => {
      const field = inputRefs.current[newRow.id]?.["medicine"];
      field?.focus();
    }, 0);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Doctor Panel</h1>

        {/* Smart Parsing Input */}
        <div className="mb-6 bg-neutral-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Smart Parse (type prescription and press Enter)
          </label>
          <input
            ref={smartParseInputRef}
            type="text"
            value={smartParseInput}
            onChange={(e) => setSmartParseInput(e.target.value)}
            onKeyDown={handleSmartParseKeyDown}
            placeholder='e.g., "Arnica 200 2dr 4 pills tds for 7 days"'
            className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-neutral-400">
            Format: Medicine Potency Quantity DoseForm Dose Frequency Duration
          </p>
        </div>

        {/* Prescription Table */}
        <div className="bg-neutral-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-700 text-left">
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Medicine</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Potency</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Qty</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Form</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Dose</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Freq</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Pattern</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Duration</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300">Bottles</th>
                  <th className="px-3 py-3 text-sm font-medium text-neutral-300 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {prescriptionRows.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-700">
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "medicine", el)}
                        type="text"
                        value={row.medicine}
                        onChange={(e) => updateField(row.id, "medicine", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "medicine")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-full px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "potency", el)}
                        type="text"
                        value={row.potency}
                        onChange={(e) => updateField(row.id, "potency", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "potency")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-16 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "quantity", el)}
                        type="text"
                        value={row.quantity}
                        onChange={(e) => updateField(row.id, "quantity", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "quantity")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-16 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "doseForm", el)}
                        type="text"
                        value={row.doseForm}
                        onChange={(e) => updateField(row.id, "doseForm", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "doseForm")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-20 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "dose", el)}
                        type="text"
                        value={row.dose}
                        onChange={(e) => updateField(row.id, "dose", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "dose")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-14 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "frequency", el)}
                        type="text"
                        value={row.frequency}
                        onChange={(e) => updateField(row.id, "frequency", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "frequency")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-14 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "pattern", el)}
                        type="text"
                        value={row.pattern}
                        onChange={(e) => updateField(row.id, "pattern", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "pattern")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-20 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "duration", el)}
                        type="text"
                        value={row.duration}
                        onChange={(e) => updateField(row.id, "duration", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "duration")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-20 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(row.id, "bottles", el)}
                        type="text"
                        value={row.bottles}
                        onChange={(e) => updateField(row.id, "bottles", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "bottles")}
                        onFocus={() => setActiveRowId(row.id)}
                        className="w-14 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Delete row"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <div className="p-3 border-t border-neutral-700">
            <button
              onClick={addEmptyRow}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Medicine
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-6 bg-neutral-800 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-3">Prescription Preview</h2>
          <div className="bg-white text-black rounded p-4 min-h-[100px] font-mono text-sm whitespace-pre-wrap">
            {prescriptionRows
              .filter((row) => row.medicine)
              .map((row) => {
                let text = row.medicine;
                if (row.potency) text += ` ${row.potency}`;
                if (row.dose && row.doseForm && row.pattern) {
                  const doses = row.pattern.split("-");
                  if (doses.length === 3 && !row.pattern.includes("SOS")) {
                    const parts: string[] = [];
                    if (doses[0] !== "0") parts.push(`${row.dose} ${row.doseForm} morning`);
                    if (doses[1] !== "0") parts.push(`${row.dose} ${row.doseForm} afternoon`);
                    if (doses[2] !== "0") parts.push(`${row.dose} ${row.doseForm} night`);
                    if (parts.length > 0) text += `\n${parts.join(" – ")}`;
                  } else if (row.frequency === "SOS") {
                    text += `\n${row.dose} ${row.doseForm} SOS`;
                  } else {
                    text += `\n${row.dose} ${row.doseForm} ${row.frequency}`;
                  }
                }
                if (row.duration) text += `\nfor ${row.duration}`;
                return text;
              })
              .join("\n\n") || "No medicines added yet."}
          </div>
        </div>
      </div>
    </div>
  );
}
