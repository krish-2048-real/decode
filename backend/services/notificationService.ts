import { AshaAlert, AshaNotification } from '../../src/types/health';
import { db, collection, doc, setDoc, getDocs, query, orderBy, sanitizeFirestoreData } from '../../src/lib/firebase';

// In-memory notification log for server session
const notificationLog: AshaNotification[] = [];

// ASHA worker directory (simulated — in production this would come from a database)
const ASHA_WORKER_DIRECTORY: Record<string, { name: string; phone: string; sector: string }> = {
  'Pune Rural': { name: 'Smt. Surekha Tai Pawar', phone: '+91 98230 11223', sector: 'Khed Sector' },
  'Pune Rural (Khed Sector)': { name: 'Smt. Surekha Tai Pawar', phone: '+91 98230 11223', sector: 'Khed Sector' },
  'Maharashtra Region': { name: 'Smt. Sunita Tai Shinde', phone: '+91 98230 44556', sector: 'Pune Rural' },
  'Rural District': { name: 'Smt. Anitha Tai Mane', phone: '+91 98230 77889', sector: 'General Rural' },
};

function resolveAshaWorker(district?: string): { name: string; phone: string; sector: string } {
  if (district && ASHA_WORKER_DIRECTORY[district]) {
    return ASHA_WORKER_DIRECTORY[district];
  }
  // Default fallback ASHA worker
  return { name: 'Smt. Anitha Tai Mane', phone: '+91 98230 77889', sector: district || 'Rural Sector' };
}

export interface NotificationResult {
  notificationId: string;
  smsDispatched: boolean;
  pushDispatched: boolean;
  ashaWorker: { name: string; phone: string; sector: string };
  smsBody: string;
}

/**
 * Dispatch an instant alert to the assigned ASHA worker when a case is flagged CRITICAL or HIGH.
 * 
 * This function:
 * 1. Resolves the ASHA worker for the district
 * 2. Constructs an SMS message body
 * 3. Simulates Twilio SMS dispatch (logs to console, would call Twilio API in production)
 * 4. Persists notification record to Firestore `asha_notifications` collection
 * 5. Returns the notification result for API response
 */
export async function notifyAshaWorker(alert: AshaAlert): Promise<NotificationResult> {
  const ashaWorker = resolveAshaWorker(alert.district);
  const notificationId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // Construct SMS body
  const smsBody = `🚨 AROGYA SAHAYAK ALERT [${alert.severity}]\n` +
    `District: ${alert.district || 'Rural Sector'}\n` +
    `Symptoms: ${alert.symptomTags?.join(', ') || 'Critical symptom reported'}\n` +
    `Reason: ${alert.escalationReason}\n` +
    `Patient Hash: ${alert.userIdHash.substring(0, 10)}...\n` +
    `Action: Immediate home visit required.\n` +
    `Alert ID: ${alert.id}\n` +
    `Time: ${new Date(alert.timestamp).toLocaleString('en-IN')}`;

  // === Simulated Twilio SMS Dispatch ===
  // In production, this would call: 
  //   twilio.messages.create({ body: smsBody, to: ashaWorker.phone, from: TWILIO_NUMBER })
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📱 [SMS GATEWAY] Dispatching instant ASHA alert via Twilio`);
  console.log(`   Recipient: ${ashaWorker.name} (${ashaWorker.phone})`);
  console.log(`   Severity: ${alert.severity}`);
  console.log(`   District: ${alert.district || 'Rural Sector'}`);
  console.log(`   Symptoms: ${alert.symptomTags?.join(', ')}`);
  console.log(`   Alert ID: ${alert.id}`);
  console.log(`${'='.repeat(60)}\n`);

  const smsDispatched = true; // Simulated success

  // Create notification record
  const notification: AshaNotification = {
    id: notificationId,
    alertId: alert.id,
    type: 'sms',
    recipientRole: 'asha',
    recipientDistrict: alert.district || 'Rural Sector',
    message: smsBody,
    severity: alert.severity,
    dispatched: smsDispatched,
    dispatchedAt: new Date().toISOString(),
    symptomTags: alert.symptomTags || [],
  };

  // Store in memory
  notificationLog.unshift(notification);

  // Also create an in-app push notification record
  const pushNotification: AshaNotification = {
    ...notification,
    id: notificationId + '_push',
    type: 'push',
  };
  notificationLog.unshift(pushNotification);

  // Persist to Firestore
  try {
    const notifRef = collection(db, 'asha_notifications');
    await setDoc(doc(notifRef, notificationId), sanitizeFirestoreData(notification));
    await setDoc(doc(notifRef, pushNotification.id), sanitizeFirestoreData(pushNotification));
    console.log(`[NOTIFICATION] Persisted to Firestore: ${notificationId}`);
  } catch (err) {
    console.warn('[NOTIFICATION] Firestore write fallback (memory only):', err);
  }

  return {
    notificationId,
    smsDispatched,
    pushDispatched: true,
    ashaWorker,
    smsBody,
  };
}

/**
 * Get all dispatched ASHA notifications (from Firestore with memory fallback)
 */
export async function getAshaNotifications(): Promise<AshaNotification[]> {
  try {
    const q = query(collection(db, 'asha_notifications'), orderBy('dispatchedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const notifications: AshaNotification[] = [];
      snapshot.forEach((docSnap: any) => {
        notifications.push(docSnap.data() as AshaNotification);
      });
      return notifications;
    }
  } catch (err) {
    console.warn('[NOTIFICATION] Firestore read fallback:', err);
  }
  return [...notificationLog];
}

/**
 * Get notifications from memory only (synchronous)
 */
export function getAshaNotificationsSync(): AshaNotification[] {
  return [...notificationLog];
}

/**
 * Resolve the ASHA worker for a given district (exported for use in triage response)
 */
export { resolveAshaWorker };
