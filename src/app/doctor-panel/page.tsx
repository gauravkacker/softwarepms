"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { patientDb, appointmentDb } from '@/lib/db/database';
import type { Patient, Appointment } from '@/types';

// Local types for Doctor Panel (simpler for UI state)
interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  registrationNumber: string;
  age?: number;
  gender?: string;
}

interface Visit {
  id: string;
  patientId: string;
  visitDate: Date;
  visitNumber: number;
  chiefComplaint?: string;
  caseText?: string;
  diagnosis?: string;
  advice?: string;
  testsRequired?: string;
  nextVisit?: Date;
  prognosis?: string;
  remarksToFrontdesk?: string;
  status: string;
}

interface Prescription {
  medicine: string;
  potency?: string;
  quantity: string;
  doseForm?: string;
  dosePattern?: string;
  frequency?: string;
  duration?: string;
  durationDays?: number;
  bottles?: number;
  instructions?: string;
  isCombination?: boolean;
  combinationName?: string;
  combinationContent?: string;
}

// Main Component
export default function DoctorPanelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientRecord[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [pastVisits, setPastVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [caseText, setCaseText] = useState('');
  const [isSystemAssist, setIsSystemAssist] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showMateriaMedica, setShowMateriaMedica] = useState(false);
  const [materiaMedicaQuery, setMateriaMedicaQuery] = useState('');
  const [showPharmacyQueue, setShowPharmacyQueue] = useState(false);
  
  // Additional fields
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [testsRequired, setTestsRequired] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [nextVisitDays, setNextVisitDays] = useState('');
  const [prognosis, setPrognosis] = useState('');
  const [remarksToFrontdesk, setRemarksToFrontdesk] = useState('');
  
  // Fee editing
  const [feeAmount, setFeeAmount] = useState('');
  const [feeType, setFeeType] = useState('consultation');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  
  // Combination medicines
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [combinationName, setCombinationName] = useState('');
  const [combinationContent, setCombinationContent] = useState('');
  const [editingCombinationIndex, setEditingCombinationIndex] = useState<number | null>(null);
  
  // Medicine autocomplete
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [medicineSuggestions, setMedicineSuggestions] = useState<string[]>([]);
  const [showMedicineSuggestions, setShowMedicineSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Common homeopathic medicines for autocomplete
  const commonMedicines = [
    'Aconitum napellus', 'Arsenicum album', 'Belladonna', 'Bryonia alba', 'Calcarea carbonica',
    'Chamomilla', 'China officinalis', 'Coffea cruda', 'Dulcamara', 'Ferrum phosphoricum',
    'Gelsemium', 'Hepar sulphuris', 'Ignatia amara', 'Ipecacuanha', 'Kali bichromicum',
    'Lachesis', 'Lycopodium', 'Mercurius solubilis', 'Natrum muriaticum', 'Nux vomica',
    'Phosphorus', 'Pulsatilla', 'Rhus toxicodendron', 'Sepia', 'Silicea',
    'Sulphur', 'Thuja occidentalis', 'Arnica montana', 'Hypericum', 'Ruta graveolens',
    'Aesculus hippocastanum', 'Aloe socotrina', 'Antimonium crudum', 'Apis mellifica', 'Argentum nitricum',
    'Aurum metallicum', 'Baryta carbonica', 'Berberis vulgaris', 'Borax', 'Cactus grandiflorus',
    'Calcarea phosphorica', 'Cantharis', 'Carbo vegetabilis', 'Causticum', 'Cimicifuga',
    'Coccus cacti', 'Colocynthis', 'Conium maculatum', 'Cornus circinata', 'Crotalus horribilis',
    'Cuprum metallicum', 'Digitalis', 'Drosera', 'Echinacea', 'Eupatorium perforliatum',
    'Euphrasia', 'Graphites', 'Hamamelis', 'Hydrastis', 'Hypericum perfoliatum',
    'Kali carbonicum', 'Kali phosphoricum', 'Kreosotum', 'Lac caninum', 'Lobelia',
    'Magnesia phosphorica', 'Medorrhinum', 'Murex purpureus', 'Nitricum acidum', 'Oleander',
    'Oxalic acid', 'Petroleum', 'Phosphoricum acidum', 'Phytolacca', 'Platina',
    'Podophyllum', 'Psorinum', 'Pyrogenium', 'Ranunculus bulbosus', 'Raphanus',
    'Rumex crispus', 'Sabadilla', 'Sambucus nigra', 'Sanicula', 'Sarsaparilla',
    'Secale cornutum', 'Selenium', 'Spongia', 'Stannum metallicum', 'Staphysagria',
    'Stramonium', 'Sulphuricum acidum', 'Tabacum', 'Tarantula', 'Tellurium',
    'Theridion', 'Thlaspi', 'Tuberculinum', 'Veratrum album', 'Verbascum',
    'Viola odorata', 'Vipera', 'Zincum metallicum', 'Zingiber'
  ];
  
  // System memory for medicine patterns
  const MEDICINE_MEMORY_KEY = 'homeo_prescription_memory';
  const CUSTOM_MEDICINES_KEY = 'homeo_custom_medicines';
  
  interface MedicineMemory {
    medicine: string;
    potency?: string;
    quantity: string;
    doseForm: string;
    dosePattern: string;
    frequency: string;
    duration: string;
    usageCount: number;
    lastUsed: Date;
  }
  
  // Get saved custom medicines (entered by user)
  const getCustomMedicines = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(CUSTOM_MEDICINES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };
  
  // Save a custom medicine entered by user
  const saveCustomMedicine = (medicine: string) => {
    if (typeof window === 'undefined' || !medicine.trim()) return;
    const customMeds = getCustomMedicines();
    const lowerMed = medicine.toLowerCase().trim();
    if (!customMeds.some(m => m.toLowerCase() === lowerMed)) {
      customMeds.push(medicine.trim());
      localStorage.setItem(CUSTOM_MEDICINES_KEY, JSON.stringify(customMeds));
    }
  };
  
  // Get all medicines for autocomplete (common + custom)
  const getAllMedicinesForAutocomplete = (query: string): string[] => {
    const customMeds = getCustomMedicines();
    const filteredCustom = customMeds.filter(m => 
      m.toLowerCase().includes(query.toLowerCase())
    );
    const filteredCommon = commonMedicines.filter(m => 
      m.toLowerCase().includes(query.toLowerCase())
    );
    // Combine, prioritize custom medicines
    return [...new Set([...filteredCustom, ...filteredCommon])].slice(0, 10);
  };
  
  const getMedicineMemory = (): Record<string, MedicineMemory> => {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(MEDICINE_MEMORY_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };
  
  const saveMedicineToMemory = (medicine: string, potency: string, pattern: Prescription) => {
    if (typeof window === 'undefined' || !medicine.trim()) return;
    
    // Save medicine to custom list
    saveCustomMedicine(medicine);
    
    const memory = getMedicineMemory();
    const key = `${medicine.toLowerCase()}_${potency || ''}`;
    
    memory[key] = {
      medicine: medicine,
      potency: potency || '',
      quantity: pattern.quantity || '1dr',
      doseForm: pattern.doseForm || 'pills',
      dosePattern: pattern.dosePattern || '1-1-1',
      frequency: pattern.frequency || 'Daily',
      duration: pattern.duration || '7 days',
      usageCount: (memory[key]?.usageCount || 0) + 1,
      lastUsed: new Date()
    };
    
    localStorage.setItem(MEDICINE_MEMORY_KEY, JSON.stringify(memory));
  };
  
  const getMedicinePattern = (medicine: string, potency: string): Prescription | null => {
    const memory = getMedicineMemory();
    const key = `${medicine.toLowerCase()}_${potency || ''}`;
    return memory[key] || null;
  };
  
  // Load saved pattern when medicine/potency changes
  const loadSavedPattern = (index: number, medicine: string, potency: string) => {
    if (!medicine.trim()) return;
    
    const pattern = getMedicinePattern(medicine, potency);
    if (pattern) {
      setPrescriptions(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: pattern.quantity,
          doseForm: pattern.doseForm,
          dosePattern: pattern.dosePattern,
          frequency: pattern.frequency,
          duration: pattern.duration,
        };
        return updated;
      });
    }
  };
  
  // Modal states
  const [showEndConsultationModal, setShowEndConsultationModal] = useState(false);
  const [showSameDayReopenModal, setShowSameDayReopenModal] = useState(false);
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  
  // Refs
  const caseTextRef = useRef<HTMLTextAreaElement>(null);
  const medicineInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search for patients
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      const allPatients = patientDb.getAll() as Patient[];
      const filtered = allPatients.filter((p) =>
        p.firstName.toLowerCase().includes(query.toLowerCase()) ||
        p.lastName.toLowerCase().includes(query.toLowerCase()) ||
        p.fullName.toLowerCase().includes(query.toLowerCase()) ||
        p.registrationNumber.toLowerCase().includes(query.toLowerCase()) ||
        p.mobileNumber.includes(query)
      ).map((p): PatientRecord => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        mobile: p.mobileNumber,
        registrationNumber: p.registrationNumber,
        age: p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : undefined,
        gender: p.gender,
      }));
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Select a patient from search results
  const handleSelectPatient = (selectedPatient: PatientRecord) => {
    loadPatientData(selectedPatient.id);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    // Update URL with patient ID
    router.push(`/doctor-panel?patientId=${selectedPatient.id}`);
  };

  // Load patient data from database
  const loadPatientData = useCallback(async (id: string) => {
    const patientData = patientDb.getById(id) as Patient | undefined;
    
    if (patientData) {
      const patientRecord: PatientRecord = {
        id: patientData.id,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        mobile: patientData.mobileNumber,
        registrationNumber: patientData.registrationNumber,
        age: patientData.dateOfBirth ? new Date().getFullYear() - new Date(patientData.dateOfBirth).getFullYear() : undefined,
        gender: patientData.gender,
      };
      setPatient(patientRecord);
    }

    // Check for active visit (in a real app, this would query the visit table)
    const mockActiveVisit: Visit = {
      id: uuidv4(),
      patientId: id,
      visitDate: new Date(),
      visitNumber: 1,
      status: 'active',
    };
    setCurrentVisit(mockActiveVisit);
    
    // Mock past visits
    setPastVisits([
      {
        id: uuidv4(),
        patientId: id,
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        visitNumber: 1,
        chiefComplaint: 'Headache',
        caseText: 'Severe headache since morning',
        diagnosis: 'Tension headache',
        status: 'locked',
      },
    ]);

    // Mock last fee
    setFeeAmount('500');
    setFeeType('consultation');
  }, [setPatient, setCurrentVisit, setPastVisits, setFeeAmount, setFeeType]);

  // Load patient from URL on mount
  useEffect(() => {
    if (patientIdFromUrl) {
      loadPatientData(patientIdFromUrl);
    }
  }, [patientIdFromUrl, loadPatientData]);

  // ===== CASE TAKING =====
  
  const handleCaseTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCaseText(text);
    
    // Check for vague symptoms if system assist is on
    if (isSystemAssist) {
      analyzeCaseText(text);
    }
  };

  const addCaseLine = (line: string) => {
    setCaseText(prev => prev + (prev ? '\n' : '') + line);
    setTimeout(() => {
      if (caseTextRef.current) {
        caseTextRef.current.focus();
      }
    }, 0);
  };

  const analyzeCaseText = (text: string) => {
    // Simple vague symptom detection
    const vagueTerms = ['pain', '不舒服', 'problem', 'issue'];
    // This would integrate with AI/system assist in real implementation
  };

  // ===== PRESCRIPTION TABLE =====

  const addEmptyPrescriptionRow = () => {
    setPrescriptions(prev => [...prev, {
      medicine: '',
      potency: '',
      quantity: '1dr',
      doseForm: 'pills',
      dosePattern: '1-1-1',
      frequency: 'Daily',
      duration: '7 days',
      bottles: 1,
    }]);
  };

  const updatePrescriptionRow = (index: number, field: string, value: string | number) => {
    setPrescriptions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removePrescriptionRow = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const movePrescriptionRow = (index: number, direction: 'up' | 'down') => {
    setPrescriptions(prev => {
      const updated = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < updated.length) {
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      }
      return updated;
    });
  };

  const parseSmartEntry = (text: string): Prescription => {
    // Smart parsing for one-line entry
    // Example: "Arnica 200 2dr 4 pills TDS or 3 times a day or 4-4-4 for 7 days"
    const parts = text.split(' ');
    
    let rx: Prescription = {
      medicine: '',
      potency: '',
      quantity: '1dr',
      doseForm: 'pills',
      dosePattern: '1-1-1',
      frequency: 'Daily',
      duration: '7 days',
      bottles: 1,
    };

    // Parse medicine and potency (assume first 1-2 parts)
    if (parts.length > 0) {
      rx.medicine = parts[0];
      // Check if second part is potency (number or 200/1M etc)
      if (parts.length > 1 && /^\d+$/.test(parts[1])) {
        rx.potency = parts[1];
      }
    }

    // Parse quantity
    const quantityMatch = text.match(/(\d+)\s*(dr|oz|bottle|pills?)/i);
    if (quantityMatch) {
      rx.quantity = quantityMatch[0];
      rx.doseForm = quantityMatch[2].toLowerCase().includes('dr') ? 'drops' : 'pills';
    }

    // Parse dose pattern (4-4-4, 1-0-1, etc)
    const patternMatch = text.match(/(\d-\d-\d)/);
    if (patternMatch) {
      rx.dosePattern = patternMatch[1];
    }

    // Parse frequency
    if (/tds|3\s*times/i.test(text)) {
      rx.frequency = 'Daily';
      rx.dosePattern = '1-1-1';
    } else if (/bid|2\s*times/i.test(text)) {
      rx.frequency = 'Daily';
      rx.dosePattern = '1-0-1';
    } else if (/hs|night/i.test(text)) {
      rx.frequency = 'Daily';
      rx.dosePattern = '0-0-1';
    }

    // Parse duration
    const durationMatch = text.match(/(\d+)\s*(day|week|month)/i);
    if (durationMatch) {
      rx.duration = `${durationMatch[1]} ${durationMatch[2]}s`;
      rx.durationDays = parseInt(durationMatch[1]) * (durationMatch[2].toLowerCase().startsWith('w') ? 7 : durationMatch[2].toLowerCase().startsWith('m') ? 30 : 1);
    }

    return rx;
  };

  // ===== MEDICINE AUTOCOMPLETE =====
  
  const handleMedicineSearchChange = (index: number, value: string) => {
    setMedicineSearchQuery(value);
    updatePrescriptionRow(index, 'medicine', value);
    
    if (value.trim().length > 0) {
      // Use all medicines (common + custom) for autocomplete
      const suggestions = getAllMedicinesForAutocomplete(value);
      setMedicineSuggestions(suggestions);
      setShowMedicineSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setMedicineSuggestions([]);
      setShowMedicineSuggestions(false);
    }
  };
  
  const handleMedicineKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    totalRows: number
  ) => {
    if (!showMedicineSuggestions) {
      // Handle Tab/Enter for navigation when suggestions are hidden
      if (e.key === 'Enter') {
        e.preventDefault();
        // Save pattern to memory when Enter is pressed
        const rx = prescriptions[index];
        if (rx.medicine.trim()) {
          saveMedicineToMemory(rx.medicine, rx.potency || '', rx);
        }
        // Add new row if on last row
        if (index === totalRows - 1) {
          addEmptyPrescriptionRow();
        }
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < medicineSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && medicineSuggestions[selectedSuggestionIndex]) {
          selectMedicine(index, medicineSuggestions[selectedSuggestionIndex]);
        } else if (prescriptions[index].medicine.trim()) {
          // Save to memory if no suggestion selected
          const rx = prescriptions[index];
          saveMedicineToMemory(rx.medicine, rx.potency || '', rx);
        }
        // Add new row if on last row
        if (index === totalRows - 1) {
          addEmptyPrescriptionRow();
        }
        break;
      case 'Tab':
        if (selectedSuggestionIndex >= 0 && medicineSuggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          selectMedicine(index, medicineSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowMedicineSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };
  
  const selectMedicine = (index: number, medicine: string) => {
    updatePrescriptionRow(index, 'medicine', medicine);
    setShowMedicineSuggestions(false);
    setMedicineSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setMedicineSearchQuery('');
    
    // Try to load saved pattern for this medicine
    loadSavedPattern(index, medicine, '');
  };
  
  const handlePotencyKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    totalRows: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rx = prescriptions[index];
      if (rx.medicine.trim() && rx.potency) {
        saveMedicineToMemory(rx.medicine, rx.potency, rx);
        loadSavedPattern(index, rx.medicine, rx.potency);
      }
      // Add new row if on last row
      if (index === totalRows - 1) {
        addEmptyPrescriptionRow();
      }
    }
  };

  const handleOpenCombination = (index: number) => {
    setEditingCombinationIndex(index);
    setCombinationName(prescriptions[index].combinationName || prescriptions[index].medicine || '');
    setCombinationContent(prescriptions[index].combinationContent || '');
    setShowCombinationModal(true);
  };

  const saveCombination = () => {
    if (editingCombinationIndex !== null) {
      setPrescriptions(prev => {
        const updated = [...prev];
        updated[editingCombinationIndex] = {
          ...updated[editingCombinationIndex],
          isCombination: true,
          combinationName,
          combinationContent,
          medicine: combinationName,
        };
        return updated;
      });
    }
    setShowCombinationModal(false);
    setEditingCombinationIndex(null);
    setCombinationName('');
    setCombinationContent('');
  };
  
  // ===== SMART PARSING =====
  
  const handleSmartParse = (index: number) => {
    const rx = prescriptions[index];
    if (rx.medicine.trim()) {
      const parsed = parseSmartEntry(rx.medicine);
      setPrescriptions(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...parsed };
        return updated;
      });
    }
  };

  // ===== END CONSULTATION =====

  const handleEndConsultation = async () => {
    if (!currentVisit) return;

    // Save visit data
    const visitData = {
      patientId: patient!.id,
      visitDate: new Date(),
      visitNumber: currentVisit.visitNumber,
      chiefComplaint: caseText.split('\n')[0] || '',
      caseText,
      diagnosis,
      advice,
      testsRequired,
      nextVisit: nextVisit ? new Date(nextVisit) : undefined,
      prognosis,
      remarksToFrontdesk,
    };

    // TODO: API calls to save data
    // await saveVisit(visitData);
    // await savePrescriptions(currentVisit.id, patient!.id, prescriptions);
    // await updateFeeStatus(feeAmount, paymentStatus, discountPercent, discountReason);

    setShowEndConsultationModal(true);
  };

  // ===== MATERIA MEDICA SEARCH =====

  const searchMateriaMedica = async (query: string) => {
    setMateriaMedicaQuery(query);
    // TODO: Implement materia medica search
    // This would search against a materia medica database
  };

  // ===== PAST HISTORY =====

  const repeatPastVisit = (visit: Visit) => {
    if (visit.caseText) setCaseText(visit.caseText);
    if (visit.diagnosis) setDiagnosis(visit.diagnosis);
    if (visit.advice) setAdvice(visit.advice);
    setShowHistory(false);
  };

  // ===== RENDER =====

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* No Patient Selected - Show Search */}
        {!patient && (
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="text-center max-w-md w-full px-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Select Patient</h2>
                <p className="text-gray-600 mb-6">Search for a patient to begin case taking</p>
                
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by name, reg number, or mobile..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pl-10"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                      {searchResults.length > 0 ? (
                        searchResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectPatient(p)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{p.firstName} {p.lastName}</div>
                            <div className="text-sm text-gray-500">
                              Reg: {p.registrationNumber} • {p.mobile} • {p.age}yrs • {p.gender}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">No patients found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Selected - Show Doctor Panel */}
        {patient && (
          <>
            {/* Header with Patient Context */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <h1 className="text-xl font-bold text-gray-800">Doctor Panel</h1>
                  
                  {/* Patient Info Card */}
                  <div className="flex items-center gap-4 bg-blue-50 px-4 py-2 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-xs text-blue-600">
                        Reg: {patient.registrationNumber} | {patient.age}yrs | {patient.gender}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Mobile</p>
                      <p className="text-sm font-medium">{patient.mobile}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPatient(null);
                        router.push('/doctor-panel');
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Visit Stats */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">Visits: {pastVisits.length + 1}</span>
                    {pastVisits[0] && (
                      <span className="text-gray-500">
                        Last: {new Date(pastVisits[0].visitDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPharmacyQueue(!showPharmacyQueue)}
                    className="px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                  >
                    Pharmacy Queue ({3})
                  </button>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {showHistory ? 'Hide' : 'Show'} History
                  </button>
                  <button
                    onClick={() => setShowMateriaMedica(!showMateriaMedica)}
                    className="px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                  >
                    Materia Medica
                  </button>
                </div>
              </div>
            </header>

            <main className="flex gap-6 p-6">
              {/* Left Column - Case Taking */}
              <div className="flex-1 space-y-6">
                {/* Case Taking Section */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Case Taking</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsSystemAssist(!isSystemAssist)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          isSystemAssist 
                            ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        System Assist {isSystemAssist ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <textarea
                      ref={caseTextRef}
                      value={caseText}
                      onChange={handleCaseTextChange}
                      placeholder="Type case symptoms here...&#10;Press Enter for new symptom&#10;&#10;Example:&#10;Pain in knee joints&#10;Worse in cold weather&#10;Better by motion"
                      className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    
                    {isSystemAssist && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 font-medium mb-2">💡 Suggestions</p>
                        <ul className="text-sm text-amber-600 space-y-1">
                          <li>• Consider asking about timing (morning/evening)</li>
                          <li>• Explore aggravating/ameliorating factors</li>
                          <li>• Ask about appetite, thirst, sleep</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                {/* Prescription Table */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Prescription</h2>
                    <button
                      onClick={addEmptyPrescriptionRow}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    >
                      + Add Medicine
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                          <th className="pb-3 font-medium">Medicine</th>
                          <th className="pb-3 font-medium w-20">Potency</th>
                          <th className="pb-3 font-medium w-24">Quantity</th>
                          <th className="pb-3 font-medium w-24">Dose Form</th>
                          <th className="pb-3 font-medium w-24">Pattern</th>
                          <th className="pb-3 font-medium w-24">Frequency</th>
                          <th className="pb-3 font-medium w-28">Duration</th>
                          <th className="pb-3 font-medium w-16">Bottles</th>
                          <th className="pb-3 font-medium w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((rx, index) => (
                          <tr key={index} className="border-b border-gray-50">
                            <td className="py-2 relative">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={rx.medicine}
                                  onChange={(e) => handleMedicineSearchChange(index, e.target.value)}
                                  onKeyDown={(e) => handleMedicineKeyDown(e, index, prescriptions.length)}
                                  onFocus={() => {
                                    if (rx.medicine.trim().length > 0) {
                                      const suggestions = getAllMedicinesForAutocomplete(rx.medicine);
                                      setMedicineSuggestions(suggestions);
                                      setShowMedicineSuggestions(true);
                                    }
                                  }}
                                  onBlur={() => {
                                    // Delay hiding to allow click on suggestion
                                    setTimeout(() => {
                                      setShowMedicineSuggestions(false);
                                    }, 200);
                                  }}
                                  placeholder="Medicine name"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  autoComplete="off"
                                />
                                
                                {/* Autocomplete Dropdown */}
                                {showMedicineSuggestions && medicineSuggestions.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                    {medicineSuggestions.map((suggestion, i) => (
                                      <button
                                        key={i}
                                        onClick={() => selectMedicine(index, suggestion)}
                                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                          i === selectedSuggestionIndex ? 'bg-blue-50 text-blue-700' : ''
                                        }`}
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {/* Medicine action buttons */}
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={() => handleOpenCombination(index)}
                                  className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                  title="Create Combination"
                                >
                                  + Combo
                                </button>
                                <button
                                  onClick={() => handleSmartParse(index)}
                                  className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                  title="Smart Parse"
                                >
                                  Smart
                                </button>
                              </div>
                              {/* Combination indicator */}
                              {rx.isCombination && (
                                <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                  {rx.combinationName}
                                </div>
                              )}
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={rx.potency || ''}
                                onChange={(e) => updatePrescriptionRow(index, 'potency', e.target.value)}
                                onKeyDown={(e) => handlePotencyKeyDown(e, index, prescriptions.length)}
                                placeholder="200"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={rx.quantity}
                                onChange={(e) => updatePrescriptionRow(index, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <select
                                value={rx.doseForm || 'pills'}
                                onChange={(e) => updatePrescriptionRow(index, 'doseForm', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pills">Pills</option>
                                <option value="drops">Drops</option>
                                <option value="tablets">Tablets</option>
                                <option value="liquid">Liquid</option>
                                <option value="ointment">Ointment</option>
                                <option value="powder">Powder</option>
                              </select>
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={rx.dosePattern}
                                onChange={(e) => updatePrescriptionRow(index, 'dosePattern', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={rx.frequency}
                                onChange={(e) => updatePrescriptionRow(index, 'frequency', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={rx.duration || ''}
                                onChange={(e) => updatePrescriptionRow(index, 'duration', e.target.value)}
                                placeholder="7 days"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="number"
                                value={rx.bottles || 1}
                                onChange={(e) => updatePrescriptionRow(index, 'bottles', parseInt(e.target.value))}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => movePrescriptionRow(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => movePrescriptionRow(index, 'down')}
                                  disabled={index === prescriptions.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => removePrescriptionRow(index)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {prescriptions.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        No prescriptions added yet. Click &quot;+ Add Medicine&quot; to start.
                      </div>
                    )}
                  </div>
                </section>

                {/* Additional Notes */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Additional Notes</h2>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="Enter diagnosis"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tests Required</label>
                        <input
                          type="text"
                          value={testsRequired}
                          onChange={(e) => setTestsRequired(e.target.value)}
                          placeholder="Enter tests if any"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advice</label>
                      <textarea
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                        placeholder="Enter advice for the patient"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Visit</label>
                        <input
                          type="date"
                          value={nextVisit}
                          onChange={(e) => setNextVisit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or in (days)</label>
                        <input
                          type="number"
                          value={nextVisitDays}
                          onChange={(e) => setNextVisitDays(e.target.value)}
                          placeholder="e.g., 7"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prognosis</label>
                        <select
                          value={prognosis}
                          onChange={(e) => setPrognosis(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select prognosis</option>
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="guarded">Guarded</option>
                          <option value="poor">Poor</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks to Frontdesk</label>
                      <textarea
                        value={remarksToFrontdesk}
                        onChange={(e) => setRemarksToFrontdesk(e.target.value)}
                        placeholder="Any remarks for frontdesk (e.g., fee discussion, urgent follow-up)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column - Fee & Actions */}
              <div className="w-80 space-y-6">
                {/* Fee Section */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Fee Details</h2>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₹)</label>
                      <input
                        type="number"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                      <select
                        value={feeType}
                        onChange={(e) => setFeeType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="consultation">Consultation</option>
                        <option value="followup">Follow-up</option>
                        <option value="new">New Patient</option>
                        <option value="emergency">Emergency</option>
                        <option value="special">Special Consultation</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="exempt">Exempt</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount Reason</label>
                      <textarea
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder="Reason for discount"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </section>

                {/* Action Buttons */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 space-y-3">
                    <Button
                      onClick={() => setShowPrescriptionPreview(true)}
                      variant="secondary"
                      className="w-full"
                    >
                      Preview Prescription
                    </Button>
                    
                    <Button
                      onClick={() => {
                        if (confirm('Are you sure you want to end this consultation?')) {
                          handleEndConsultation();
                        }
                      }}
                      variant="primary"
                      className="w-full"
                    >
                      End Consultation
                    </Button>
                  </div>
                </section>

                {/* Past Visits */}
                {showHistory && pastVisits.length > 0 && (
                  <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="text-lg font-semibold text-gray-800">Past Visits</h2>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {pastVisits.map((visit, index) => (
                        <div
                          key={visit.id}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => repeatPastVisit(visit)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                Visit #{visit.visitNumber}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(visit.visitDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              {visit.diagnosis || 'No diagnosis'}
                            </span>
                          </div>
                          {visit.caseText && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {visit.caseText}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </main>
          </>
        )}
      </div>

      {/* Combination Medicine Modal */}
      {showCombinationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Create Combination Medicine</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Combination Name</label>
                <input
                  type="text"
                  value={combinationName}
                  onChange={(e) => setCombinationName(e.target.value)}
                  placeholder="e.g., Bioplasgen No. 10"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contents</label>
                <textarea
                  value={combinationContent}
                  onChange={(e) => setCombinationContent(e.target.value)}
                  placeholder="List the medicines and potencies in this combination"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowCombinationModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCombination}
                variant="primary"
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* End Consultation Modal */}
      {showEndConsultationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Consultation Completed!</h3>
            <p className="text-gray-600 mb-6">
              The patient&apos;s visit has been recorded successfully. The prescription has been sent to the pharmacy queue.
            </p>
            <Button
              onClick={() => {
                setShowEndConsultationModal(false);
                setPatient(null);
                router.push('/doctor-panel');
              }}
              variant="primary"
              className="w-full"
            >
              Start New Consultation
            </Button>
          </div>
        </div>
      )}

      {/* Prescription Preview Modal */}
      {showPrescriptionPreview && patient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Prescription Header */}
              <div className="border-b-2 border-gray-800 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Dr. Homeopathic Clinic</h2>
                <p className="text-gray-500">M.D. (Homeopathy)</p>
                <p className="text-gray-500">Reg. No.: HM-12345</p>
              </div>
              
              {/* Patient Info */}
              <div className="flex justify-between mb-6">
                <div>
                  <p className="font-bold">{patient.firstName} {patient.lastName}</p>
                  <p className="text-sm text-gray-500">Reg: {patient.registrationNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">IP No.: {currentVisit?.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              
              {/* Vital Signs Placeholder */}
              <div className="border border-gray-300 p-2 mb-6 text-sm">
                <div className="grid grid-cols-4 gap-4">
                  <div>BP: _____/_____</div>
                  <div>Pulse: _____</div>
                  <div>Temp: _____°F</div>
                  <div>Weight: _____kg</div>
                </div>
              </div>
              
              {/* Case Summary */}
              <div className="mb-6">
                <p className="font-bold border-b border-gray-300 mb-2">Clinical Notes</p>
                <p className="whitespace-pre-wrap">{caseText || 'No case notes recorded.'}</p>
              </div>
              
              {/* Prescription */}
              <div className="mb-6">
                <p className="font-bold border-b border-gray-300 mb-2">Rx</p>
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Medicine</th>
                      <th className="py-1">Potency</th>
                      <th className="py-1">Dose</th>
                      <th className="py-1">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx, index) => (
                      <tr key={index}>
                        <td className="py-1">
                          {rx.isCombination ? (
                            <span className="font-medium">{rx.combinationName}</span>
                          ) : (
                            rx.medicine
                          )}
                        </td>
                        <td className="py-1">{rx.potency || '-'}</td>
                        <td className="py-1">{rx.quantity} {rx.dosePattern}</td>
                        <td className="py-1">{rx.duration}</td>
                      </tr>
                    ))}
                    {prescriptions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">
                          No prescriptions added
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Advice */}
              {advice && (
                <div className="mb-6">
                  <p className="font-bold border-b border-gray-300 mb-2">Advice</p>
                  <p>{advice}</p>
                </div>
              )}
              
              {/* Next Visit */}
              {nextVisit && (
                <div className="mb-6">
                  <p className="font-medium">Next Visit: {new Date(nextVisit).toLocaleDateString()}</p>
                </div>
              )}
              
              {/* Footer */}
              <div className="border-t-2 border-gray-800 pt-4 mt-8">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Consultation Fee: ₹{feeAmount}</p>
                    {discountPercent && (
                      <p className="text-sm text-gray-500">Discount: {discountPercent}%</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Dr. Signature</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => setShowPrescriptionPreview(false)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => window.print()}
                variant="primary"
                className="flex-1"
              >
                Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
