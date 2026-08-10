import { GoogleGenAI, Type } from '@google/genai';
import { getAshaAlertsAsync, getAshaAlerts } from './alertsService';
import fs from 'fs';
import path from 'path';

export interface VillageHealthAdvisory {
  id: string;
  generatedAt: string;
  district: string;
  language: string;
  languageName: string;
  title: string;
  subtitle: string;
  topTrends: Array<{
    symptom: string;
    caseCount: number;
    urgencyLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
    description: string;
  }>;
  preventiveTips: Array<{
    topic: string;
    actionableAdvice: string;
    sourceCitation: string;
  }>;
  schemeAnnouncements: Array<{
    schemeName: string;
    benefitSummary: string;
    eligibilityNotice: string;
    actionRequired: string;
    officialUrl: string;
  }>;
  emergencyContact: {
    phcName: string;
    ambulanceNumber: string;
    ashaWorkerContact: string;
  };
  summaryNoticeForBoard: string;
}

export async function generateVillageAdvisory(
  districtInput: string = 'Pune Rural (Khed Sector)',
  requestedLanguage: string = 'en'
): Promise<VillageHealthAdvisory> {
  let alerts = await getAshaAlertsAsync();
  if (!alerts || alerts.length === 0) {
    alerts = getAshaAlerts();
  }

  const symptomFrequency: Record<string, number> = {};
  alerts.forEach(a => {
    a.symptomTags?.forEach(tag => {
      symptomFrequency[tag] = (symptomFrequency[tag] || 0) + 1;
    });
  });

  const sortedSymptoms = Object.entries(symptomFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([sym, count]) => `${sym} (${count} recent cases)`);

  const symptomSummary = sortedSymptoms.length > 0
    ? sortedSymptoms.join(', ')
    : 'Seasonal Respiratory Symptoms, Infant Fever, Acute Gastroenteritis';

  let corpusText = '';
  try {
    const imciPath = path.join(process.cwd(), 'data', 'triage_corpus', 'who_imci_guidelines.md');
    const ayushmanPath = path.join(process.cwd(), 'data', 'triage_corpus', 'ayushman_bharat_handbook.md');
    if (fs.existsSync(imciPath)) corpusText += fs.readFileSync(imciPath, 'utf8') + '\n\n';
    if (fs.existsSync(ayushmanPath)) corpusText += fs.readFileSync(ayushmanPath, 'utf8') + '\n\n';
  } catch (err) {
    console.warn('Could not read corpus files directly, using embedded RAG corpus:', err);
  }

  if (!corpusText) {
    corpusText = `
WHO IMCI Guidelines Section 4.2: Danger Signs (cough, breathing difficulty, high fever, diarrhea, dehydration).
ICMR/NHM Protocols Section 2: Adult Emergency Red Flags (chest pain, stroke FAST signs, severe dyspnea, maternal hemorrhage).
    `;
  }

  let schemesJson = [];
  try {
    const schemesPath = path.join(process.cwd(), 'data', 'schemes.json');
    if (fs.existsSync(schemesPath)) {
      schemesJson = JSON.parse(fs.readFileSync(schemesPath, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not read schemes.json directly:', err);
  }

  const apiKey = process.env.GEMINI_API_KEY || (typeof import.meta !== 'undefined' && (import.meta as any).env && ((import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY));
  if (!apiKey) {
    return createDefaultAdvisory(districtInput, requestedLanguage, sortedSymptoms);
  }

  const ai = new GoogleGenAI({ apiKey });

  const langNames: Record<string, string> = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    mr: 'Marathi (मराठी)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
    bn: 'Bengali (বাংলা)',
    gu: 'Gujarati (ગુજરાતી)'
  };

  const targetLangName = langNames[requestedLanguage] || 'English';

  const prompt = `
You are an expert Public Health Officer generating a weekly "Village Health Advisory Noticeboard Poster" for ASHA workers and PHC noticeboards in India.

Context & Local Data:
- District/Sector: ${districtInput}
- Real Recent Local Symptom Escalations Aggregated from Field Triage: ${symptomSummary}
- Grounded Health Guidelines RAG Corpus:
${corpusText}
- Active Government Schemes Data:
${JSON.stringify(schemesJson, null, 2)}

Target Audience & Language:
- Target Language: ${targetLangName} (All text in JSON output MUST be fully translated into ${targetLangName}).
- Literacy Level: Low-literacy rural village audience. Use short, simple sentences, clear bullet points, and plain actionable medical terms.

Return a strictly formatted JSON object with:
- title: Short, authoritative bulletin title in ${targetLangName}
- subtitle: Subtitle with district name and current week date
- topTrends: Array of 2-3 trending health conditions in the village this week with symptom name, case count estimate, urgencyLevel ('CRITICAL', 'HIGH', or 'MODERATE'), and simple 1-sentence description.
- preventiveTips: Array of 2-3 preventive care tips directly grounded in the provided WHO IMCI / ICMR corpus, relevant to the trending symptoms. Each MUST include a 'sourceCitation' field (e.g., "Source: WHO IMCI Guidelines, Section 4.2 — Danger Signs").
- schemeAnnouncements: Array of 2 active government schemes (e.g. PM-JAY card registration, JSY maternity benefit claims) with benefit summary, simple eligibility notice, action required, and official source URL.
- emergencyContact: Object with phcName, ambulanceNumber ("108"), and ashaWorkerContact ("Local ASHA / ANM Field Desk").
- summaryNoticeForBoard: A short 2-3 sentence plain-language summary to be read aloud or pinned on noticeboard.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            topTrends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symptom: { type: Type.STRING },
                  caseCount: { type: Type.NUMBER },
                  urgencyLevel: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['symptom', 'caseCount', 'urgencyLevel', 'description']
              }
            },
            preventiveTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  actionableAdvice: { type: Type.STRING },
                  sourceCitation: { type: Type.STRING }
                },
                required: ['topic', 'actionableAdvice', 'sourceCitation']
              }
            },
            schemeAnnouncements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  schemeName: { type: Type.STRING },
                  benefitSummary: { type: Type.STRING },
                  eligibilityNotice: { type: Type.STRING },
                  actionRequired: { type: Type.STRING },
                  officialUrl: { type: Type.STRING }
                },
                required: ['schemeName', 'benefitSummary', 'eligibilityNotice', 'actionRequired', 'officialUrl']
              }
            },
            emergencyContact: {
              type: Type.OBJECT,
              properties: {
                phcName: { type: Type.STRING },
                ambulanceNumber: { type: Type.STRING },
                ashaWorkerContact: { type: Type.STRING }
              },
              required: ['phcName', 'ambulanceNumber', 'ashaWorkerContact']
            },
            summaryNoticeForBoard: { type: Type.STRING }
          },
          required: ['title', 'subtitle', 'topTrends', 'preventiveTips', 'schemeAnnouncements', 'emergencyContact', 'summaryNoticeForBoard']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      id: 'advisory_' + Date.now(),
      generatedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      district: districtInput,
      language: requestedLanguage,
      languageName: targetLangName,
      title: parsed.title || 'Weekly Village Health Advisory Bulletin',
      subtitle: parsed.subtitle || `Primary Health Centre Notice • ${districtInput}`,
      topTrends: parsed.topTrends || [],
      preventiveTips: parsed.preventiveTips || [],
      schemeAnnouncements: parsed.schemeAnnouncements || [],
      emergencyContact: parsed.emergencyContact || {
        phcName: 'Primary Health Centre (PHC) - Sector Hub',
        ambulanceNumber: '108',
        ashaWorkerContact: 'Local ASHA & ANM Health Desk'
      },
      summaryNoticeForBoard: parsed.summaryNoticeForBoard || 'Please visit the nearest Primary Health Centre for free health checkups and medicines.'
    };
  } catch (err) {
    console.error('Error generating advisory with Gemini API:', err);
    return createDefaultAdvisory(districtInput, requestedLanguage, sortedSymptoms);
  }
}

function createDefaultAdvisory(
  district: string,
  lang: string,
  symptoms: string[]
): VillageHealthAdvisory {
  return {
    id: 'advisory_' + Date.now(),
    generatedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    district,
    language: lang,
    languageName: lang === 'hi' ? 'Hindi' : lang === 'mr' ? 'Marathi' : 'English',
    title: lang === 'hi' ? 'साप्ताहिक ग्राम स्वास्थ्य सलाह' : lang === 'mr' ? 'साप्ताहिक ग्राम आरोग्य सल्ला पत्र' : 'Weekly Village Health Advisory Notice',
    subtitle: `Government PHC Noticeboard • ${district}`,
    topTrends: [
      {
        symptom: symptoms[0] || 'High Fever & Cough in Children',
        caseCount: 4,
        urgencyLevel: 'HIGH',
        description: 'Increased reports of seasonal viral fever and fast breathing among infants and toddlers.'
      },
      {
        symptom: symptoms[1] || 'Severe Abdominal Pain & Vomiting',
        caseCount: 2,
        urgencyLevel: 'CRITICAL',
        description: 'Isolated severe gastroenteritis cases requiring immediate oral rehydration and medical evaluation.'
      }
    ],
    preventiveTips: [
      {
        topic: 'Child Respiratory Danger Signs (Pneumonia Warning)',
        actionableAdvice: 'Watch for fast breathing (>50 breaths/min in infants) or lower chest indrawing when breathing in. Give oral fluids and take the child to the nearest PHC immediately.',
        sourceCitation: 'Source: WHO IMCI Guidelines, Section 4.2 — Danger Signs & Respiratory Triage'
      },
      {
        topic: 'Diarrhea Care & Dehydration Prevention',
        actionableAdvice: 'Prepare ORS solution in 1 liter of clean water. Administer continuously alongside Zinc tablets (20 mg daily for 14 days). Never stop breastfeeding during diarrhea.',
        sourceCitation: 'Source: ICMR & WHO IMCI Diarrhea Management Protocols'
      }
    ],
    schemeAnnouncements: [
      {
        schemeName: 'Ayushman Bharat (PM-JAY)',
        benefitSummary: '₹5 Lakh free hospital coverage per family per year.',
        eligibilityNotice: 'BPL / Antyodaya Ration Card holders and household income < ₹1.2 Lakh/year.',
        actionRequired: 'Bring Ration Card and Aadhaar to local PHC desk to register your Ayushman Golden Card.',
        officialUrl: 'https://pmjay.gov.in'
      },
      {
        schemeName: 'Janani Suraksha Yojana (JSY)',
        benefitSummary: '₹1,400 direct cash transfer for pregnant mothers delivering at public hospital.',
        eligibilityNotice: 'Pregnant women aged 19+ registered with local ASHA worker.',
        actionRequired: 'Complete early pregnancy registration at Anganwadi / PHC within 12 weeks.',
        officialUrl: 'https://nhm.gov.in'
      }
    ],
    emergencyContact: {
      phcName: 'Primary Health Centre (PHC) Village Hub',
      ambulanceNumber: '108',
      ashaWorkerContact: 'District ASHA / ANM Emergency Line'
    },
    summaryNoticeForBoard: 'Attention Villagers: Free health checkups, essential medicines, and maternal care services are available daily at your local Primary Health Centre. Call 108 immediately in case of medical emergencies.'
  };
}
