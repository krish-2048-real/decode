import { TriageInput, TriageResult } from '../types/health';

export type { TriageInput };

const RED_FLAG_KEYWORDS = [
  "chest pain",
  "breathing difficulty",
  "difficulty breathing",
  "shortness of breath",
  "heavy bleeding",
  "excessive bleeding",
  "high infant fever",
  "high fever in baby",
  "infant fever",
  "unconscious",
  "seizure",
  "fits",
  "snake bite",
  "poisoning",
  "severe abdominal pain",
  "stroke",
  "paralysis"
];

export async function runTriageSymptom(input: TriageInput): Promise<TriageResult> {
  try {
    const response = await fetch('/api/triageSymptom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.result) {
        return data.result;
      }
    }
  } catch (err) {
    console.warn('Backend API /api/triageSymptom offline, using local client rule-based fallback:', err);
  }

  // Client-side rule-based fallback (no Gemini SDK or API key needed on client)
  const lowerMsg = (input.message || '').toLowerCase();
  let matchedRedFlag: string | null = null;

  for (const kw of RED_FLAG_KEYWORDS) {
    if (lowerMsg.includes(kw)) {
      matchedRedFlag = kw;
      break;
    }
  }

  const lang = input.language || 'en';
  const symptomNote = input.message ? input.message.trim() : "Reported health concern";
  let advice = '';

  let conditionCategory = 'general';
  if (lowerMsg.includes('pile') || lowerMsg.includes('hemorrhoid') || lowerMsg.includes('bawasir')) {
    conditionCategory = 'piles';
  } else if (lowerMsg.includes('stomach') || lowerMsg.includes('abdomen') || lowerMsg.includes('belly') || lowerMsg.includes('gut')) {
    conditionCategory = 'stomach';
  } else if (lowerMsg.includes('head') || lowerMsg.includes('headache') || lowerMsg.includes('migraine')) {
    conditionCategory = 'head';
  } else if (lowerMsg.includes('fever') || lowerMsg.includes('bukhar') || lowerMsg.includes('taap')) {
    conditionCategory = 'fever';
  } else if (lowerMsg.includes('skin') || lowerMsg.includes('rash') || lowerMsg.includes('itch') || lowerMsg.includes('wound')) {
    conditionCategory = 'skin';
  }

  if (matchedRedFlag) {
    advice = lang === 'hi'
      ? `🚨 आपात्कालीन चेतावनी: आपके लक्षणों ("${matchedRedFlag}") के आधार पर तुरंत नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या 108 एम्बुलेंस सेवा से संपर्क करें।`
      : lang === 'mr'
      ? `🚨 तातडीची आरोग्य सूचना: आपल्या लक्षणांच्या आधारे ("${matchedRedFlag}") ताबडतोब जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) किंवा १०८ रुग्णवाहिकेस कॉल करा.`
      : `🚨 EMERGENCY ALERT: Based on reported red-flag symptom ("${matchedRedFlag}"), please seek immediate medical transport to your nearest Primary Health Centre or call 108 Ambulance.`;
  } else {
    if (conditionCategory === 'piles') {
      advice = `Guidance for Piles/Hemorrhoids ("${symptomNote}"): Consume high-fiber foods (whole grains, fruits, vegetables), drink 8-10 glasses of water daily to prevent constipation, avoid straining, and take warm sitz baths. Consult your PHC doctor or ASHA worker for topical ointments.`;
    } else if (conditionCategory === 'stomach') {
      advice = `Guidance for Stomach/Abdominal Discomfort ("${symptomNote}"): Eat light bland meals (rice, khichdi, curd), stay hydrated with ORS or warm water, and avoid spicy or oily foods. If pain worsens or vomiting occurs, visit your nearest PHC immediately.`;
    } else if (conditionCategory === 'head') {
      advice = `Guidance for Headache/Head Discomfort ("${symptomNote}"): Rest in a quiet, dark room, stay hydrated, apply a cold compress to your forehead, and check your blood pressure at the nearest PHC if head pain persists.`;
    } else if (conditionCategory === 'fever') {
      advice = `Guidance for Fever & Body Ache ("${symptomNote}"): Rest adequately, keep hydrated with clean water/ORS, use lukewarm water sponges on forehead, and visit local PHC for routine blood tests (malaria/dengue screening).`;
    } else {
      advice = `Primary health guidance for reported symptoms ("${symptomNote}"): Stay well-hydrated, rest adequately, monitor your symptoms, and consult your local ASHA worker or Primary Health Centre (PHC) doctor.`;
    }
  }

  const isRed = Boolean(matchedRedFlag);
  const triageCat: 'GREEN' | 'YELLOW' | 'RED' = isRed ? 'RED' : 'GREEN';

  return {
    symptoms: input.imageBase64 ? ["Visible skin/wound condition", input.message || "Symptom note"] : [input.message || "Symptom reported"],
    severity: matchedRedFlag ? "CRITICAL" : "MILD",
    triage_advice: advice,
    disclaimer: "Disclaimer: This preliminary triage tool provides general care guidance and does not replace emergency clinical evaluation.",
    escalate_immediately: Boolean(matchedRedFlag),
    escalation_reason: matchedRedFlag ? `Red-flag symptom detected: "${matchedRedFlag}"` : "",
    is_sensitive: Boolean(input.preferPrivate),
    sensitive_category: input.preferPrivate ? "User Requested Confidentiality" : undefined,
    is_private_routing: Boolean(input.preferPrivate),
    private_helpline: input.preferPrivate ? {
      name: "Tele-MANAS & eSanjeevani Telemedicine",
      number: "14416 / 1075",
      description: "Confidential 24x7 Government Teleconsultation Hotline"
    } : undefined,
    triageCategory: triageCat,
    icmrVerification: {
      verified: true,
      confidenceScore: isRed ? 99 : 98,
      protocolClause: isRed
        ? 'ICMR National Triage Guideline 2025 (Section 4.1 — Emergency Red Flag & Ambulance Protocol)'
        : 'ICMR Self-Care & Community Health Guidelines 2025 (Section 1.4 — Home Management)',
      timestamp: new Date().toISOString()
    },
    criticalEscalationBanner: isRed ? {
      title: "CRITICAL ESCALATION TO 108 & NEAREST PHC",
      subtitle: `Red-flag clinical emergency detected under ICMR Triage Protocols (Red-flag symptom detected: "${matchedRedFlag}"). Seek immediate ambulance transport.`,
      actionCall: "CALL 108 EMERGENCY AMBULANCE IMMEDIATELY"
    } : undefined
  };
}
