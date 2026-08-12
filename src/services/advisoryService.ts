import { getAshaAlertsAsync, getAshaAlerts } from './alertsService';

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
  try {
    const response = await fetch('/api/generateAdvisory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        district: districtInput,
        language: requestedLanguage
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.advisory) {
        return data.advisory;
      }
    }
  } catch (err) {
    console.warn('Backend API /api/generateAdvisory unavailable, using local client fallback:', err);
  }

  // Client-side default fallback (no Gemini SDK or API key required on client)
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

  return createDefaultAdvisory(districtInput, requestedLanguage, sortedSymptoms);
}

function createDefaultAdvisory(
  district: string,
  lang: string,
  symptoms: string[]
): VillageHealthAdvisory {
  const langNames: Record<string, string> = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    mr: 'Marathi (मराठी)',
    ta: 'Tamil (தமிழ்)'
  };

  return {
    id: 'advisory_' + Date.now(),
    generatedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    district,
    language: lang,
    languageName: langNames[lang] || 'English',
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
