import { PHCFacility } from '../types/health';
import { db, doc, getDoc, setDoc } from '../lib/firebase';

// In-memory cache for fast repeated lookups during session
const memoryCache = new Map<string, { timestamp: number; facilities: PHCFacility[] }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache TTL

export const FALLBACK_SAMPLE_FACILITIES: PHCFacility[] = [
  {
    id: 'fallback_phc_1',
    name: 'Sample Primary Health Centre (PHC)',
    type: 'PHC',
    lat: 18.8475,
    lng: 73.9056,
    district: 'Pune',
    state: 'Maharashtra',
    address: 'Sample Address - Live Overpass API Lookup Unavailable',
    phone: '+91 02135 222108',
    emergencyServices: true,
    isFallback: true,
    source: 'Sample Data (Fallback)'
  },
  {
    id: 'fallback_phc_2',
    name: 'Sample Rural Community Health Centre (CHC)',
    type: 'CHC',
    lat: 19.2081,
    lng: 73.8778,
    district: 'Pune',
    state: 'Maharashtra',
    address: 'Sample Address - Live Overpass API Lookup Unavailable',
    phone: '+91 02132 223450',
    emergencyServices: true,
    isFallback: true,
    source: 'Sample Data (Fallback)'
  }
];

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function getGeoBucketKey(lat: number, lng: number): string {
  // Round coordinates to ~0.1 decimal degree grid (~11km precision)
  const bLat = (Math.round(lat * 10) / 10).toFixed(1);
  const bLng = (Math.round(lng * 10) / 10).toFixed(1);
  return `geo_${bLat.replace('.', 'd')}_${bLng.replace('.', 'd')}`;
}

