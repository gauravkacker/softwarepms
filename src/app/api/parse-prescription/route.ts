import { NextRequest, NextResponse } from 'next/server';

interface ParsedPrescription {
  medicineName: string;
  potency: string;
  quantity: string;
  doseForm: string;
  dosePerIntake: string;
  frequency: string;
  pattern: string;
  duration: string;
  confidence: number;
}

async function parseWithAI(input: string, apiKey: string): Promise<ParsedPrescription | null> {
  const prompt = `You are a homeopathic prescription parser. Parse the following prescription text and extract the components.

Input: "${input}"

Extract and return ONLY a JSON object with these fields:
- medicineName: The medicine name (e.g., "Arsenicum Album", "Ars Alb", "Nux Vomica")
- potency: The potency (e.g., "1M", "200C", "30CH", "6X")
- quantity: The quantity with unit (e.g., "1/2oz", "2dr", "30ml", "1oz")
- doseForm: The form (e.g., "liquid", "pills", "drops", "tablets")
- dosePerIntake: Number of pills/drops per dose (e.g., "4", "2")
- frequency: How often (e.g., "TDS", "BD", "OD", "QID")
- pattern: The dose pattern (e.g., "1-1-1", "1-0-1", "6-6-6", "0-0-1")
- duration: How long (e.g., "4 weeks", "7 days", "1 month")
- confidence: Your confidence in the parsing (0-1)

Rules:
1. Medicine names can be abbreviated (e.g., "Ars alb" = "Arsenicum Album")
2. Potency formats: 1M, 10M, 30C, 200C, 30CH, 6X, etc.
3. Quantity can be fractions: "1/2oz", "1/4dr"
4. Pattern format is morning-afternoon-evening doses: "6-6-6" means 6 doses morning, 6 afternoon, 6 evening
5. Derive frequency from pattern: 1 non-zero = OD, 2 = BD, 3 = TDS, 4 = QID
6. If something is not found, use empty string ""

Return ONLY the JSON object, no explanation.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a precise prescription parser. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) return null;

    // Parse the JSON response
    const parsed = JSON.parse(content);
    return {
      medicineName: parsed.medicineName || '',
      potency: parsed.potency || '',
      quantity: parsed.quantity || '',
      doseForm: parsed.doseForm || '',
      dosePerIntake: parsed.dosePerIntake || '',
      frequency: parsed.frequency || '',
      pattern: parsed.pattern || '',
      duration: parsed.duration || '',
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    return null;
  }
}

// Fallback regex parser (improved version)
function parseWithRegex(input: string): ParsedPrescription | null {
  if (!input.trim()) return null;

  const text = input.trim().toLowerCase();
  const originalText = input.trim();

  // Extract duration
  const durationMatch = text.match(/(\d+)\s*(days?|weeks?|months?)/i);
  const duration = durationMatch ? `${durationMatch[1]} ${durationMatch[2]}` : '';

  // Extract quantity - support fractions
  let quantity = '';
  const fractionQuantityMatch = text.match(/(\d+)\/(\d+)\s*(dr|oz|ml)/i);
  if (fractionQuantityMatch) {
    quantity = `${fractionQuantityMatch[1]}/${fractionQuantityMatch[2]}${fractionQuantityMatch[3]}`;
  } else {
    const wholeQuantityMatch = text.match(/(?<!\/)(\d+)\s*(dr|oz|ml)\b/i);
    if (wholeQuantityMatch) {
      quantity = `${wholeQuantityMatch[1]}${wholeQuantityMatch[2]}`;
    }
  }

  // Extract dose form
  let doseForm = '';
  let dosePerIntake = '';
  const doseFormWithNumberMatch = text.match(/(\d+)\s*(pills?|drops?|tablets?|capsules?|powder|ointment|cream)\b/i);
  if (doseFormWithNumberMatch) {
    doseForm = doseFormWithNumberMatch[2].toLowerCase();
    dosePerIntake = doseFormWithNumberMatch[1];
  } else {
    const doseFormNoNumberMatch = text.match(/\b(pills?|drops?|tablets?|capsules?|liquid|powder|ointment|cream)\b/i);
    if (doseFormNoNumberMatch) {
      doseForm = doseFormNoNumberMatch[1].toLowerCase();
    }
  }

  // Extract pattern
  let frequency = '';
  let pattern = '';
  const customPatternMatch = text.match(/\b(\d+)-(\d+)-(\d+)\b/);
  if (customPatternMatch) {
    pattern = `${customPatternMatch[1]}-${customPatternMatch[2]}-${customPatternMatch[3]}`;
    const doses = [customPatternMatch[1], customPatternMatch[2], customPatternMatch[3]].map(Number);
    const nonZeroDoses = doses.filter(d => d > 0).length;
    if (nonZeroDoses === 1) frequency = 'OD';
    else if (nonZeroDoses === 2) frequency = 'BD';
    else if (nonZeroDoses === 3) frequency = 'TDS';
    else if (nonZeroDoses === 4) frequency = 'QID';
  }

  // Extract potency
  const potencyMatch = text.match(/\b(\d+)\s*(c|ch|m|x)\b/i);
  let potency = potencyMatch ? `${potencyMatch[1]}${potencyMatch[2].toUpperCase()}` : '';

  // Extract medicine name
  let medicineName = '';
  const words = originalText.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const lowerWord = word.toLowerCase();
    
    if (/^\d+[cchmx]$/i.test(word)) break;
    if (/^\d+\/\d+/.test(word)) break;
    if (/^\d+$/.test(word)) {
      const nextWord = words[i + 1]?.toLowerCase();
      if (nextWord && /^[cchmx]$/.test(nextWord)) break;
      const numVal = parseInt(word);
      if ([1, 3, 6, 12, 30, 60, 100, 200, 1000, 10000].includes(numVal) && !potency) break;
    }
    if (["dr", "oz", "ml", "pills", "drops", "tablets", "capsules", "liquid", "powder", "ointment", "cream"].includes(lowerWord)) break;
    if (["od", "bd", "tds", "tid", "qid", "hs", "sos", "weekly", "monthly"].includes(lowerWord)) break;
    if (["for", "days", "weeks", "months"].includes(lowerWord)) break;
    if (/^\d+-\d+-\d+$/.test(word)) break;
    
    medicineName = medicineName ? `${medicineName} ${word}` : word;
  }

  medicineName = medicineName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    medicineName,
    potency,
    quantity,
    doseForm,
    dosePerIntake,
    frequency,
    pattern,
    duration,
    confidence: 0.5,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, useAI, apiKey } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    // If AI is requested and API key is provided, use AI parsing
    if (useAI && apiKey) {
      const aiResult = await parseWithAI(input, apiKey);
      if (aiResult) {
        return NextResponse.json({ 
          success: true, 
          data: aiResult,
          method: 'ai'
        });
      }
    }

    // Fallback to regex parsing
    const regexResult = parseWithRegex(input);
    if (regexResult) {
      return NextResponse.json({ 
        success: true, 
        data: regexResult,
        method: 'regex'
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Could not parse prescription' 
    }, { status: 400 });

  } catch (error) {
    console.error('Parse prescription error:', error);
    return NextResponse.json({ 
      error: 'Failed to parse prescription' 
    }, { status: 500 });
  }
}
