import React, { createContext, useContext, useState } from 'react';
import { LanguageOption } from '../types/health';

interface Translations {
  [key: string]: {
    [lang in LanguageOption]: string;
  };
}

const UI_TRANSLATIONS: Translations = {
  appName: {
    en: 'Arogya Sahayak',
    hi: 'आरोग्य सहायक',
    mr: 'आरोग्य सहाय्यक',
    ta: 'ஆரோக்ய உதவி'
  },
  tagline: {
    en: 'Rural Health Triage & Scheme Assistant',
    hi: 'ग्रामीण स्वास्थ्य जांच एवं योजना सहायक',
    mr: 'ग्रामीण आरोग्य तपासणी व योजना सहाय्यक',
    ta: 'கிராமப்புற சுகாதார உதவி மையம்'
  },
  tabTriage: {
    en: 'Symptom Triage',
    hi: 'लक्षण जांच (Triage)',
    mr: 'लक्षण तपासणी',
    ta: 'அறிகுறி பரிசோதனை'
  },
  tabSchemes: {
    en: 'Health Schemes',
    hi: 'सरकारी योजनाएं',
    mr: 'शासकीय योजना',
    ta: 'அரசுத் திட்டங்கள்'
  },
  tabMap: {
    en: 'Nearest PHC Map',
    hi: 'निकटतम स्वास्थ्य केंद्र',
    mr: 'जवळचे आरोग्य केंद्र',
    ta: 'அருகிலுள்ள PHC வரைபடம்'
  },
  tabAlerts: {
    en: 'ASHA Alerts',
    hi: 'आशा आपातकालीन अलर्ट',
    mr: 'आशा आपत्कालीन अलर्ट',
    ta: 'ஆஷா அவசர எச்சரிக்கைகள்'
  },
  micListening: {
    en: 'Listening... speak clearly',
    hi: 'सुन रहे हैं... स्पष्ट बोलें',
    mr: 'ऐकत आहे... स्पष्ट बोला',
    ta: 'கேட்கிறது... தெளிவாகப் பேசுங்கள்'
  },
  typeSymptomsPlaceholder: {
    en: 'Type symptoms or tap microphone to speak (e.g., severe fever and cough for 2 days)...',
    hi: 'अपने लक्षण लिखें या माइक बटन दबाकर बोलें (जैसे: 2 दिन से तेज बुखार और खांसी)...',
    mr: 'लक्षणे लिहा किंवा मायक्रोफोन दाबा (उदा. २ दिवसांपासून ताप आणि खोकला)...',
    ta: 'அ அறிகுறிகளை தட்டச்சு செய்யவும் அல்லது பேச மைக் அழுத்தவும்...'
  },
  sendBtn: {
    en: 'Analyze Symptoms',
    hi: 'लक्षणों की जांच करें',
    mr: 'लक्षणे तपासा',
    ta: 'பரிசோதி'
  },
  viewSchemesBtn: {
    en: 'View Matching Schemes',
    hi: 'पात्र योजनाएं देखें',
    mr: 'पात्र योजना पहा',
    ta: 'பொருந்தும் திட்டங்களைப் பார்க்கவும்'
  },
  findPhcBtn: {
    en: 'Find Nearest PHC',
    hi: 'निकटतम PHC ढूंढें',
    mr: 'जवळचे PHC शोधा',
    ta: 'அருகிலுள்ள PHC ஐக் கண்டறியவும்'
  },
  whyGuidanceTitle: {
    en: 'Why This Guidance (Safety Trust Panel)',
    hi: 'यह मार्गदर्शन क्यों? (सुरक्षा एवं भरोसा)',
    mr: 'हे मार्गदर्शन का? (सुरक्षा व विश्वास)',
    ta: 'ஏன் இந்த வழிகாட்டுதல்'
  },
  speakAdvice: {
    en: 'Listen to Advice (Voice)',
    hi: 'सलाह सुनें (आवाज़)',
    mr: 'सल्ला ऐका (आवाज)',
    ta: 'ஆலோசனையைக் கேளுங்கள்'
  },
  profileTitle: {
    en: 'Patient Profile & Eligibility Criteria',
    hi: 'रोगी विवरण एवं योग्यता',
    mr: 'रुग्ण माहिती व पात्रता',
    ta: 'நோயாளி சுயவிவரம்'
  }
};

interface LanguageContextType {
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  t: (key: string) => string;
  getLangName: (lang: LanguageOption) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  getLangName: (lang: LanguageOption) => lang
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageOption>('en');

  const t = (key: string): string => {
    if (UI_TRANSLATIONS[key] && UI_TRANSLATIONS[key][language]) {
      return UI_TRANSLATIONS[key][language];
    }
    if (UI_TRANSLATIONS[key] && UI_TRANSLATIONS[key]['en']) {
      return UI_TRANSLATIONS[key]['en'];
    }
    return key;
  };

  const getLangName = (lang: LanguageOption): string => {
    switch (lang) {
      case 'hi': return 'हिंदी (Hindi)';
      case 'mr': return 'मराठी (Marathi)';
      case 'ta': return 'தமிழ் (Tamil)';
      default: return 'English';
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLangName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
