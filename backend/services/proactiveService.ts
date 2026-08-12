import { ProactiveAlert, UserProfile } from '../../src/types/health';
import { getAshaAlertsAsync, getAshaAlerts } from './alertsService';
import fs from 'fs';
import path from 'path';

/**
 * Generate proactive alerts for a user based on their profile and regional health trends.
 * 
 * This produces alerts for:
 * 1. Government scheme deadlines (PM-JAY, JSY, PMMVY, etc.)
 * 2. Outbreak/seasonal health advisories based on recent alert trends
 * 3. Immunization reminders for eligible profiles (pregnant women, children)
 * 4. Seasonal health tips (monsoon waterborne, heat stroke, etc.)
 */
export async function generateProactiveAlerts(
  userProfile?: UserProfile,
  district?: string
): Promise<ProactiveAlert[]> {
  const alerts: ProactiveAlert[] = [];
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed

  // ────────────────────────────────────────────────────────
  // 1. SCHEME DEADLINE ALERTS
  // ────────────────────────────────────────────────────────
  let schemesData: any[] = [];
  try {
    const schemesPath = path.join(process.cwd(), 'data', 'schemes.json');
    if (fs.existsSync(schemesPath)) {
      schemesData = JSON.parse(fs.readFileSync(schemesPath, 'utf8'));
    }
  } catch (err) {
    console.warn('[PROACTIVE] Could not read schemes.json:', err);
  }

  // PM-JAY renewal deadline alert (simulated — real deadline would come from API)
  const pmjay = schemesData.find((s: any) => s.id === 'pmjay');
  if (pmjay) {
    const deadlineDate = new Date(now);
    deadlineDate.setDate(deadlineDate.getDate() + 5);
    const deadlineStr = deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!userProfile || userProfile.isBPL || (userProfile.income && userProfile.income <= 120000)) {
      alerts.push({
        id: 'proactive_pmjay_' + Date.now(),
        type: 'scheme_deadline',
        title: '⏰ PM-JAY Ayushman Card Renewal Deadline',
        message: `Your Ayushman Bharat PM-JAY health card renewal deadline is approaching on ${deadlineStr}. Visit your nearest PHC with Aadhaar & ration card to renew. Coverage: ₹5 Lakh free hospitalization per family.`,
        urgency: 'WARNING',
        deadline: deadlineDate.toISOString(),
        schemeName: pmjay.shortName,
        schemeUrl: pmjay.officialSourceUrl || 'https://pmjay.gov.in',
        district: district || userProfile?.district,
        generatedAt: now.toISOString(),
      });
    }
  }

  // JSY maternity benefit for pregnant women
  const jsy = schemesData.find((s: any) => s.id === 'jsy');
  if (jsy && userProfile?.isPregnant) {
    const regDeadline = new Date(now);
    regDeadline.setDate(regDeadline.getDate() + 10);

    alerts.push({
      id: 'proactive_jsy_' + Date.now(),
      type: 'scheme_deadline',
      title: '🤰 JSY Maternity Benefit — Register Now',
      message: `As a pregnant mother, you are eligible for ₹1,400 direct cash transfer under Janani Suraksha Yojana. Register at your local Anganwadi/PHC with ASHA worker before your delivery date. Free ambulance (108) and post-delivery medicines included.`,
      urgency: 'URGENT',
      deadline: regDeadline.toISOString(),
      schemeName: jsy.shortName,
      schemeUrl: jsy.officialSourceUrl || 'https://nhm.gov.in',
      district: district || userProfile?.district,
      generatedAt: now.toISOString(),
    });
  }

  // PMMVY for pregnant women
  const pmmvy = schemesData.find((s: any) => s.id === 'pmmvy');
  if (pmmvy && userProfile?.isPregnant) {
    alerts.push({
      id: 'proactive_pmmvy_' + Date.now(),
      type: 'scheme_deadline',
      title: '💰 PMMVY Cash Benefit — ₹5,000 Available',
      message: `Under Pradhan Mantri Matru Vandana Yojana, you can receive ₹5,000 in cash installments. Register pregnancy at Anganwadi Centre within first trimester and complete ANC checkup.`,
      urgency: 'INFO',
      schemeName: pmmvy.shortName,
      schemeUrl: pmmvy.officialSourceUrl || 'https://pmmvy.nic.in',
      district: district || userProfile?.district,
      generatedAt: now.toISOString(),
    });
  }

  // ────────────────────────────────────────────────────────
  // 2. OUTBREAK / SEASONAL ADVISORIES
  // ────────────────────────────────────────────────────────
  let recentAlerts = await getAshaAlertsAsync().catch(() => getAshaAlerts());

  // Analyze symptom trends for outbreak detection
  const symptomFreq: Record<string, number> = {};
  (recentAlerts || []).forEach(a => {
    a.symptomTags?.forEach(tag => {
      symptomFreq[tag.toLowerCase()] = (symptomFreq[tag.toLowerCase()] || 0) + 1;
    });
  });

  // Monsoon season advisory (June–September)
  if (currentMonth >= 5 && currentMonth <= 8) {
    const waterborneSymptoms = ['diarrhea', 'vomiting', 'loose motion', 'gastroenteritis', 'cholera', 'typhoid'];
    const dengueSymptoms = ['dengue', 'high fever', 'joint pain', 'body ache', 'rash'];
    
    const hasWaterborne = waterborneSymptoms.some(s => symptomFreq[s] && symptomFreq[s] >= 1);
    const hasDengue = dengueSymptoms.some(s => symptomFreq[s] && symptomFreq[s] >= 1);

    alerts.push({
      id: 'proactive_monsoon_' + Date.now(),
      type: 'outbreak_advisory',
      title: '🌧️ Monsoon Waterborne Disease Alert',
      message: `Monsoon season increases risk of waterborne diseases (cholera, typhoid, gastroenteritis) in ${district || userProfile?.district || 'your area'}. ${hasWaterborne ? '⚠️ Recent cases detected in your region! ' : ''}Always drink boiled/filtered water, use ORS for diarrhea, and avoid stagnant water contact. Report symptoms to ASHA worker immediately.`,
      urgency: hasWaterborne ? 'URGENT' : 'WARNING',
      district: district || userProfile?.district,
      generatedAt: now.toISOString(),
    });

    if (hasDengue || currentMonth >= 6) {
      alerts.push({
        id: 'proactive_dengue_' + Date.now(),
        type: 'outbreak_advisory',
        title: '🦟 Dengue & Malaria Prevention Advisory',
        message: `${hasDengue ? '⚠️ Dengue cases reported in your district. ' : ''}Use mosquito nets at night, apply repellent, eliminate stagnant water near your home, and wear full-sleeve clothing. High fever with joint pain for 3+ days needs immediate PHC visit. Call 108 for emergency.`,
        urgency: hasDengue ? 'URGENT' : 'WARNING',
        district: district || userProfile?.district,
        generatedAt: now.toISOString(),
      });
    }
  }

  // Summer advisory (March–June)
  if (currentMonth >= 2 && currentMonth <= 5) {
    alerts.push({
      id: 'proactive_heat_' + Date.now(),
      type: 'seasonal_health',
      title: '☀️ Heat Stroke Prevention Advisory',
      message: `Summer temperatures can cause heat stroke, dehydration, and sunstroke. Drink 8-10 glasses of water daily, avoid outdoor work during 11am-4pm, carry ORS sachets, and wear light-colored loose clothing. Seek immediate medical help if someone faints or has high body temperature.`,
      urgency: 'INFO',
      district: district || userProfile?.district,
      generatedAt: now.toISOString(),
    });
  }

  // ────────────────────────────────────────────────────────
  // 3. IMMUNIZATION REMINDERS
  // ────────────────────────────────────────────────────────
  if (userProfile?.isPregnant) {
    alerts.push({
      id: 'proactive_immun_preg_' + Date.now(),
      type: 'immunization_reminder',
      title: '💉 Tetanus-Diphtheria Vaccination Reminder',
      message: `Pregnant women should complete Td (Tetanus-Diphtheria) vaccination. Visit your nearest PHC or Anganwadi for free vaccination under Mission Indradhanush. This protects both mother and baby.`,
      urgency: 'INFO',
      district: district || userProfile?.district,
      generatedAt: now.toISOString(),
    });
  }

  if (userProfile?.age && userProfile.age >= 18 && userProfile.age <= 35) {
    alerts.push({
      id: 'proactive_immun_child_' + Date.now(),
      type: 'immunization_reminder',
      title: '👶 Child Immunization Camp Notice',
      message: `Free immunization camp under Mission Indradhanush 5.0 is scheduled in ${district || userProfile?.district || 'your area'}. All children up to 5 years can receive free vaccines for 12 diseases including Polio, Measles, and Hepatitis B. Visit the nearest PHC or Anganwadi with your child.`,
      urgency: 'INFO',
      district: district || userProfile?.district,
      generatedAt: now.toISOString(),
    });
  }

  return alerts;
}
