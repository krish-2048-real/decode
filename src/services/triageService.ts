import { GoogleGenAI, Type } from "@google/genai";
import { TriageInput, TriageResult } from "../types/health";

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

  // Check red flag keywords
  let matchedRedFlag: string | null = null;
  for (const kw of RED_FLAG_KEYWORDS) {
    if (lowerMessage.includes(kw)) {
      matchedRedFlag = kw;
      break;
    }
  }

  // Check sensitive category keywords
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

  const apiKey = process.env.GEMINI_API_KEY;
  let result: TriageResult;

  if (!apiKey) {
    // Backup fallback if API key is not present
    result = {
      symptoms: imageBase64 ? ["Visible skin/wound condition", "Reported symptoms"] : ["Unspecified symptom"],
      severity: matchedRedFlag ? "CRITICAL" : "MODERATE",
      triage_advice: `Medical advice in ${language}: Please consult nearest healthcare center. ${isPrivateRouting ? '🔒 Confidential Routing Active: Contact Tele-MANAS (14416) or eSanjeevani for private consultation.' : ''}`,
      disclaimer: "Disclaimer: This tool provides general health guidance and is NOT a substitute for professional medical advice.",
      escalate_immediately: matchedRedFlag ? true : false,
      escalation_reason: matchedRedFlag ? `Red-flag symptom detected: "${matchedRedFlag}". Emergency care required!` : "",
      is_sensitive: isSensitive,
      sensitive_category: detectedSensitiveCategory || (preferPrivate ? "User Requested Confidentiality" : undefined),
      is_private_routing: isPrivateRouting,
      private_helpline: isPrivateRouting ? helplineInfo : undefined,
      visual_analysis: imageBase64 ? {
        description: "Captured image shows localized skin/tissue irregularity requiring clinical observation.",
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

      const systemPrompt = `You are "Arogya Sahayak", an empathetic, highly accurate rural healthcare triage assistant in India.
Your task is to analyze patient symptoms reported in text, voice, and/or photographs, assess severity, detect sensitive topics, and provide actionable care guidance.

CRITICAL INSTRUCTIONS:
1. Always respond in the requested language: "${language || "English"}".
2. Evaluate severity into strictly one of: ["MILD", "MODERATE", "HIGH", "CRITICAL"].
3. "escalate_immediately" MUST be true for red flag symptoms like chest pain, breathing difficulty, severe bleeding, high infant fever, convulsions, snake bites, stroke.
4. Detect if the message covers sensitive categories: Mental Health, Sexual/Reproductive Health, or Domestic Violence/Abuse. Set is_sensitive to true if detected.
5. If an image is attached, perform a visual symptom inspection (skin rashes, lesions, wounds, eye redness, swelling). Populate visual_analysis with description, concern_category, and urgency.
6. Provide concise, compassionate advice suitable for rural Indian citizens.`;

      const promptText = `Patient Message: "${message}"
User Profile: ${JSON.stringify(userProfile || {})}
Language Requested: ${language || "English"}
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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
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
          }
        }
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text) as any;

      result = {
        symptoms: parsed.symptoms || ["Symptom reported"],
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
    } catch (err) {
      console.error("Gemini API call failed, using fallback:", err);
      result = {
        symptoms: ["Symptom reported"],
        severity: matchedRedFlag ? "CRITICAL" : "MODERATE",
        triage_advice: `Please consult a healthcare professional. ${isPrivateRouting ? '🔒 Confidential option active.' : ''}`,
        disclaimer: "Disclaimer: This tool provides preliminary health guidance only.",
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

  // Red Flag Override
  if (matchedRedFlag) {
    result.escalate_immediately = true;
    result.severity = "CRITICAL";
    if (!result.escalation_reason || result.escalation_reason.trim() === "") {
      result.escalation_reason = `CRITICAL OVERRIDE: Red-flag symptom detected ("${matchedRedFlag}"). Immediate emergency transport to PHC/Community Hospital required!`;
    }
  }

  return result;
}
