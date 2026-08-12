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
  appSubtitle: {
    en: 'AI Rural Healthcare Triage & Field Escalation Portal',
    hi: 'एआई ग्रामीण स्वास्थ्य जांच और फील्ड एस्केलेशन पोर्टल',
    mr: 'एआय ग्रामीण आरोग्य तपासणी आणि फील्ड एस्केलेशन पोर्टल',
    ta: 'AI கிராமப்புற சுகாதார உதவி போர்ட்டல்'
  },
  citizenPatientTab: {
    en: 'Citizen Patient Tab',
    hi: 'Citizen Patient Tab',
    mr: 'Citizen Patient Tab',
    ta: 'Citizen Patient Tab'
  },
  ashaWorkerTab: {
    en: 'Asha Worker Tab',
    hi: 'Asha Worker Tab',
    mr: 'Asha Worker Tab',
    ta: 'Asha Worker Tab'
  },
  citizenLoginDesc: {
    en: 'Sign in with your Google account for secure personalized triage history and digital health pass generation.',
    hi: 'सुरक्षित व्यक्तिगत जांच इतिहास और डिजिटल स्वास्थ्य पास के लिए गूगल खाते से साइन इन करें।',
    mr: 'सुरक्षित वैयक्तिक तपासणी इतिहास आणि डिजिटल आरोग्य पाससाठी Google खात्याने साइन इन करा.',
    ta: 'பாதுகாப்பான தனிப்பயனாக்கப்பட்ட வரலாற்றுக்கு Google கணக்கில் உள்நுழையவும்.'
  },
  signInWithGoogle: {
    en: 'Sign in with Google',
    hi: 'Google के साथ साइन इन करें',
    mr: 'Google सह साइन इन करा',
    ta: 'Google மூலம் உள்நுழைக'
  },
  continueAsGuest: {
    en: 'Continue as Demo Guest',
    hi: 'डेमो अतिथि के रूप में जारी रखें',
    mr: 'डेमो अतिथी म्हणून सुरू ठेवा',
    ta: 'டெமோ விருந்தினராக தொடரவும்'
  },
  emergencyEscalationQueue: {
    en: 'EMERGENCY ESCALATION QUEUE',
    hi: 'आपातकालीन एस्केलेशन कतार',
    mr: 'आपत्कालीन एस्केलेशन रांग',
    ta: 'அவசர நிலை வரிசை'
  },
  ashaAlertDispatch: {
    en: 'ASHA Alert Dispatch & Escalation Queue',
    hi: 'आशा अलर्ट प्रेषण एवं एस्केलेशन कतार',
    mr: 'आशा अलर्ट पाठवणी व एस्केलेशन रांग',
    ta: 'ஆஷா விழிப்பூட்டல் வரிசை'
  },
  pendingLabel: {
    en: 'Pending',
    hi: 'लंबित',
    mr: 'लंबित',
    ta: 'நிலுவையில்'
  },
  ashaDispatchDesc: {
    en: 'Real-time emergency triage escalations & automated SMS dispatches to field ASHA workers.',
    hi: 'फील्ड आशा कार्यकर्ताओं के लिए वास्तविक समय आपातकालीन जांच एस्केलेशन और स्वचालित एसएमएस।',
    mr: 'फील्ड आशा सेविकांसाठी रीअल-टाइम आपत्कालीन तपासणी व स्वयंचलित एसएमएस.',
    ta: 'ஆஷா பணியாளர்களுக்கான நேரடி அவசர நிலை விழிப்பூட்டல்.'
  },
  ashaLoginDesc: {
    en: 'Sign in with registered ASHA credentials or PHC worker ID to access emergency queue.',
    hi: 'आपातकालीन कतार तक पहुंचने के लिए पंजीकृत आशा क्रेडेंशियल या पीएचसी आईडी से साइन इन करें।',
    mr: 'आपत्कालीन रांगेत प्रवेश करण्यासाठी नोंदणीकृत आशा क्रेडेंशियल किंवा पीएचसी आयडीने साइन इन करा.',
    ta: 'ஆஷா பணியாளர் கணக்கில் உள்நுழையவும்.'
  },
  ashaEmailLabel: {
    en: 'ASHA Email / PHC Worker ID',
    hi: 'आशा ईमेल / पीएचसी कार्यकर्ता आईडी',
    mr: 'आशा ईमेल / पीएचसी आयडी',
    ta: 'ஆஷா மின்னஞ்சல் / PHC ஐடி'
  },
  passwordLabel: {
    en: 'Password',
    hi: 'पासवर्ड',
    mr: 'पासवर्ड',
    ta: 'கடவுச்சொல்'
  },
  signInAsAshaBtn: {
    en: 'Sign In as ASHA Worker',
    hi: 'आशा कार्यकर्ता के रूप में साइन इन करें',
    mr: 'आशा सेविका म्हणून साइन इन करा',
    ta: 'ஆஷா பணியாளராக உள்நுழைக'
  },
  createAshaAccountBtn: {
    en: 'Register ASHA Account',
    hi: 'आशा खाता पंजीकृत करें',
    mr: 'आशा खाते नोंदणी करा',
    ta: 'ஆஷா கணக்கை பதிவு செய்க'
  },
  newAshaWorker: {
    en: 'New ASHA Worker? Register Account',
    hi: 'नये आशा कार्यकर्ता? खाता पंजीकृत करें',
    mr: 'नवीन आशा सेविका? खाते नोंदणी करा',
    ta: 'புதிய ஆஷா பணியாளரா? பதிவு செய்க'
  },
  alreadyRegisteredAsha: {
    en: 'Already Registered? Sign In',
    hi: 'पहले से पंजीकृत? साइन इन करें',
    mr: 'आधीच नोंदणीकृत? साइन इन करा',
    ta: 'ஏற்கனவே பதிவு செய்தவரா? உள்நுழைக'
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
  },
  quickDemosLabel: {
    en: 'QUICK DEMOS:',
    hi: 'त्वरित डेमो:',
    mr: 'जलद प्रात्यक्षिके:',
    ta: 'விரைவு செய்முறை:'
  },
  demoSensitiveMental: {
    en: 'Part A: Sensitive Mental Health (Private Route)',
    hi: 'भाग A: संवेदनशील मानसिक स्वास्थ्य (गोपनीय मार्ग)',
    mr: 'भाग A: संवेदनशील मानसिक आरोग्य (खाजगी मार्ग)',
    ta: 'பகுதி A: உணர்திறன் மன நலம்'
  },
  demoFeverPain: {
    en: 'Hindi: High Fever & Body Pain',
    hi: 'हिंदी: तेज बुखार व दर्द',
    mr: 'मराठी: तीव्र ताप व वेदना',
    ta: 'தமிழ்: காய்ச்சல் மற்றும் வலி'
  },
  demoRedFlag: {
    en: 'Red-Flag Emergency',
    hi: 'आपातकालीन स्थिति (Red-Flag)',
    mr: 'आपत्कालीन स्थिती (Red-Flag)',
    ta: 'அவசர எச்சரிக்கை'
  },
  triageEngineActive: {
    en: 'AI Triage Engine Active',
    hi: 'एआई लक्षण जांच प्रणाली सक्रिय',
    mr: 'एआय लक्षण तपासणी प्रणाली सक्रिय',
    ta: 'AI பரிசோதனை இயந்திரம் செயல்படுகிறது'
  },
  instantClinicalGuidance: {
    en: '• Instant Clinical Guidance & Private Consult',
    hi: '• त्वरित चिकित्सीय मार्गदर्शन और निजी परामर्श',
    mr: '• त्वरित वैद्यकीय सल्ला व खाजगी मार्गदर्शन',
    ta: '• உடனடி மருத்துவ வழிகாட்டுதல்'
  },
  privateConsultModeOn: {
    en: 'Private Consult Mode ON',
    hi: 'निजी परामर्श मोड चालू',
    mr: 'खाजगी सल्ला मोड चालू',
    ta: 'தனியார் ஆலோசனை ஆன்'
  },
  privateConsultModeOff: {
    en: 'Private Mode Off',
    hi: 'निजी मोड बंद',
    mr: 'खाजगी मोड बंद',
    ta: 'தனியார் பயன்முறை ஆஃப்'
  },
  showHealthPass: {
    en: 'Show My Health Pass',
    hi: 'मेरा डिजिटल हेल्थ पास देखें',
    mr: 'माझे डिजिटल हेल्थ पास पहा',
    ta: 'சுகாதார அட்டையைக் காட்டு'
  },
  visualAssessment: {
    en: 'Visual Assessment (CV)',
    hi: 'दृश्य जांच (Visual CV)',
    mr: 'दृश्य तपासणी (Visual CV)',
    ta: 'காட்சி பரிசோதனை'
  },
  confidentialPrivateRoute: {
    en: 'Confidential Private Route',
    hi: 'गोपनीय निजी मार्ग',
    mr: 'गोपनीय खाजगी मार्ग',
    ta: 'ரகசிய தனிப்பட்ட பாதை'
  },
  immediateEscalation: {
    en: 'IMMEDIATE ESCALATION',
    hi: 'तत्काल आपातकालीन रेफरल',
    mr: 'तातडीने रेफर करा',
    ta: 'உடனடி அவசர பரிந்துரை'
  },
  visualAssessmentLayer: {
    en: 'Visual Assessment Layer',
    hi: 'दृश्य परीक्षण परिणाम',
    mr: 'दृश्य तपासणी निकाल',
    ta: 'காட்சி மதிப்பீட்டு அடுக்கு'
  },
  concernCategory: {
    en: 'Concern Category:',
    hi: 'लक्षण श्रेणी:',
    mr: 'लक्षण श्रेणी:',
    ta: 'கவலை வகை:'
  },
  confidentialActive: {
    en: 'CONFIDENTIAL PRIVATE ROUTE ACTIVE',
    hi: 'गोपनीय निजी परामर्श सक्रिय',
    mr: 'गोपनीय खाजगी सल्ला मार्ग सक्रिय',
    ta: 'ரகசிய பாதை செயல்படுகிறது'
  },
  criticalRedFlag: {
    en: 'CRITICAL SAFETY RED FLAG:',
    hi: 'गंभीर चेतावनी (रेड फ्लैग):',
    mr: 'गंभीर इशारा (रेड फ्लॅग):',
    ta: 'முக்கிய ஆபத்து எச்சரிக்கை:'
  },
  ashaAlertDispatched: {
    en: 'ASHA Alert auto-dispatched to district response queue.',
    hi: 'आशा कार्यकर्ता अलर्ट जिला प्रतिक्रिया टीम को भेजा गया।',
    mr: 'आशा सेविका अलर्ट जिल्हा प्रतिसाद पथकाकडे पाठवला.',
    ta: 'ஆஷா விழிப்பூட்டல் மாவட்ட குழுவிற்கு அனுப்பப்பட்டது.'
  },
  guidelineConfidence: {
    en: 'Guideline Grounding Confidence:',
    hi: 'चिकित्सीय गाइडलाइन विश्वसनीयता:',
    mr: 'वैद्यकीय मार्गदर्शक तत्त्वे विश्वसनीयता:',
    ta: 'வழிகாட்டுதல் நம்பிக்கை:'
  },
  groundedIn4Guidelines: {
    en: 'Grounded in 4 Verified Health Guidelines',
    hi: '4 प्रमाणित स्वास्थ्य दिशानिर्देशों पर आधारित',
    mr: '४ प्रमाणित आरोग्य मार्गदर्शक तत्त्वांवर आधारित',
    ta: '4 சரிபார்க்கப்பட்ட சுகாதார வழிகாட்டுதல்கள்'
  },
  protocolSources: {
    en: 'Protocol Sources: MoHFW Rural Triage Standard, NHA Scheme Index, ICMR Emergency Directives, ASHA Field Manual',
    hi: 'मानक स्रोत: स्वास्थ्य मंत्रालय ग्रामीण जांच मानक, एनएचए योजना सूचकांक, आईसीएमआर निर्देश, आशा मैनुअल',
    mr: 'प्रमाणित स्रोत: आरोग्य मंत्रालय मानके, एनएचए योजना, आयसीएमआर मार्गदर्शक, आशा नियमावली',
    ta: 'ஆதாரங்கள்: சுகாதார அமைச்சகத்தின் வழிகாட்டுதல்கள்'
  },
  identifiedSymptoms: {
    en: 'Identified Symptoms:',
    hi: 'पहचाने गए लक्षण:',
    mr: 'ओळखलेली लक्षणे:',
    ta: 'கண்டறியப்பட்ட அறிகுறிகள்:'
  },
  analyzingSymptoms: {
    en: 'Analyzing symptoms with Gemini Flash Latest...',
    hi: 'जेमिनी फ़्लैश लेटेस्ट द्वारा लक्षणों का विश्लेषण किया जा रहा है...',
    mr: 'जेमिनी फ़्लैश लेटेस्ट द्वारे लक्षणांचे विश्लेषण केले जात आहे...',
    ta: 'ஜெமினி பிளாஷ் மூலம் அறிகுறிகள் பகுப்பாய்வு செய்யப்படுகின்றன...'
  },
  photoAttached: {
    en: 'Photograph Attached',
    hi: 'फोटो संलग्न है',
    mr: 'फोटो जोडला आहे',
    ta: 'புகைப்படம் இணைக்கப்பட்டுள்ளது'
  },
  readyForCv: {
    en: 'Ready for visual CV analysis',
    hi: 'दृश्य विश्लेषण के लिए तैयार',
    mr: 'दृश्य विश्लेषणासाठी तयार',
    ta: 'காட்சி பகுப்பாய்விற்கு தயார்'
  },
  addNotesPlaceholder: {
    en: 'Add text notes about the photo or press send...',
    hi: 'फोटो के बारे में विवरण लिखें या भेजें दबाएं...',
    mr: 'फोटोबद्दल अधिक माहिती लिहा किंवा पाठवा दाबा...',
    ta: 'புகைப்படம் பற்றிய குறிப்புகளைச் சேர்க்கவும்...'
  },
  welcomeAssistantMsg: {
    en: 'Namaste! I am Arogya Sahayak, your rural health assistant. Describe your symptoms in plain language (e.g., "High fever and headache for 2 days" or "छाती में दर्द और सांस लेने में तकलीफ"), upload a photograph of a visible symptom, or tap the microphone to speak.',
    hi: 'नमस्ते! मैं आरोग्य सहायक हूँ, आपका ग्रामीण स्वास्थ्य सहायक। अपने लक्षणों का सरल भाषा में वर्णन करें (जैसे: "2 दिनों से तेज़ बुखार और सिरदर्द"), किसी दृश्य लक्षण का फोटो अपलोड करें, या बोलने के लिए माइक बटन दबाएं।',
    mr: 'नमस्कार! मी आरोग्य सहाय्यक आहे, तुमचा ग्रामीण आरोग्य सहाय्यक. तुमची लक्षणे साध्या भाषेत सांगा (उदा. "२ दिवसांपासून तीव्र ताप आणि डोकेदुखी"), फोटो अपलोड करा किंवा बोलण्यासाठी मायक्रोफोन दाबा.',
    ta: 'வணக்கம்! நான் ஆரோக்கிய உதவி மையம். உங்கள் அறிகுறிகளை விவரியுங்கள் அல்லது பேச மைக் பொத்தான அழுத்தவும்.'
  },
  navTitle: {
    en: 'Navigation',
    hi: 'नेविगेशन',
    mr: 'नेव्हिगेशन',
    ta: 'வழிசெலுத்தல்'
  },
  quickActions: {
    en: 'Quick Actions',
    hi: 'त्वरित कार्य',
    mr: 'त्वरित कृती',
    ta: 'விரைவு செயல்கள்'
  },

  // --- Schemes Page ---
  govtSchemesTitle: {
    en: 'Government Benefit Schemes',
    hi: 'सरकारी लाभ योजनाएं',
    mr: 'शासकीय योजना व सवलती',
    ta: 'அரசு உதவி திட்டங்கள்'
  },
  healthSubsidiesHeader: {
    en: 'Health Subsidies & Cash Assistance',
    hi: 'स्वास्थ्य सब्सिडी और नकद सहायता',
    mr: 'आरोग्य सबसिडी व थेट आर्थिक मदत',
    ta: 'சுகாதார மானியம் மற்றும் நிதி உதவி'
  },
  schemesSubtitle: {
    en: 'Automated eligibility calculation against Ayushman Bharat (PM-JAY), JSY, RSBY, PMMVY & NHM.',
    hi: 'आयुष्मान भारत (PM-JAY), जेएसवाई, आरएसबीवाई, पीएमएमवीवाई और एनएचएम के तहत स्वचालित पात्रता जांच।',
    mr: 'आयुष्मान भारत (PM-JAY), JSY, RSBY, PMMVY आणि NHM अंतर्गत पात्रता तपासणी.',
    ta: 'ஆயுஷ்மான் பாரத் மற்றும் அரசு திட்டங்களுக்கான தானியங்கி தகுதி ஆய்வு.'
  },
  ageYears: {
    en: 'Age (Years)',
    hi: 'आयु (वर्ष)',
    mr: 'वय (वर्षे)',
    ta: 'வயது (ஆண்டுகள்)'
  },
  annualIncome: {
    en: 'Annual Income (₹)',
    hi: 'वार्षिक आय (₹)',
    mr: 'वार्षिक उत्पन्न (₹)',
    ta: 'ஆண்டு வருமானம் (₹)'
  },
  bplRationCard: {
    en: 'BPL Ration Card',
    hi: 'बीपीएल राशन कार्ड',
    mr: 'बीपीएल रेशन कार्ड',
    ta: 'BPL ரேஷன் கார்டு'
  },
  pregnantLactating: {
    en: 'Pregnant / Lactating',
    hi: 'गर्भवती / स्तनपान कराने वाली',
    mr: 'गरोदर / सस्तन माता',
    ta: 'கர்ப்பிணி / பாலூட்டும் தாய்'
  },
  recalculate: {
    en: 'Re-calculate',
    hi: 'पुनः जांचें',
    mr: 'पुन्हा तपासा',
    ta: 'மீண்டும் கணக்கிடு'
  },
  qualified: {
    en: 'QUALIFIED',
    hi: 'पात्र (QUALIFIED)',
    mr: 'पात्र (QUALIFIED)',
    ta: 'தகுதியானவர்'
  },
  partialMatch: {
    en: 'PARTIAL MATCH',
    hi: 'आंशिक पात्र (PARTIAL MATCH)',
    mr: 'अंशतः पात्र',
    ta: 'பகுதி தகுதி'
  },
  coverageCashBenefits: {
    en: 'Coverage & Cash Benefits:',
    hi: 'बीमा कवर एवं नकद लाभ:',
    mr: 'विमा कव्हर आणि आर्थिक लाभ:',
    ta: 'காப்பீடு மற்றும் நிதி பலன்கள்:'
  },
  whyYouQualify: {
    en: 'Why You Qualify (Matched Criteria):',
    hi: 'आप क्यों पात्र हैं (मिलान मानदंड):',
    mr: 'तुम्ही का पात्र आहात (तपासलेले निकष):',
    ta: 'நீங்கள் ஏன் தகுதியானவர்:'
  },
  phcEnrollmentInstructions: {
    en: 'PHC Enrollment Instructions',
    hi: 'पीएचसी नामांकन निर्देश',
    mr: 'पीएचसी नाव नोंदणी सूचना',
    ta: 'PHC சேர்க்கை வழிகாட்டுதல்'
  },

  // --- PHC Map Page ---
  osmInfraTitle: {
    en: 'Real-Time OpenStreetMap Infrastructure',
    hi: 'लाइव ओपनस्ट्रीटमैप स्वास्थ्य नेटवर्क',
    mr: 'थेट ओपनस्ट्रीटमॅप आरोग्य नेटवर्क',
    ta: 'நேரலை மேப் சுகாதாரம்'
  },
  phcFinderHeader: {
    en: 'Primary Health Centre (PHC) & Clinic Finder',
    hi: 'प्राथमिक स्वास्थ्य केंद्र (PHC) एवं क्लिनिक खोजें',
    mr: 'प्राथमिक आरोग्य केंद्र (PHC) व दवाखाना शोध',
    ta: 'ஆரம்ப சுகாதார நிலையம் மற்றும் மருத்துவமனை தேடல்'
  },
  phcFinderDesc: {
    en: 'Queries live OpenStreetMap healthcare nodes around your verified browser location.',
    hi: 'आपकी लाइव स्थान स्थिति के आधार पर निकटतम सरकारी स्वास्थ्य केंद्र खोजता है।',
    mr: 'तुमच्या GPS स्थानावरून जवळचे प्राथमिक आरोग्य केंद्र शोधते.',
    ta: 'உங்கள் இருப்பிடத்திற்கு அருகில் உள்ள ஆரம்ப சுகாதார நிலையங்களை கண்டறியும்.'
  },
  recenterGps: {
    en: 'Re-center GPS',
    hi: 'जीपीएस स्थान पुनः सेट करें',
    mr: 'जीपीएस स्थान री-सेट करा',
    ta: 'GPS இருப்பிடத்தை ரீசெட் செய்'
  },
  useLiveLocation: {
    en: 'Use Live Location',
    hi: 'लाइव लोकेशन का उपयोग करें',
    mr: 'थेट स्थान वापरा',
    ta: 'நேரலை இருப்பிடத்தைப் பயன்படுத்து'
  },
  filterPlaceholder: {
    en: 'Filter by name/district...',
    hi: 'नाम या जिले द्वारा खोजें...',
    mr: 'नाव किंवा जिल्ह्यानुसार शोधा...',
    ta: 'பெயர்/மாவட்டம் மூலம் தேடுக...'
  },
  filterBtn: {
    en: 'Filter',
    hi: 'खोजें',
    mr: 'शोधा',
    ta: 'தேடு'
  },
  activeSearchLocation: {
    en: 'Active Search Location:',
    hi: 'सक्रिय खोज स्थान:',
    mr: 'सक्रिय शोध स्थान:',
    ta: 'செயலில் உள்ள தேடல் இருப்பிடம்:'
  },
  resetToGps: {
    en: 'Reset to GPS Location',
    hi: 'जीपीएस स्थान पर वापस जाएं',
    mr: 'जीपीएस स्थानावर परत जा',
    ta: 'GPS இருப்பிடத்திற்கு திரும்பு'
  },
  gpsVerified: {
    en: 'GPS Location Verified:',
    hi: 'जीपीएस लोकेशन सत्यापित:',
    mr: 'जीपीएस स्थान सत्यापित:',
    ta: 'GPS இருப்பிடம் சரிபார்க்கப்பட்டது:'
  },
  gpsAccessNotice: {
    en: 'GPS Location Access Notice',
    hi: 'जीपीएस लोकेशन एक्सेस सूचना',
    mr: 'जीपीएस स्थान प्रवेश सूचना',
    ta: 'GPS அணுகல் அறிவிப்பு'
  },
  gpsNoticeDesc: {
    en: 'Currently showing healthcare facilities for default reference coordinates (Rural Pune). To display facilities around your exact physical location, enable location access.',
    hi: 'वर्तमान में डिफ़ॉल्ट संदर्भ स्थान के निकटतम स्वास्थ्य केंद्र दिखाए जा रहे हैं। अपने स्थान के पास देखने के लिए लोकेशन एक्सेस सक्षम करें।',
    mr: 'सध्या डीफॉल्ट स्थानावरील आरोग्य केंद्र दिसत आहेत. तुमच्या स्थानावरील केंद्रांसाठी लोकेशन चालू करा.',
    ta: 'தற்போது இயல்புநிலை இருப்பிடத்தின் ஆரம்ப சுகாதார நிலையங்கள் காட்டப்படுகின்றன.'
  },
  useLiveGps: {
    en: 'Use Live GPS Location',
    hi: 'लाइव जीपीएस चालू करें',
    mr: 'थेट जीपीएस चालू करा',
    ta: 'நேரலை GPS இயக்கவும்'
  },
  sampleDataNotice: {
    en: '⚠️ Sample Data — Live OpenStreetMap lookup was unavailable. Showing realistic sample entries for demonstration.',
    hi: '⚠️ नमूना डेटा — लाइव ओपनस्ट्रीटमैप कनेक्शन उपलब्ध नहीं था। प्रदर्शन के लिए नमूना केंद्र दिखाए जा रहे हैं।',
    mr: '⚠️ नमुना डेटा — थेट ओपनस्ट्रीटमॅप जोडणी उपलब्ध नव्हती. प्रात्यक्षिकासाठी नमुना केंद्रे दाखवली आहेत.',
    ta: '⚠️ மாதிரி தரவு — நேரலை இணைப்பு கிடைக்கவில்லை.'
  },
  osmTilesShown: {
    en: 'OpenStreetMap Tiles',
    hi: 'ओपनस्ट्रीटमैप लाइव मैप',
    mr: 'ओपनस्ट्रीटमॅप थेट नकाशे',
    ta: 'லைவ் வரைபடம்'
  },
  nearbyFacilitiesHeader: {
    en: 'Nearby Healthcare Facilities',
    hi: 'निकटतम स्वास्थ्य सुविधाएं',
    mr: 'जवळच्या आरोग्य सुविधा',
    ta: 'அருகிலுள்ள சுகாதார நிலையங்கள்'
  },
  clearFilter: {
    en: 'Clear Filter',
    hi: 'फ़िल्टर हटाएं',
    mr: 'फिल्टर हटवा',
    ta: 'வடிகட்டியை நீக்கு'
  },
  fetchingFacilities: {
    en: 'Fetching real OpenStreetMap facilities around coordinates...',
    hi: 'ओपनस्ट्रीटमैप से निकटतम स्वास्थ्य केंद्रों की जानकारी प्राप्त की जा रही है...',
    mr: 'ओपनस्ट्रीटमॅपवरून जवळच्या आरोग्य केंद्रांची माहिती मिळवली जात आहे...',
    ta: 'சுகாதார நிலைய விவரங்கள் பெறப்படுகின்றன...'
  },
  noFacilitiesFound: {
    en: 'No hospital or clinic nodes found matching',
    hi: 'इस खोज से मेल खाता कोई अस्पताल या क्लिनिक नहीं मिला',
    mr: 'या शोधाशी जुळणारे कोणतेही रुग्णालय किंवा दवाखाना आढळला नाही',
    ta: 'மருத்துவமனைகள் எதுவும் கிடைக்கவில்லை'
  },
  resetSearch: {
    en: 'Reset Search',
    hi: 'खोज रीसेट करें',
    mr: 'शोध रीसेट करा',
    ta: 'தேடலை மீட்டமை'
  },
  hoursLabel: {
    en: 'Hours:',
    hi: 'समय:',
    mr: 'वेळ:',
    ta: 'நேரம்:'
  },
  emergency247: {
    en: '24/7 Emergency Care',
    hi: '24/7 आपातकालीन देखभाल',
    mr: '२४/७ आपत्कालीन सेवा',
    ta: '24/7 அவசர சிகிச்சை'
  },
  govtCommHealth: {
    en: 'Government/Community Health',
    hi: 'सरकारी / सामुदायिक स्वास्थ्य केंद्र',
    mr: 'शासकीय / समुदाय आरोग्य केंद्र',
    ta: 'அரசு ஆரம்ப சுகாதார நிலையம்'
  },
  directions: {
    en: 'Directions',
    hi: 'दिशा-निर्देश (मैप)',
    mr: 'दिशा-निर्देश (मॅप)',
    ta: 'வழித்தடம்'
  },
  call: {
    en: 'Call',
    hi: 'कॉल करें',
    mr: 'कॉल करा',
    ta: 'அழை'
  },

  // --- ASHA Alerts Queue ---
  systemHealthMonitor: {
    en: 'System Health Monitor:',
    hi: 'सिस्टम स्वास्थ्य स्थिति:',
    mr: 'सिस्टम आरोग्य स्थिती:',
    ta: 'அமைப்பின் நிலை இயக்கம்:'
  },
  aiTriageEngine: {
    en: 'AI Triage Engine:',
    hi: 'एआई लक्षण जांच प्रणाली:',
    mr: 'एआय लक्षण तपासणी:',
    ta: 'AI பரிசோதனை:'
  },
  operational: {
    en: 'Operational',
    hi: 'सक्रिय',
    mr: 'कार्यरत',
    ta: 'இயங்குகிறது'
  },
  schemeMatching: {
    en: 'Scheme Matching:',
    hi: 'योजना मिलान प्रणाली:',
    mr: 'योजना जुळवणी:',
    ta: 'திட்ட தகுதி ஆய்வு:'
  },
  facilityLocator: {
    en: 'Facility Locator:',
    hi: 'स्वास्थ्य केंद्र खोजकर्ता:',
    mr: 'आरोग्य केंद्र शोधक:',
    ta: 'நிலைய லொகேட்டர்:'
  },
  outbreakDetection: {
    en: 'Outbreak Detection:',
    hi: 'बीमारी प्रकोप निगरानी:',
    mr: 'रोगप्रसार निगराणी:',
    ta: 'நோய்த்தொற்று கண்காணிப்பு:'
  },
  ashaAlertHeader: {
    en: 'ASHA & ANM Alert Dispatch',
    hi: 'आशा एवं एएनएम कार्यकर्ता अलर्ट प्रेषण',
    mr: 'आशा व एएनएम कार्यकत्री अलर्ट प्रणाली',
    ta: 'ஆஷா விழிப்பூட்டல் மையம்'
  },
  pendingAlertsCount: {
    en: 'PENDING',
    hi: 'लंबित (PENDING)',
    mr: 'प्रलंबित',
    ta: 'நிலுவையில்'
  },
  ashaAlertSubtitle: {
    en: 'Automated high-severity symptom triggers for local village healthcare workers.',
    hi: 'ग्रामीण स्वास्थ्य कार्यकर्ताओं के लिए स्वचालित आपातकालीन अलर्ट प्रणाली।',
    mr: 'ग्रामीण आरोग्य सेविकांसाठी स्वयंचलित आपत्कालीन इशारा प्रणाली.',
    ta: 'கிராமப்புற சுகாதார ஊழியர்களுக்கான அவசர விழிப்பூட்டல்.'
  },
  generateVillageAdvisory: {
    en: 'Generate Village Advisory',
    hi: 'ग्राम स्वास्थ्य सलाह बनाएं',
    mr: 'ग्राम आरोग्य सल्ला तयार करा',
    ta: 'கிராம சுகாதார ஆலோசனை'
  },
  scanPatientCard: {
    en: 'Scan Patient Card',
    hi: 'रोगी पास कार्ड स्कैन करें',
    mr: 'रुग्ण पास कार्ड स्कॅन करा',
    ta: 'கார்டை ஸ்கேன் செய்'
  },
  refreshQueue: {
    en: 'Refresh Queue',
    hi: 'कतार रिफ्रेश करें',
    mr: 'रांग रीफ्रेश करा',
    ta: 'புதுப்பி'
  },
  noActiveEscalations: {
    en: 'No Active Emergency Escalations',
    hi: 'कोई सक्रिय आपातकालीन मामला नहीं है',
    mr: 'कोणताही सक्रिय आपत्कालीन प्रकार नाही',
    ta: 'அவசர விழிப்பூட்டல்கள் எதுவும் இல்லை'
  },
  ashaQueueClearDesc: {
    en: 'The ASHA dispatch queue is currently clear. When patients report red-flag emergency symptoms during triage sessions, automated alerts will appear here in real-time.',
    hi: 'आशा कार्यकर्ता रिस्पॉन्स कतार अभी खाली है। जब मरीज लक्षण जांच के दौरान गंभीर स्थिति दर्ज करते हैं, तो अलर्ट तुरंत यहां दिखाई देंगे।',
    mr: 'आशा प्रतिसाद रांग सध्या रिकामी आहे. रुग्णांनी गंभीर लक्षणे नोंदवल्यास त्वरित अलर्ट येथे दिसतील.',
    ta: 'ஆஷா வரிசை காலியாக உள்ளது. அவசர அறிகுறிகள் இருந்தால் இங்கு எச்சரிக்கை தோன்றும்.'
  },
  generateWeeklyPoster: {
    en: 'Generate Weekly Village Health Advisory Poster',
    hi: 'साप्ताहिक ग्राम स्वास्थ्य पोस्टर बनाएं',
    mr: 'साप्ताहिक ग्राम आरोग्य पोस्टर तयार करा',
    ta: 'வாராந்திர சுகாதார சுவரொட்டி உருவாக்கவும்'
  },
  escalationBadge: {
    en: 'ESCALATION',
    hi: 'आपातकालीन अलर्ट',
    mr: 'आपत्कालीन इशारा',
    ta: 'அவசர எச்சரிக்கை'
  },
  anonymizedHash: {
    en: 'Anonymized Hash:',
    hi: 'गोपनीय रोगी कोड:',
    mr: 'गोपनीय रुग्ण कोड:',
    ta: 'ரகசிய நோயாளி குறியீடு:'
  },
  triggerSymptoms: {
    en: 'Trigger Symptoms:',
    hi: 'गंभीर लक्षण:',
    mr: 'गंभीर लक्षणे:',
    ta: 'காரணமான அறிகுறிகள்:'
  },
  reasonForTrigger: {
    en: 'Reason for Trigger:',
    hi: 'अलर्ट का कारण:',
    mr: 'इशाऱ्याचे कारण:',
    ta: 'எச்சரிக்கையின் காரணம்:'
  },
  statusLabel: {
    en: 'Status:',
    hi: 'स्थिति:',
    mr: 'स्थिती:',
    ta: 'நிலை:'
  },
  acknowledgeAlert: {
    en: 'Acknowledge Alert',
    hi: 'अलर्ट स्वीकारें',
    mr: 'इशारा स्वीकारा',
    ta: 'எச்சரிக்கையை ஏற்றுக்கொள்'
  },
  markHomeVisitDone: {
    en: 'Mark Home Visit Done',
    hi: 'गृह भ्रमण पूर्ण अंकित करें',
    mr: 'गृहभेट पूर्ण झाली',
    ta: 'வீட்டுப் பார்வையை பதிவுசெய்'
  },
  dispatch108Ambulance: {
    en: 'Dispatch 108 Ambulance',
    hi: '108 एम्बुलेंस बुलाएं',
    mr: '१०८ रुग्णवाहिका बोलवा',
    ta: '108 ஆம்புலன்ஸ் வரவழைக்க'
  },

  // --- Digital Health Pass Modal ---
  digitalHealthPassCard: {
    en: 'Digital Health Pass Card',
    hi: 'डिजिटल हेल्थ पास कार्ड',
    mr: 'डिजिटल हेल्थ पास कार्ड',
    ta: 'டிஜிட்டல் சுகாதார அட்டை'
  },
  offlineSyncReady: {
    en: 'Offline Sync Ready',
    hi: 'ऑफ़लाइन सिंक तैयार',
    mr: 'ऑफलाईन सिंक तयार',
    ta: 'ஆஃப்லைன் இணைப்பு தயார்'
  },
  digitalHealthPassDesc: {
    en: 'Scan with ASHA Worker reader for offline history access',
    hi: 'ऑफ़लाइन मेडिकल इतिहास के लिए आशा कार्यकर्ता द्वारा स्कैन कराएं',
    mr: 'ऑफलाईन वैद्यकीय इतिहासासाठी आशा सेविकेकडून स्कॅन करून घ्या',
    ta: 'ஆரோக்கிய விவரங்களை அறிய ஆஷா பணியாளரிடம் ஸ்கேன் செய்ய பயன்படுத்தவும்'
  },
  nationalHealthPassSub: {
    en: 'National Health Pass • ABHA Compliant ID',
    hi: 'राष्ट्रीय स्वास्थ्य पास • आभा (ABHA) आईडी',
    mr: 'राष्ट्रीय आरोग्य पास • आभा (ABHA) आयडी',
    ta: 'தேசிய சுகாதார அட்டை • ABHA ஐடி'
  },
  ageGenderLabel: {
    en: 'Age / Gender',
    hi: 'आयु / लिंग',
    mr: 'वय / लिंग',
    ta: 'வயது / பாலினம்'
  },
  districtSectorLabel: {
    en: 'District / Sector',
    hi: 'जिला / क्षेत्र',
    mr: 'जिल्हा / क्षेत्र',
    ta: 'மாவட்டம் / பிரிவு'
  },
  bplHolder: {
    en: 'BPL Ration Holder',
    hi: 'बीपीएल राशन कार्ड धारक',
    mr: 'बीपीएल रेशन कार्ड धारक',
    ta: 'BPL ரேஷன் கார்டுதாரர்'
  },
  generalCategory: {
    en: 'General Scheme Category',
    hi: 'सामान्य योजना श्रेणी',
    mr: 'सामान्य योजना श्रेणी',
    ta: 'பொது வகை'
  },
  maternalPriority: {
    en: 'Maternal Priority (JSY)',
    hi: 'मातृ स्वास्थ्य प्राथमिकता (JSY)',
    mr: 'माता आरोग्य प्राधान्य (JSY)',
    ta: 'தாய்மை முன்னுரிமை (JSY)'
  },
  scanForOfflineHistory: {
    en: 'Scan for Offline History',
    hi: 'ऑफ़लाइन इतिहास के लिए स्कैन करें',
    mr: 'ऑफलाईन इतिहासासाठी स्कॅन करा',
    ta: 'ஆஃப்லைன் விவரங்களுக்கு ஸ்கேன் செய்க'
  },
  encodedPayloadStats: {
    en: 'Encoded Offline Payload:',
    hi: 'एनकोडेड ऑफ़लाइन इतिहास सत्र:',
    mr: 'ऑफलाईन माहिती सत्र:',
    ta: 'பதிவு செய்யப்பட்ட ஆஃப்லைன் விபரம்:'
  },
  base64StringLabel: {
    en: 'Base64 Offline Encoded Payload String',
    hi: 'ऑफ़लाइन एनकोडेड डेटा कोड',
    mr: 'ऑफलाईन एनकोड केलेला डेटा',
    ta: 'ஆஃப்லைன் குறியாக்கப்பட்ட தரவு'
  },
  copied: {
    en: 'Copied',
    hi: 'कॉपी हो गया',
    mr: 'कॉपी झाले',
    ta: 'நகலெடுக்கப்பட்டது'
  },
  copyText: {
    en: 'Copy Text',
    hi: 'कोड कॉपी करें',
    mr: 'कोड कॉपी करा',
    ta: 'நகலெடு'
  },
  closeModal: {
    en: 'Close',
    hi: 'बंद करें',
    mr: 'बंद करा',
    ta: 'மூடு'
  },

  // --- Village Advisory Modal ---
  villageAdvisoryHeader: {
    en: 'Village Health Advisory Generator',
    hi: 'ग्राम स्वास्थ्य सलाह एवं पोस्टर जनरेटर',
    mr: 'ग्राम आरोग्य सल्ला व पोस्टर निर्मिती',
    ta: 'கிராம சுகாதார சுவரொட்டி ஆக்கி'
  },
  villageAdvisorySubtitle: {
    en: 'AI-Generated Weekly PHC Noticeboard Poster grounded in WHO IMCI & ICMR guidelines',
    hi: 'डब्ल्यूएचओ एवं आईसीएमआर दिशानिर्देशों पर आधारित एआई-निर्मित ग्राम स्वास्थ्य पोस्टर',
    mr: 'डब्ल्यूएचओ व आयसीएमआर मार्गदर्शक तत्त्वांवर आधारित एआय ग्राम आरोग्य पोस्टर',
    ta: 'சுகாதார வழிகாட்டுதலின்படி உருவாக்கப்படும் சுகாதார சுவரொட்டி'
  },
  regenerateAdvisory: {
    en: 'Regenerate',
    hi: 'पुनः बनाएं',
    mr: 'पुन्हा तयार करा',
    ta: 'மீண்டும் உருவாக்கு'
  },
  printA5Poster: {
    en: 'Print A5 Poster',
    hi: 'A5 पोस्टर प्रिंट करें',
    mr: 'A5 पोस्टर प्रिंट करा',
    ta: 'A5 போஸ்டர் பிரிண்ட்'
  },
  urgency: {
    en: 'URGENCY',
    hi: 'आपातकालीनता',
    mr: 'तात्काळता',
    ta: 'அவசரம்'
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
