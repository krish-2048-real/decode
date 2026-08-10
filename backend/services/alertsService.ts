import { AshaAlert } from '../../src/types/health';
import { db, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, setDoc } from '../../src/lib/firebase';

const memoryAlerts: AshaAlert[] = [];

export function generateUserIdHash(userId: string): string {
  if (!userId) userId = 'anonymous_' + Math.random().toString();
  let hash = 0;
  const str = userId + '_salt_arogya_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(16).padStart(8, '0');
  return (positiveHash + positiveHash + positiveHash + positiveHash).substring(0, 32);
}

export async function createAshaAlertAsync(alertData: Omit<AshaAlert, 'id' | 'status' | 'timestamp'>): Promise<AshaAlert> {
  const alertId = 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newAlert: AshaAlert = {
    ...alertData,
    id: alertId,
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  memoryAlerts.unshift(newAlert);

  try {
    const alertsRef = collection(db, 'asha_alerts');
    await setDoc(doc(alertsRef, alertId), newAlert);
  } catch (err) {
    console.warn('Could not persist alert to Firestore (falling back to memory):', err);
  }

  return newAlert;
}

export function createAshaAlert(alertData: Omit<AshaAlert, 'id' | 'status' | 'timestamp'>): AshaAlert {
  const alertId = 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newAlert: AshaAlert = {
    ...alertData,
    id: alertId,
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  memoryAlerts.unshift(newAlert);

  try {
    const alertsRef = collection(db, 'asha_alerts');
    setDoc(doc(alertsRef, alertId), newAlert).catch(e => console.warn('Firestore write error:', e));
  } catch (err) {
    console.warn('Firestore sync error:', err);
  }

  return newAlert;
}

export async function getAshaAlertsAsync(): Promise<AshaAlert[]> {
  try {
    const q = query(collection(db, 'asha_alerts'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const fsAlerts: AshaAlert[] = [];
      snapshot.forEach(docSnap => {
        fsAlerts.push(docSnap.data() as AshaAlert);
      });
      return fsAlerts;
    }
  } catch (err) {
    console.warn('Could not read from Firestore, returning memory cache:', err);
  }
  return [...memoryAlerts];
}

export function getAshaAlerts(): AshaAlert[] {
  return [...memoryAlerts];
}

export async function updateAshaAlertStatusAsync(alertId: string, status: 'pending' | 'acknowledged' | 'visited'): Promise<AshaAlert | null> {
  const alert = memoryAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = status;
  }

  try {
    const alertDocRef = doc(db, 'asha_alerts', alertId);
    await updateDoc(alertDocRef, { status });
  } catch (err) {
    console.warn('Failed to update Firestore alert status:', err);
  }

  return alert || null;
}

export function updateAshaAlertStatus(alertId: string, status: 'pending' | 'acknowledged' | 'visited'): AshaAlert | null {
  const alert = memoryAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = status;
    try {
      const alertDocRef = doc(db, 'asha_alerts', alertId);
      updateDoc(alertDocRef, { status }).catch(e => console.warn('Firestore update error:', e));
    } catch (err) {
      console.warn('Firestore update error:', err);
    }
    return alert;
  }
  return null;
}
