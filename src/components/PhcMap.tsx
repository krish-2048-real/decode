import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PHCFacility } from '../types/health';
import { getNearestFacilities } from '../../backend/services/facilitiesService';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Navigation, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Clock,
  Compass,
  RefreshCw,
  Globe,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const PhcMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [facilities, setFacilities] = useState<PHCFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<PHCFacility | null>(null);
  const [districtFilter, setDistrictFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Geolocation states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'requesting' | 'granted' | 'denied' | 'unsupported'>('requesting');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [dataSourceInfo, setDataSourceInfo] = useState<{ isFallback: boolean; source: string }>({
    isFallback: false,
    source: 'OpenStreetMap (Live)'
  });

  const requestGeolocation = () => {
    setGeoStatus('requesting');
    setGeoError(null);

    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported');
      setGeoError('Browser geolocation is not supported in this environment.');
      fetchFacilities(18.8475, 73.9056); // Default Pune rural fallback
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        setGeoStatus('granted');
        fetchFacilities(lat, lng);
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err.message);
        setGeoStatus('denied');
        setGeoError(err.message || 'Location permission denied. Using default rural region.');
        fetchFacilities(18.8475, 73.9056);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const fetchFacilities = async (lat?: number, lng?: number, dist?: string) => {
    setIsLoading(true);
    let loadedFacilities: PHCFacility[] | null = null;
    let fallbackFlag = false;
    let sourceText = 'OpenStreetMap (Live)';

    try {
      const params = new URLSearchParams();
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lng !== undefined) params.append('lng', lng.toString());
      if (dist) params.append('district', dist);

      const url = `/api/phcFacilities?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.facilities)) {
          loadedFacilities = data.facilities;
          fallbackFlag = Boolean(data.isFallback);
          sourceText = data.source || 'OpenStreetMap (Live)';
        }
      }
    } catch (err) {
      console.warn('API /api/phcFacilities unavailable, using direct client facility service fallback:', err);
    }

    if (!loadedFacilities) {
      try {
        const fallbackRes = await getNearestFacilities(lat, lng, dist);
        loadedFacilities = fallbackRes.facilities;
        fallbackFlag = fallbackRes.isFallback;
        sourceText = fallbackRes.source;
      } catch (fErr) {
        console.error('Client facility service fallback error:', fErr);
      }
    }

    if (loadedFacilities && loadedFacilities.length > 0) {
      setFacilities(loadedFacilities);
      setDataSourceInfo({ isFallback: fallbackFlag, source: sourceText });
      setSelectedFacility(loadedFacilities[0]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    requestGeolocation();
  }, []);

  // Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = userCoords?.lat || 18.8475;
      const initialLng = userCoords?.lng || 73.9056;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    // 1. Add User Location Marker if available
    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; width: 24px; height: 24px; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
      userMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #2563eb; font-size: 13px;">📍 Your Current GPS Location</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}</span>
        </div>
      `);
      bounds.extend([userCoords.lat, userCoords.lng]);
    }

    // 2. Add Facility Markers
    if (facilities.length > 0) {
      facilities.forEach((fac) => {
        const marker = L.marker([fac.lat, fac.lng]).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
            <strong style="color: #b45309; font-size: 13px;">${fac.name}</strong><br/>
            <span style="font-size: 11px; color: #475569;">${fac.type} • ${fac.distanceKm ? fac.distanceKm + ' km away' : ''}</span><br/>
            <small style="color: #16a34a; display: block; margin-top: 2px;">
              ${fac.emergencyServices ? '🚑 24/7 Emergency Care' : '🏥 Standard Healthcare'}
            </small>
            <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">${fac.address}</span>
          </div>
        `);

        marker.on('click', () => {
          setSelectedFacility(fac);
        });

        bounds.extend([fac.lat, fac.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [facilities, userCoords]);

  const handleSearchDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFacilities(userCoords?.lat, userCoords?.lng, districtFilter);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Geolocation Status Bar */}
      <div className="bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl p-6 border border-[#E5E0D8] dark:border-[#26232D] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase">
              Real-Time OpenStreetMap Infrastructure
            </span>
            {/* Live Data Source Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center space-x-1 ${
              dataSourceInfo.isFallback
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
            }`}>
              <Globe className="w-3 h-3" />
              <span>{dataSourceInfo.source}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-1">
            <Building2 className="w-6 h-6 text-[#D4A24E] dark:text-[#E0A845]" />
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
              Primary Health Centre (PHC) & Clinic Finder
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Queries live OpenStreetMap healthcare nodes around your verified browser location.
          </p>
        </div>

        {/* GPS Control & District Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {/* GPS Re-trigger Button */}
          <button
            onClick={requestGeolocation}
            disabled={geoStatus === 'requesting'}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            {geoStatus === 'requesting' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Compass className="w-3.5 h-3.5 text-blue-200" />
            )}
            <span>{geoStatus === 'granted' ? 'Re-center GPS' : 'Use Live Location'}</span>
          </button>

          {/* District Filter Input */}
          <form onSubmit={handleSearchDistrict} className="flex items-center space-x-2 flex-1 sm:w-64">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                placeholder="Filter by name/district..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#D4A24E]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Geolocation & Fallback Status Notice Banner */}
      {geoStatus === 'granted' && userCoords && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>
              <strong>GPS Location Verified:</strong> Lat: {userCoords.lat.toFixed(4)}, Lng: {userCoords.lng.toFixed(4)} — Radius search: 50km
            </span>
          </div>
          <span className="text-[10px] bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-md font-bold uppercase">
            Active GPS
          </span>
        </div>
      )}

      {geoStatus === 'denied' && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Location access was denied or unavailable. Showing facilities for rural Pune reference coordinates. Use search filter or grant GPS permissions to update.
          </span>
        </div>
      )}

      {dataSourceInfo.isFallback && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-400 dark:border-amber-700 flex items-center space-x-2 text-xs font-bold text-amber-950 dark:text-amber-200 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            ⚠️ Sample Data — Live OpenStreetMap lookup was unavailable. Showing realistic sample entries for demonstration.
          </span>
        </div>
      )}

      {/* Main Grid: Leaflet Map + Facility Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaflet Map Container */}
        <div className="lg:col-span-2 bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl border border-[#E5E0D8] dark:border-[#26232D] shadow-lg overflow-hidden h-[520px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          
          <div className="absolute top-3 right-3 z-10 bg-[#FAFAF7]/90 dark:bg-[#151318]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#E5E0D8] dark:border-stone-800 shadow-xs text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-[#D4A24E]" />
            <span>OpenStreetMap Tiles ({facilities.length} Verified Nodes)</span>
          </div>
        </div>

        {/* Facilities List & Detail Panel */}
        <div className="space-y-3 h-[520px] overflow-y-auto pr-1">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200 flex items-center justify-between">
            <span>Nearby Healthcare Facilities ({facilities.length})</span>
            <span className="text-xs text-[#916323] dark:text-[#E0A845] font-bold">Sorted by Distance</span>
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400 space-y-2 bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl border border-[#E5E0D8] dark:border-[#26232D]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D4A24E]" />
              <p>Fetching real OpenStreetMap facilities around coordinates...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 dark:text-stone-400 bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl border border-[#E5E0D8] dark:border-[#26232D]">
              No hospital or clinic nodes found in this 50km radius. Try clearing the filter or adjusting location.
            </div>
          ) : (
            facilities.map((fac) => {
              const isSelected = selectedFacility?.id === fac.id;

              return (
                <div
                  key={fac.id}
                  onClick={() => {
                    setSelectedFacility(fac);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.panTo([fac.lat, fac.lng]);
                      mapInstanceRef.current.setZoom(14);
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4A24E]/10 dark:bg-[#D4A24E]/15 border-[#D4A24E] dark:border-[#D4A24E] shadow-md ring-2 ring-[#D4A24E]/20'
                      : 'bg-[#FAFAF7] dark:bg-[#151318] border-[#E5E0D8] dark:border-[#26232D] hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#D4A24E]/15 dark:bg-[#D4A24E]/20 text-[#916323] dark:text-[#E0A845]">
                          {fac.type}
                        </span>
                        {fac.operator && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {fac.operator}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mt-1">
                        {fac.name}
                      </h4>
                    </div>
                    {fac.distanceKm !== undefined && (
                      <span className="text-xs font-extrabold text-[#916323] dark:text-[#E0A845] bg-[#D4A24E]/15 dark:bg-[#D4A24E]/20 px-2 py-1 rounded-md shrink-0">
                        {fac.distanceKm} km
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 flex items-start space-x-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400 mt-0.5" />
                    <span>{fac.address}</span>
                  </p>

                  {fac.openingHours && (
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>Hours: {fac.openingHours}</span>
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{fac.emergencyServices ? '24/7 Emergency Care' : 'Government/Community Health'}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Directions</span>
                      </a>

                      {fac.phone && fac.phone !== 'Not available' && (
                        <a
                          href={`tel:${fac.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-xs font-bold text-[#916323] dark:text-[#E0A845] hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
