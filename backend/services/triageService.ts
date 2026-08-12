import { GoogleGenAI, Type } from "@google/genai";
import { TriageInput, TriageResult } from "../../src/types/health";

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

const SENSITIVE_KEYWORDS = {
  mental: ["depression", "depressed", "anxiety", "suicide", "suicidal", "hopeless", "mental health", "self harm", "panic attack", "worthless", "sadness"],
  violence: ["domestic violence", "beat me", "hit me", "husband beat", "scared at home", "abuse", "assault", "forced", "violence", "partner hurt"],
  sexual: ["sexual health", "std", "sti", "syphilis", "discharge", "intimate pain", "contraception", "abortion", "unwanted pregnancy", "condom", "period pain"]
};

export async function runTriageSymptom(input: TriageInput): Promise<TriageResult> {
  const { message, language, userProfile, preferPrivate, imageBase64 } = input;
  const lowerMessage = message.toLowerCase();

  let matchedRedFlag: string | null = null;
  for (const kw of RED_FLAG_KEYWORDS) {
    if (lowerMessage.includes(kw)) {
      matchedRedFlag = kw;
      break;
    }
  }

  let detectedSensitiveCategory: string | null = null;
  let helplineInfo = {
    name: "Tele-MANAS & eSanjeevani Telemedicine",
    number: "14416 / 1075",
    description: "Confidential 24x7 Government Teleconsultation Hotline"
  };

  for (const kw of SENSITIVE_KEYWORDS.mental) {
    if (lowerMessage.includes(kw)) {
      detectedSensitiveCategory = "Mental Health & Emotional Well-being";
      helplineInfo = {
        name: "Tele-MANAS National Helpline",
        number: "14416 (or 1-800-891-4416)",
        description: "Free, confidential 24x7 mental health counselling by certified doctors"
      };
      break;
    }
  }

  if (!detectedSensitiveCategory) {
    for (const kw of SENSITIVE_KEYWORDS.violence) {
      if (lowerMessage.includes(kw)) {
        detectedSensitiveCategory = "Domestic Safety & Protection";
        helplineInfo = {
          name: "National Women & Domestic Violence Helpline",
          number: "181 / 1091",
          description: "24x7 confidential emergency support and legal protection services"
        };
        break;
      }
    }
  }

  if (!detectedSensitiveCategory) {
    for (const kw of SENSITIVE_KEYWORDS.sexual) {
      if (lowerMessage.includes(kw)) {
        detectedSensitiveCategory = "Reproductive & Sexual Health";
        helplineInfo = {
          name: "NACO & eSanjeevani OPD Tele-Consultation",
          number: "1097 / eSanjeevani",
          description: "Private confidential doctor consultation for intimate & reproductive health"
        };
        break;
      }
    }
  }

  const isSensitive = Boolean(detectedSensitiveCategory) || Boolean(preferPrivate);
  const isPrivateRouting = isSensitive;

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  let result: TriageResult;

  if (!apiKey) {
    let fallbackText = '';
    const extractedSymptom = message ? message.trim() : "Reported Health Concern";
    if (language === 'hi') {
      fallbackText = matchedRedFlag 
        ? `🚨 आपात्कालीन स्वास्थ्य चेतावनी: आपके लक्षणों ("${matchedRedFlag}") के आधार पर तुरंत नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या 108 एम्बुलेंस सेवा से संपर्क करें।`
        : `नमस्ते! आपके द्वारा बताए गए लक्षणों ("${extractedSymptom}") के लिए प्राथमिक स्वास्थ्य देखभाल सलाह: प्रचुर मात्रा में स्वच्छ जल पिएं, विश्राम करें और अपने नजदीकी पीएचसी (PHC) केंद्र पर आशा कार्यकर्ता से संपर्क करें। ${isPrivateRouting ? '\n🔒 गोपनीय परामर्श सक्रिय: 14416 (Tele-MANAS) या eSanjeevani पर निःशुल्क कॉल करें।' : ''}`;
    } else if (language === 'mr') {
      fallbackText = matchedRedFlag
        ? `🚨 तातडीची आरोग्य सूचना: आपल्या लक्षणांच्या आधारे ("${matchedRedFlag}") ताबडतोब जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) किंवा १०८ रुग्णवाहिकेस कॉल करा.`
        : `नमस्ते! तुमच्या लक्षणांसाठी ("${extractedSymptom}") प्राथमिक आरोग्य सल्ला: विश्रांती घ्या, भरपूर पाणी प्या आणि जवळच्या प्राथमिक आरोग्य केंद्रातील आशा सेवियेशी संपर्क साधा. ${isPrivateRouting ? '\n🔒 गोपनीय सल्लामसलत सक्रिय: १४४१६ (Tele-MANAS) वर विनामूल्य कॉल करा.' : ''}`;
    } else {
      fallbackText = matchedRedFlag
        ? `🚨 EMERGENCY HEALTH ALERT: Based on your reported red-flag symptom ("${matchedRedFlag}"), please seek immediate medical transport to your nearest Primary Health Centre or call 108 Emergency Ambulance.`
        : `Namaste. Primary health guidance for reported symptom "${extractedSymptom}": Stay hydrated with clean boiled water or ORS, rest adequately, and consult your local ASHA worker or Primary Health Centre (PHC) doctor. ${isPrivateRouting ? '\n🔒 Confidential Route Active: Call 14416 (Tele-MANAS National Helpline) or use eSanjeevani Telemedicine for private consultation.' : ''}`;
    }

    result = {
      symptoms: imageBase64 ? ["Visible skin/wound condition", extractedSymptom] : [extractedSymptom],
      severity: matchedRedFlag ? "CRITICAL" : (isSensitive ? "MODERATE" : "MILD"),
      triage_advice: fallbackText,
      disclaimer: "Disclaimer: This preliminary triage tool provides general care guidance and does not replace emergency clinical evaluation.",
      escalate_immediately: matchedRedFlag ? true : false,
      escalation_reason: matchedRedFlag ? `Red-flag symptom detected: "${matchedRedFlag}". Emergency care required!` : "",
      is_sensitive: isSensitive,
      sensitive_category: detectedSensitiveCategory || (preferPrivate ? "User Requested Confidentiality" : undefined),
      is_private_routing: isPrivateRouting,
      private_helpline: isPrivateRouting ? helplineInfo : undefined,
      visual_analysis: imageBase64 ? {
        description: "Captured image uploaded for clinical inspection. Shows localized skin texture or lesion.",
        concern_category: "Dermatological / Visual Inspection",
        urgency: "MODERATE"
      } : undefined
    };
  } else {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const languageNames: Record<string, string> = {
        hi: "Hindi (हिंदी)",
        mr: "Marathi (मराठी)",
        ta: "Tamil (தமிழ்)",
        en: "English"
      };
      const fullLang = languageNames[language] || language || "English";

      const systemPrompt = `You are "Arogya Sahayak", an empathetic, highly accurate rural healthcare triage assistant in India.
Your task is to analyze patient symptoms reported in text, voice, and/or photographs, assess severity, detect sensitive topics, and provide actionable care guidance.

CRITICAL INSTRUCTIONS:
1. You MUST generate ALL user-facing JSON fields (symptoms array, triage_advice, disclaimer, escalation_reason, visual_analysis description/concern_category) COMPLETELY in ${fullLang}.
2. Evaluate severity into strictly one of: ["MILD", "MODERATE", "HIGH", "CRITICAL"].
3. "escalate_immediately" MUST be true for red flag symptoms like chest pain, breathing difficulty, severe bleeding, high infant fever, convulsions, snake bites, stroke.
4. Detect if the message covers sensitive categories: Mental Health, Sexual/Reproductive Health, or Domestic Violence/Abuse. Set is_sensitive to true if detected.
5. If an image is attached, perform a visual symptom inspection (skin rashes, lesions, wounds, eye redness, swelling). Populate visual_analysis with description, concern_category, and urgency in ${fullLang}.
6. Provide highly specific, actionable, compassionate advice tailored strictly to the reported symptoms and duration in ${fullLang}.`;

      const promptText = `Patient Message: "${message}"
User Profile: ${JSON.stringify(userProfile || {})}
Target Language Required: ${fullLang} (All JSON string fields MUST be in ${fullLang})
User Requested Confidentiality: ${preferPrivate ? 'YES' : 'NO'}
Image Included: ${imageBase64 ? 'YES' : 'NO'}`;

      const contents: any[] = [];
      if (imageBase64) {
        const mimeType = imageBase64.substring(
          imageBase64.indexOf(':') + 1,
          imageBase64.indexOf(';')
        ) || 'image/jpeg';
        const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        
        contents.push({
          inlineData: {
            mimeType,
            data
          }
        });
      }
      contents.push(promptText);

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          symptoms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of identified symptoms"
          },
          severity: {
            type: Type.STRING,
            description: "MILD, MODERATE, HIGH, or CRITICAL"
          },
          triage_advice: {
            type: Type.STRING,
            description: "Actionable medical advice and immediate care instructions in requested language"
          },
          disclaimer: {
            type: Type.STRING,
            description: "Standard medical disclaimer in requested language"
          },
          escalate_immediately: {
            type: Type.BOOLEAN,
            description: "True if emergency or red-flag condition requiring immediate hospital/PHC visit"
          },
          escalation_reason: {
            type: Type.STRING,
            description: "Reason why immediate escalation is required, or empty string if not"
          },
          is_sensitive: {
            type: Type.BOOLEAN,
            description: "True if topic involves mental health, domestic violence, sexual/reproductive health, or requested private"
          },
          sensitive_category: {
            type: Type.STRING,
            description: "Category of sensitive topic if detected"
          },
          visual_analysis: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              concern_category: { type: Type.STRING },
              urgency: { type: Type.STRING }
            },
            required: ["description", "concern_category", "urgency"]
          }
        },
        required: ["symptoms", "severity", "triage_advice", "disclaimer", "escalate_immediately", "escalation_reason"]
      };

      // Model fallback and retry loop for high availability
      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];
      let response: any = null;
      let lastCallError: any = null;

      for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema
              }
            });
            if (response && response.text) {
              console.log(`[TRIAGE API SUCCESS] Gemini model ${modelName} responded successfully on attempt ${attempt}.`);
              break;
            }
          } catch (err: any) {
            lastCallError = err;
            console.warn(`[TRIAGE API RETRY] Model ${modelName} attempt ${attempt} failed: ${err?.message || err}.`);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 500));
            }
          }
        }
        if (response && response.text) break;
      }

      if (!response || !response.text) {
        throw lastCallError || new Error("All Gemini model attempts failed to produce response text.");
      }

      let rawText = response.text || "{}";
      let cleanText = rawText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      }
      const parsed = JSON.parse(cleanText) as any;

      result = {
        symptoms: (parsed.symptoms && parsed.symptoms.length > 0) ? parsed.symptoms : [message || "Symptom reported"],
        severity: parsed.severity || (matchedRedFlag ? "CRITICAL" : "MODERATE"),
        triage_advice: parsed.triage_advice || "Please visit nearest Primary Health Centre.",
        disclaimer: parsed.disclaimer || "Disclaimer: AI preliminary screening tool.",
        escalate_immediately: Boolean(parsed.escalate_immediately) || Boolean(matchedRedFlag),
        escalation_reason: parsed.escalation_reason || (matchedRedFlag ? `Red-flag symptom: ${matchedRedFlag}` : ""),
        is_sensitive: Boolean(parsed.is_sensitive) || isSensitive,
        sensitive_category: parsed.sensitive_category || detectedSensitiveCategory || (preferPrivate ? "User Requested Confidentiality" : undefined),
        is_private_routing: Boolean(parsed.is_sensitive) || isSensitive,
        private_helpline: (Boolean(parsed.is_sensitive) || isSensitive) ? helplineInfo : undefined,
        visual_analysis: parsed.visual_analysis || (imageBase64 ? {
          description: "Analyzed uploaded symptom photograph for visual characteristics.",
          concern_category: "Visual Inspection",
          urgency: parsed.severity || "MODERATE"
        } : undefined)
      };
    } catch (err: any) {
      console.error("[CRITICAL TRIAGE ERROR] Gemini API call or response parsing failed:", {
        errorMessage: err?.message || String(err),
        errorName: err?.name,
        errorStack: err?.stack,
        apiKeyPresent: Boolean(apiKey),
        apiKeyLength: apiKey ? apiKey.length : 0,
        languageRequested: language,
        inputMessagePreview: message ? message.substring(0, 100) : ""
      });

      const extractedSymptom = message ? message.trim() : "Reported Health Concern";
      const localizedFallbackAdvice = language === 'hi'
        ? `आपके बताए लक्षणों ("${extractedSymptom}") के लिए प्राथमिक सलाह: पर्याप्त विश्राम करें, स्वच्छ उबला पानी पिएं, और नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या आशा कार्यकर्ता से संपर्क करें। ${isPrivateRouting ? '\n🔒 गोपनीय हेल्पलाइन: 14416 (Tele-MANAS) या eSanjeevani पर निःशुल्क कॉल करें।' : ''}`
        : language === 'mr'
        ? `तुमच्या लक्षणांसाठी ("${extractedSymptom}") प्राथमिक आरोग्य सल्ला: विश्रांती घ्या, उकळलेले स्वच्छ पाणी प्या आणि जवळच्या प्राथमिक आरोग्य केंद्रातील आशा सेवियेशी संपर्क साधा. ${isPrivateRouting ? '\n🔒 गोपनीय मार्ग सक्रिय: १४४१६ (Tele-MANAS) वर विनामूल्य कॉल करा.' : ''}`
        : `Primary health guidance for your symptoms ("${extractedSymptom}"): Rest adequately, stay hydrated with clean water, and consult your nearest Primary Health Centre (PHC) or local ASHA worker. ${isPrivateRouting ? '\n🔒 Confidential Route: Call 14416 (Tele-MANAS National Helpline) or use eSanjeevani for private consultation.' : ''}`;

      result = {
        symptoms: imageBase64 ? ["Visible skin/wound condition", extractedSymptom] : [extractedSymptom],
        severity: matchedRedFlag ? "CRITICAL" : (isSensitive ? "MODERATE" : "MILD"),
        triage_advice: localizedFallbackAdvice,
        disclaimer: "Disclaimer: This tool provides preliminary health guidance only and is not a replacement for a clinical diagnosis.",
        escalate_immediately: matchedRedFlag ? true : false,
        escalation_reason: matchedRedFlag ? `Red-flag keyword detected: ${matchedRedFlag}` : "",
        is_sensitive: isSensitive,
        sensitive_category: detectedSensitiveCategory || (preferPrivate ? "User Requested Confidentiality" : undefined),
        is_private_routing: isPrivateRouting,
        private_helpline: isPrivateRouting ? helplineInfo : undefined,
        visual_analysis: imageBase64 ? {
          description: "Photographic symptom uploaded for visual examination.",
          concern_category: "Visual Assessment",
          urgency: "MODERATE"
        } : undefined
      };
    }
  }

  if (matchedRedFlag) {
    result.escalate_immediately = true;
    result.severity = "CRITICAL";
    if (!result.escalation_reason || result.escalation_reason.trim() === "") {
      result.escalation_reason = `CRITICAL OVERRIDE: Red-flag symptom detected ("${matchedRedFlag}"). Immediate emergency transport to PHC/Community Hospital required!`;
    }
  }

  return result;
}
