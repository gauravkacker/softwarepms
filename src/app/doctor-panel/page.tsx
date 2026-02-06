"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// Types
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  regNumber: string;
  age?: number;
  sex?: string;
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

interface CaseNote {
  text: string;
  isVague?: boolean;
  suggestions?: string[];
}

// Main Component
export default function DoctorPanelPage() {
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  // State
  const [patient, setPatient] = useState<Patient | null>(null);
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
  
  // Modal states
  const [showEndConsultationModal, setShowEndConsultationModal] = useState(false);
  const [showSameDayReopenModal, setShowSameDayReopenModal] = useState(false);
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  
  // Refs
  const caseTextRef = useRef<HTMLTextAreaElement>(null);
  const medicineInputRef = useRef<HTMLInputElement>(null);

  // Load patient data
  const loadPatientData = useCallback(async (id: string) => {
    // TODO: Fetch patient, visits, and fee data from API
    // For now, using mock data
    const mockPatient: Patient = {
      id,
      firstName: 'John',
      lastName: 'Doe',
      mobile: '9876543210',
      regNumber: 'DK-001',
      age: 35,
      sex: 'Male',
    };
    setPatient(mockPatient);

    // Check for active visit
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
  }, []);

  useEffect(() => {
    if (patientIdFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // ===== COMBINATION MEDICINES =====

  const handleOpenCombination = (index: number) => {
    setEditingCombinationIndex(index);
    setCombinationName(prescriptions[index].combinationName || '');
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

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Doctor Panel</h1>
          <p className="text-gray-600">Please select a patient from the appointment list.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  Reg: {patient.regNumber} | {patient.age}yrs | {patient.sex}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="text-sm font-medium">{patient.mobile}</p>
              </div>
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
                    <th className="pb-3 font-medium w-24">Pattern</th>
                    <th className="pb-3 font-medium w-24">Frequency</th>
                    <th className="pb-3 font-medium w-28">Duration</th>
                    <th className="pb-3 font-medium w-16">Qty</th>
                    <th className="pb-3 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx, index) => (
                    <tr key={index} className="border-b border-gray-50">
                      <td className="py-2">
                        {rx.isCombination ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenCombination(index)}
                              className="text-blue-600 font-medium hover:underline"
                            >
                              {rx.combinationName}
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={rx.medicine}
                            onChange={(e) => updatePrescriptionRow(index, 'medicine', e.target.value)}
                            placeholder="Medicine name"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        {!rx.isCombination && (
                          <button
                            onClick={() => handleOpenCombination(index)}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            + Combination
                          </button>
                        )}
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          value={rx.potency || ''}
                          onChange={(e) => updatePrescriptionRow(index, 'potency', e.target.value)}
                          placeholder="200"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <select
                          value={rx.quantity}
                          onChange={(e) => updatePrescriptionRow(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="1dr">1dr</option>
                          <option value="2dr">2dr</option>
                          <option value="3dr">3dr</option>
                          <option value="4dr">4dr</option>
                          <option value="5dr">5dr</option>
                          <option value="1oz">1oz</option>
                          <option value="2oz">2oz</option>
                          <option value="1 bottle">1 bottle</option>
                          <option value="2 bottles">2 bottles</option>
                        </select>
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          value={rx.dosePattern || ''}
                          onChange={(e) => updatePrescriptionRow(index, 'dosePattern', e.target.value)}
                          placeholder="1-1-1"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <select
                          value={rx.frequency}
                          onChange={(e) => updatePrescriptionRow(index, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Alternate day">Alternate</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="SOS">SOS</option>
                          <option value="STAT">STAT</option>
                        </select>
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
                          min={1}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removePrescriptionRow(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {prescriptions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No prescriptions added yet.</p>
                  <p className="text-sm">Type medicine name or click &quot;Add Medicine&quot;</p>
                </div>
              )}
            </div>
          </section>

          {/* Additional Clinical Fields */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Additional Notes</h2>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Advice</label>
                <textarea
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="Enter advice for patient"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tests Required</label>
                <input
                  type="text"
                  value={testsRequired}
                  onChange={(e) => setTestsRequired(e.target.value)}
                  placeholder="Enter tests if any"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Visit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={nextVisitDays}
                    onChange={(e) => setNextVisitDays(e.target.value)}
                    placeholder="Days"
                    className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={nextVisit}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select unit</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prognosis</label>
                <select
                  value={prognosis}
                  onChange={(e) => setPrognosis(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select prognosis</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="guarded">Guarded</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks to Frontdesk</label>
                <input
                  type="text"
                  value={remarksToFrontdesk}
                  onChange={(e) => setRemarksToFrontdesk(e.target.value)}
                  placeholder="Internal note"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Past History & Materia Medica */}
        <div className="w-80 space-y-6">
          {/* Past History Panel */}
          {showHistory && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Past History</h3>
              </div>
              
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {pastVisits.map((visit, index) => (
                  <div key={visit.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        Visit #{visit.visitNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </span>
                    </div>
                    {visit.chiefComplaint && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">CC:</span> {visit.chiefComplaint}
                      </p>
                    )}
                    {visit.diagnosis && (
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">Dx:</span> {visit.diagnosis}
                      </p>
                    )}
                    <button
                      onClick={() => repeatPastVisit(visit)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Repeat this visit
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Materia Medica Search */}
          {showMateriaMedica && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Materia Medica</h3>
              </div>
              
              <div className="p-4">
                <input
                  type="text"
                  value={materiaMedicaQuery}
                  onChange={(e) => searchMateriaMedica(e.target.value)}
                  placeholder="Search symptoms or medicines..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
                />
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Search results would go here */}
                  <p className="text-sm text-gray-400 text-center py-4">
                    Type to search materia medica...
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Fee Panel */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Fee Details</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fee Amount</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fee Type</label>
                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="followup">Follow-up</option>
                  <option value="special">Special</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="discounted">Discounted</option>
                  <option value="waived">Waived</option>
                </select>
              </div>
              
              {paymentStatus === 'discounted' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount %</label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Reason</label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Discount reason"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* End Consultation Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-end gap-4">
          <button
            onClick={() => setShowSameDayReopenModal(true)}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleEndConsultation}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
          >
            End Consultation
          </button>
        </div>
      </div>

      {/* Combination Modal */}
      {showCombinationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Define Combination</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Combination Name
                </label>
                <input
                  type="text"
                  value={combinationName}
                  onChange={(e) => setCombinationName(e.target.value)}
                  placeholder="e.g., JointPain"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (free-text)
                </label>
                <textarea
                  value={combinationContent}
                  onChange={(e) => setCombinationContent(e.target.value)}
                  placeholder="e.g., Arnica + Rhus tox + Bryonia"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCombinationModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCombination}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Queue Panel */}
      {showPharmacyQueue && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l border-gray-200 z-40">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Pharmacy Queue</h3>
            <button
              onClick={() => setShowPharmacyQueue(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Mock pharmacy items */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">John Doe</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending</span>
              </div>
              <p className="text-xs text-gray-600">Arnica 200, Rhus tox 200</p>
              <div className="flex gap-2 mt-2">
                <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Priority</button>
                <button className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Stop</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function (would be imported in real implementation)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
