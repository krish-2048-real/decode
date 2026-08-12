export type LanguageOption = 'en' | 'hi' | 'mr' | 'ta';

export interface UserProfile {
  uid?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role?: 'citizen' | 'asha' | 'admin';
  age?: number;
  income?: number; // annual income in INR
  state?: string;
  district?: string;
  village?: string;
  block?: string;
  isPregnant?: boolean;
  isBPL?: boolean;
  gender?: string;
  proactiveAlertsOptIn?: boolean;
  createdAt?: string;
}

export interface TriageInput {
  message: string;
  language: string;
  userProfile?: UserProfile;
  sessionId?: string;
  userId?: string;
  preferPrivate?: boolean;
  imageBase64?: string;
}

export interface TriageResult {
  symptoms: string[];
  severity: 'MILD' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  triage_advice: string;
  disclaimer: string;
  escalate_immediately: boolean;
  escalation_reason: string;
  timestamp?: string;
  is_sensitive?: boolean;
  sensitive_category?: string;
  is_private_routing?: boolean;
  private_helpline?: {
    name: string;
    number: string;
    description: string;
  };
  visual_analysis?: {
    description: string;
    concern_category: string;
    urgency: string;
  };
  caseRefId?: string;
  assignedAsha?: {
    name: string;
    phone: string;
    sector: string;
  };
  confirmationReceipt?: UserConfirmationReceipt;
  proactiveAlerts?: ProactiveAlert[];
}

export interface UserConfirmationReceipt {
  caseRefId: string;
  assignedAshaName: string;
  assignedAshaPhone: string;
  assignedAshaSector: string;
  timestamp: string;
  channel: 'voice' | 'text' | 'image';
  smsDispatched: boolean;
  smsRecipient?: string;
  summaryMessage: string;
}

export interface ProactiveAlert {
  id: string;
  type: 'scheme_deadline' | 'outbreak_advisory' | 'immunization_reminder' | 'seasonal_health';
  title: string;
  message: string;
  urgency: 'INFO' | 'WARNING' | 'URGENT';
  deadline?: string;
  schemeName?: string;
  schemeUrl?: string;
  district?: string;
  generatedAt: string;
}

export interface AshaNotification {
  id: string;
  alertId: string;
  type: 'sms' | 'push' | 'in_app';
  recipientRole: 'asha';
  recipientDistrict: string;
  message: string;
  severity: 'HIGH' | 'CRITICAL';
  dispatched: boolean;
  dispatchedAt: string;
  symptomTags: string[];
}

export interface Scheme {
  id: string;
  name: string;
  shortName: string;
  description: string;
  benefits: string;
  eligibilitySummary: string;
  category: string;
  officialUrl?: string;
}

export interface SchemeMatchResult {
  scheme: Scheme;
  matched: boolean;
  score: number; // 0 to 100
  qualificationReason: string;
  matchedCriteria: string[];
}

export interface SchemeMatchInput {
  age?: number;
  income?: number;
  state?: string;
  is_pregnant?: boolean;
  is_bpl?: boolean;
  gender?: string;
}

export interface PHCFacility {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  district: string;
  state?: string;
  address: string;
  phone: string;
  emergencyServices?: boolean;
  distanceKm?: number;
  doctorOnDuty?: string;
  openingHours?: string;
  operator?: string;
  isFallback?: boolean;
  source?: string;
  block?: string;
  services?: string[];
  is24x7?: boolean;
  bedCount?: number;
  medicalOfficer?: string;
}

export interface AshaAlert {
  id: string;
  sessionId: string;
  severity: 'HIGH' | 'CRITICAL';
  symptomTags: string[];
  userMessage: string;
  escalationReason: string;
  timestamp: string;
  status: 'pending' | 'acknowledged' | 'visited';
  district?: string;
  userIdHash: string;
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  lang: string;
  timestamp: string;
  result?: TriageResult;
  imagePreview?: string;
}

export interface ConversationSession {
  sessionId: string;
  userId: string;
  turns: ChatTurn[];
  createdAt: string;
}