export async function fetchFacilitiesFromOverpass(userLat: number, userLng: number, radiusMeters = 50000): Promise<{ facilities: PHCFacility[]; isFallback: boolean; source: 'OpenStreetMap (Live)' | 'Sample Data (Fallback)' }> {
  const bucketKey = getGeoBucketKey(userLat, userLng);

  // 1. Check In-Memory Cache
  const memCached = memoryCache.get(bucketKey);
  if (memCached && (Date.now() - memCached.timestamp < CACHE_TTL_MS)) {
    const sorted = memCached.facilities.map(f => ({
      ...f,
      distanceKm: calculateHaversineDistance(userLat, userLng, f.lat, f.lng)
    })).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    return { facilities: sorted, isFallback: false, source: 'OpenStreetMap (Live)' };
  }

  // 2. Check Firestore Geo-Bucket Cache
  try {
    const cacheDocRef = doc(db, 'osm_facility_cache', bucketKey);
    const snap = await getDoc(cacheDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.facilities && Array.isArray(data.facilities) && data.timestamp && (Date.now() - data.timestamp < 24 * CACHE_TTL_MS)) {
        memoryCache.set(bucketKey, { timestamp: Date.now(), facilities: data.facilities });
        const sorted = (data.facilities as PHCFacility[]).map(f => ({
          ...f,
          distanceKm: calculateHaversineDistance(userLat, userLng, f.lat, f.lng)
        })).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

        return { facilities: sorted, isFallback: false, source: 'OpenStreetMap (Live)' };
      }
    }
  } catch (err) {
    console.warn('Firestore cache lookup skipped:', err);
  }

  // 3. Query OpenStreetMap Overpass API
  const query = `
[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusMeters},${userLat},${userLng});
  way["amenity"="hospital"](around:${radiusMeters},${userLat},${userLng});
  node["amenity"="clinic"](around:${radiusMeters},${userLat},${userLng});
  way["amenity"="clinic"](around:${radiusMeters},${userLat},${userLng});
  node["healthcare"](around:${radiusMeters},${userLat},${userLng});
  way["healthcare"](around:${radiusMeters},${userLat},${userLng});
  node["amenity"="doctors"](around:${radiusMeters},${userLat},${userLng});
);
out center body;
`;

  const overpassEndpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  for (const endpoint of overpassEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      if (!data.elements || !Array.isArray(data.elements)) continue;

      const liveFacilities: PHCFacility[] = [];

      data.elements.forEach((elem: any) => {
        const lat = elem.lat ?? elem.center?.lat;
        const lng = elem.lon ?? elem.center?.lon;
        if (!lat || !lng) return;

        const tags = elem.tags || {};
        const rawName = tags.name || tags['name:en'] || tags['name:hi'] || tags.operator || tags.brand;
        const amenity = tags.amenity;
        const healthcare = tags.healthcare;

        let type = 'Health Centre';
        if (amenity === 'hospital' || healthcare === 'hospital') {
          type = 'Hospital';
        } else if (amenity === 'clinic' || healthcare === 'clinic') {
          type = 'Clinic / PHC';
        } else if (healthcare === 'centre' || healthcare === 'center' || healthcare === 'subcentre') {
          type = 'Primary Health Centre (PHC)';
        } else if (amenity === 'doctors') {
          type = 'Medical Clinic';
        }

        const name = rawName || `${type} (OSM Facility)`;

        const addressComponents = [
          tags['addr:full'],
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:suburb'],
          tags['addr:city'] || tags['addr:district'],
          tags['addr:state'],
          tags['addr:postcode']
        ].filter(Boolean);

        const address = addressComponents.length > 0
          ? addressComponents.join(', ')
          : ([tags['addr:street'], tags['addr:suburb'], tags['addr:city'], tags['addr:district']].filter(Boolean).join(', ') || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

        const district = tags['addr:district'] || tags['addr:city'] || tags['addr:suburb'] || 'Local Area';
        const state = tags['addr:state'] || 'India';
        const phone = tags.phone || tags['contact:phone'] || tags['phone:mobile'] || 'Not available';
        const emergencyServices = tags.emergency === 'yes' || tags['healthcare:emergency'] === 'yes';
        const openingHours = tags.opening_hours || undefined;
        const operator = tags.operator || undefined;

        liveFacilities.push({
          id: `osm_${elem.type}_${elem.id}`,
          name,
          type,
          lat,
          lng,
          district,
          state,
          address,
          phone,
          emergencyServices,
          openingHours,
          operator,
          isFallback: false,
          source: 'OpenStreetMap (Live)'
        });
      });

      if (liveFacilities.length > 0) {
        // Save to cache
        memoryCache.set(bucketKey, { timestamp: Date.now(), facilities: liveFacilities });
        try {
          const cacheDocRef = doc(db, 'osm_facility_cache', bucketKey);
          setDoc(cacheDocRef, {
            bucketKey,
            facilities: liveFacilities,
            timestamp: Date.now()
          }, { merge: true }).catch(() => {});
        } catch (e) {}

        const sorted = liveFacilities.map(f => ({
          ...f,
          distanceKm: calculateHaversineDistance(userLat, userLng, f.lat, f.lng)
        })).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

        return { facilities: sorted, isFallback: false, source: 'OpenStreetMap (Live)' };
      }
    } catch (err) {
      console.warn(`Overpass fetch failed on endpoint ${endpoint}:`, err);
    }
  }

  // 4. Graceful Fallback if Overpass API fails
  const fallbackMapped = FALLBACK_SAMPLE_FACILITIES.map(f => ({
    ...f,
    distanceKm: calculateHaversineDistance(userLat, userLng, f.lat, f.lng)
  })).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return {
    facilities: fallbackMapped,
    isFallback: true,
    source: 'Sample Data (Fallback)'
  };
}

export async function getNearestFacilities(userLat?: number, userLng?: number, districtFilter?: string): Promise<{ facilities: PHCFacility[]; isFallback: boolean; source: 'OpenStreetMap (Live)' | 'Sample Data (Fallback)' }> {
  // Default coordinates: 18.8475, 73.9056 (Rural Pune) if no coordinates passed
  const refLat = userLat ?? 18.8475;
  const refLng = userLng ?? 73.9056;

  const result = await fetchFacilitiesFromOverpass(refLat, refLng);

  if (districtFilter && districtFilter.trim() !== '') {
    const filterLower = districtFilter.toLowerCase();
    const filtered = result.facilities.filter(f =>
      f.name.toLowerCase().includes(filterLower) ||
      f.district.toLowerCase().includes(filterLower) ||
      f.address.toLowerCase().includes(filterLower) ||
      f.type.toLowerCase().includes(filterLower)
    );
    if (filtered.length > 0) {
      return { ...result, facilities: filtered };
    }
  }

  return result;
}
