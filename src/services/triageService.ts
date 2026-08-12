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
  let advice = '';

  if (lang === 'hi') {
    advice = matchedRedFlag
      ? `🚨 आपात्कालीन चेतावनी: आपके लक्षणों ("${matchedRedFlag}") के आधार पर तुरंत नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या 108 एम्बुलेंस सेवा से संपर्क करें।`
      : `नमस्ते! स्वास्थ्य सलाह: प्रचुर मात्रा में स्वच्छ उबला पानी पिएं, विश्राम करें और नजदीकी पीएचसी (PHC) में आशा कार्यकर्ता से परामर्श लें।`;
  } else if (lang === 'mr') {
    advice = matchedRedFlag
      ? `🚨 तातडीची आरोग्य सूचना: आपल्या लक्षणांच्या आधारे ("${matchedRedFlag}") ताबडतोब जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) किंवा १०८ रुग्णवाहिकेस कॉल करा.`
      : `नमस्ते! आरोग्य सल्ला: विश्रांती घ्या, भरपूर स्वच्छ उकळलेले पाणी प्या आणि जवळच्या प्राथमिक आरोग्य केंद्रातील आशा सेवियेशी संपर्क साधा.`;
  } else {
    advice = matchedRedFlag
      ? `🚨 EMERGENCY ALERT: Based on reported red-flag symptom ("${matchedRedFlag}"), please seek immediate medical transport to your nearest Primary Health Centre or call 108 Ambulance.`
      : `Namaste. For your reported symptoms, please stay hydrated with clean water, rest adequately, and consult your local ASHA worker or Primary Health Centre (PHC).`;
  }

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
    } : undefined
  };
}
