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

interface MedicineSuggestion {
  name: string;
  type: "medicine" | "combination";
  content?: string;
  description?: string;
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
  
  // Autocomplete state
  const [medicineSuggestions, setMedicineSuggestions] = useState<MedicineSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [activeAutocompleteRowId, setActiveAutocompleteRowId] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // AI Parsing settings - initialize from localStorage using lazy initializers
  const [aiParsingEnabled, setAiParsingEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("aiParsingEnabled") === "true";
  });
  const [aiApiKey, setAiApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("aiParsingApiKey") || "";
  });
  const [isAiParsing, setIsAiParsing] = useState(false);

  // Focus on smart parse input on mount
  useEffect(() => {
    smartParseInputRef.current?.focus();
  }, []);

  // Fetch medicine suggestions
  const fetchMedicineSuggestions = useCallback(async (query: string, rowId: string) => {
    if (!query || query.length < 1) {
      setMedicineSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/medicines/autocomplete?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      const suggestions: MedicineSuggestion[] = [
        ...(data.medicines || []).map((m: { name: string }) => ({
          name: m.name,
          type: "medicine" as const,
        })),
        ...(data.combinations || []).map((c: { name: string; content: string; description?: string }) => ({
          name: c.name,
          type: "combination" as const,
          content: c.content,
          description: c.description,
        })),
      ];

      setMedicineSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSelectedSuggestionIndex(0);
      setActiveAutocompleteRowId(rowId);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setMedicineSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Handle suggestion selection
  const selectSuggestion = (suggestion: MedicineSuggestion) => {
    if (!activeAutocompleteRowId) return;
    
    updateField(activeAutocompleteRowId, "medicine", suggestion.name);
    setShowSuggestions(false);
    setMedicineSuggestions([]);
    setActiveAutocompleteRowId(null);
    
    // Focus on potency field after selection
    setTimeout(() => {
      const field = inputRefs.current[activeAutocompleteRowId]?.["potency"];
      field?.focus();
    }, 0);
  };

  // Handle keyboard navigation in suggestions
  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowId: string) => {
    if (!showSuggestions) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => 
        prev < medicineSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => prev > 0 ? prev - 1 : 0);
    } else if (e.key === "Enter" && medicineSuggestions.length > 0) {
      e.preventDefault();
      selectSuggestion(medicineSuggestions[selectedSuggestionIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle smart parsing on Enter key
  const handleSmartParseKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      // Try AI parsing first if enabled
      if (aiParsingEnabled && aiApiKey) {
        setIsAiParsing(true);
        try {
          const response = await fetch("/api/parse-prescription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: smartParseInput, apiKey: aiApiKey }),
          });
          
          const data = await response.json();
          
          if (data.success && data.data.medicineName) {
            const newRow = createRowFromParsed(data.data);
            setPrescriptionRows((prev) => [...prev, newRow]);
            setSmartParseInput("");
            setTimeout(() => {
              const field = inputRefs.current[newRow.id]?.["medicine"];
              field?.focus();
            }, 0);
            setIsAiParsing(false);
            return;
          }
        } catch (error) {
          console.error("AI parsing error:", error);
        }
        setIsAiParsing(false);
      }
      
      // Fall back to regex parsing
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

  // Auto-save combination when medicine field contains a combination pattern
  const saveCombinationIfNeeded = async (medicineName: string) => {
    // Check if the medicine name looks like a combination (contains "+" or " + ")
    const combinationPattern = /^(.+?)\s*\+\s*(.+)$/;
    const match = medicineName.match(combinationPattern);
    
    if (!match) return; // Not a combination
    
    // Extract combination name and content
    // If it's like "ABC (Arnica + Belladonna + Calendula)" - use the short name
    // If it's like "Arnica + Belladonna + Calendula" - use the full string as content
    const shortNameMatch = medicineName.match(/^([A-Z]{2,})\s*\((.+)\)$/i);
    
    let name: string;
    let content: string;
    
    if (shortNameMatch) {
      // Format: "ABC (Arnica + Belladonna + Calendula)"
      name = shortNameMatch[1];
      content = shortNameMatch[2];
    } else {
      // Format: "Arnica + Belladonna + Calendula"
      // Use the full string as both name and content
      content = medicineName;
      // Generate a short name from initials
      const parts = medicineName.split(/\s*\+\s*/);
      name = parts.map(p => p.charAt(0).toUpperCase()).join('');
    }
    
    try {
      await fetch("/api/combinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
    } catch (error) {
      console.error("Error saving combination:", error);
    }
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

    // Handle autocomplete navigation for medicine field
    if (field === "medicine" && showSuggestions) {
      handleSuggestionKeyDown(e, rowId);
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape") {
        return;
      }
    }

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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-neutral-300">
              Smart Parse (type prescription and press Enter)
            </label>
            <div className="flex items-center gap-3">
              {/* Toggle Switch for AI Parsing */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">AI</span>
                <button
                  type="button"
                  onClick={() => {
                    const newValue = !aiParsingEnabled;
                    setAiParsingEnabled(newValue);
                    localStorage.setItem("aiParsingEnabled", String(newValue));
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800 ${
                    aiParsingEnabled ? "bg-green-500" : "bg-neutral-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiParsingEnabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {aiParsingEnabled && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  AI Enhanced
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <input
              ref={smartParseInputRef}
              type="text"
              value={smartParseInput}
              onChange={(e) => setSmartParseInput(e.target.value)}
              onKeyDown={handleSmartParseKeyDown}
              disabled={isAiParsing}
              placeholder='e.g., "Arnica 200 2dr 4 pills tds for 7 days"'
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {isAiParsing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            {aiParsingEnabled 
              ? "AI parsing ON - understands natural language prescriptions"
              : "AI parsing OFF - using basic pattern matching"
            }
            {!aiApiKey && aiParsingEnabled && (
              <a href="/settings/ai-parsing" className="ml-2 text-blue-400 hover:text-blue-300">
                Configure API key
              </a>
            )}
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
                    <td className="px-3 py-2 relative">
                      <input
                        ref={(el) => setInputRef(row.id, "medicine", el)}
                        type="text"
                        value={row.medicine}
                        onChange={(e) => {
                          updateField(row.id, "medicine", e.target.value);
                          fetchMedicineSuggestions(e.target.value, row.id);
                        }}
                        onKeyDown={(e) => handleFieldKeyDown(e, row.id, "medicine")}
                        onFocus={() => {
                          setActiveRowId(row.id);
                          if (row.medicine) {
                            fetchMedicineSuggestions(row.medicine, row.id);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow clicking on suggestions
                          setTimeout(() => setShowSuggestions(false), 200);
                          // Auto-save combination if the medicine name contains "+"
                          if (row.medicine && row.medicine.includes("+")) {
                            saveCombinationIfNeeded(row.medicine);
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {/* Autocomplete Dropdown */}
                      {showSuggestions && activeAutocompleteRowId === row.id && medicineSuggestions.length > 0 && (
                        <div 
                          ref={suggestionsRef}
                          className="absolute z-50 top-full left-0 mt-1 w-80 bg-neutral-700 border border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          {medicineSuggestions.map((suggestion, i) => (
                            <button
                              key={`${suggestion.type}-${suggestion.name}`}
                              onClick={() => selectSuggestion(suggestion)}
                              className={`w-full text-left px-3 py-2 ${
                                i === selectedSuggestionIndex 
                                  ? "bg-blue-600 text-white" 
                                  : "hover:bg-neutral-600"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{suggestion.name}</span>
                                {suggestion.type === "combination" && (
                                  <span className="text-xs px-1.5 py-0.5 bg-purple-600 rounded text-purple-100">
                                    Combo
                                  </span>
                                )}
                              </div>
                              {suggestion.type === "combination" && suggestion.content && (
                                <div className="text-xs text-neutral-300 mt-0.5">
                                  {suggestion.content}
                                </div>
                              )}
                              {suggestion.type === "combination" && suggestion.description && (
                                <div className="text-xs text-neutral-400 mt-0.5 italic">
                                  {suggestion.description}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
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
