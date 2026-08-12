import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PHCFacility } from '../types/health';
import { getNearestFacilities } from '../services/facilitiesService';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [facilities, setFacilities] = useState<PHCFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<PHCFacility | null>(null);
  const [districtFilter, setDistrictFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Compute live filtered facilities based on case-insensitive partial match across name, district, block, address, and type
  const filteredFacilities = React.useMemo(() => {
    const query = districtFilter.trim().toLowerCase();
    if (!query) return facilities;

    return facilities.filter((fac) => {
      const nameMatch = fac.name ? fac.name.toLowerCase().includes(query) : false;
      const districtMatch = fac.district ? fac.district.toLowerCase().includes(query) : false;
      const blockMatch = fac.block ? fac.block.toLowerCase().includes(query) : false;
      const addressMatch = fac.address ? fac.address.toLowerCase().includes(query) : false;
      const typeMatch = fac.type ? fac.type.toLowerCase().includes(query) : false;
      return nameMatch || districtMatch || blockMatch || addressMatch || typeMatch;
    });
  }, [facilities, districtFilter]);

  // Keep selected facility in sync with filtered list
  useEffect(() => {
    if (filteredFacilities.length > 0) {
      if (!selectedFacility || !filteredFacilities.some(f => f.id === selectedFacility.id)) {
        setSelectedFacility(filteredFacilities[0]);
      }
    } else {
      setSelectedFacility(null);
    }
  }, [filteredFacilities]);
  
  // Geolocation & Search Location states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedCoords, setSearchedCoords] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'requesting' | 'granted' | 'denied' | 'unsupported'>('requesting');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [dataSourceInfo, setDataSourceInfo] = useState<{ isFallback: boolean; source: string }>({
    isFallback: false,
    source: 'OpenStreetMap (Live)'
  });

  const activeCenter = searchedCoords || userCoords || { lat: 18.8475, lng: 73.9056 };

  const requestGeolocation = () => {
    setGeoStatus('requesting');
    setGeoError(null);
    setSearchedCoords(null);
    setDistrictFilter('');

    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported');
      setGeoError('Browser geolocation is not supported in this environment.');
      fetchFacilities(18.8475, 73.9056); // Default Pune rural fallback
      return;
    }

    const handlePositionSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      console.log(`[Geolocation Success] GPS Coordinates: Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)} (Accuracy: ${pos.coords.accuracy}m)`);
      setUserCoords({ lat, lng });
      setGeoStatus('granted');
      fetchFacilities(lat, lng);
    };

    const handlePositionError = (err: GeolocationPositionError) => {
      let errMsg = '';
      let codeStr = '';
      switch (err.code) {
        case err.PERMISSION_DENIED: // Code 1
          codeStr = 'PERMISSION_DENIED (Code 1)';
          errMsg = 'Permission blocked by browser or user setting.';
          break;
        case err.POSITION_UNAVAILABLE: // Code 2
          codeStr = 'POSITION_UNAVAILABLE (Code 2)';
          errMsg = 'GPS/Network positioning signal unavailable.';
          break;
        case err.TIMEOUT: // Code 3
          codeStr = 'TIMEOUT (Code 3)';
          errMsg = 'High-accuracy GPS request timed out.';
          break;
        default:
          codeStr = `UNKNOWN_ERROR (Code ${err.code})`;
          errMsg = err.message || 'Geolocation request failed.';
      }

      console.warn(`[Geolocation Error] ${codeStr}: ${err.message}`);

      // If high accuracy timed out or was unavailable, retry once with low accuracy (WiFi/cellular IP triangulation)
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        console.log('[Geolocation Retry] Attempting low-accuracy fallback...');
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          (retryErr) => {
            console.warn(`[Geolocation Retry Failed] Code ${retryErr.code}: ${retryErr.message}`);
            setGeoStatus('denied');
            setGeoError(`${errMsg} (Retry code ${retryErr.code})`);
            fetchFacilities(18.8475, 73.9056);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
        return;
      }

      setGeoStatus('denied');
      setGeoError(errMsg);
      fetchFacilities(18.8475, 73.9056);
    };

    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  };

  const fetchFacilities = async (lat?: number, lng?: number, dist?: string) => {
    setIsLoading(true);
    let loadedFacilities: PHCFacility[] | null = null;
    let fallbackFlag = false;
    let sourceText = 'OpenStreetMap (Live)';

    const targetLat = lat !== undefined ? lat : activeCenter.lat;
    const targetLng = lng !== undefined ? lng : activeCenter.lng;

    try {
      const params = new URLSearchParams();
      params.append('lat', targetLat.toString());
      params.append('lng', targetLng.toString());
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
        const fallbackRes = await getNearestFacilities(targetLat, targetLng, dist);
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
    } else {
      setFacilities([]);
      setSelectedFacility(null);
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
      const initialLat = activeCenter.lat;
      const initialLng = activeCenter.lng;

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

    // 1. Add User GPS Location Marker if available
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

    // 2. Add Searched Location Pin if location search was performed
    if (searchedCoords) {
      const searchIcon = L.divIcon({
        className: 'searched-location-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px;">
            <div style="position: absolute; width: 28px; height: 28px; background: rgba(212, 162, 78, 0.5); border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; background: #d97706; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4); text-align: center; color: white; font-weight: bold; font-size: 10px; line-height: 14px;">🎯</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const searchMarker = L.marker([searchedCoords.lat, searchedCoords.lng], { icon: searchIcon }).addTo(map);
      searchMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
          <strong style="color: #d97706; font-size: 13px;">🎯 Active Search Center</strong><br/>
          <span style="font-size: 11px; color: #334155;">${searchedCoords.name}</span><br/>
          <small style="color: #64748b;">${searchedCoords.lat.toFixed(4)}, ${searchedCoords.lng.toFixed(4)}</small>
        </div>
      `);
      bounds.extend([searchedCoords.lat, searchedCoords.lng]);
    }

    // 3. Add Facility Markers
    if (filteredFacilities.length > 0) {
      filteredFacilities.forEach((fac) => {
        const marker = L.marker([fac.lat, fac.lng]).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
            <strong style="color: #b45309; font-size: 13px;">${fac.name}</strong><br/>
            <span style="font-size: 11px; color: #475569;">${fac.type} • ${fac.distanceKm !== undefined ? fac.distanceKm + ' km away' : ''}</span><br/>
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
    } else if (searchedCoords || userCoords) {
      map.setView([activeCenter.lat, activeCenter.lng], 12);
    }
  }, [filteredFacilities, userCoords, searchedCoords]);

  const handleSearchDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtFilter || !districtFilter.trim()) {
      handleClearFilter();
      return;
    }

    const query = districtFilter.trim();
    console.log('Location/Facility search initiated for query:', query);
    setIsLoading(true);

    try {
      // 1. Try geocoding place name to new coordinates
      const geocodeRes = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (geocodeRes.ok) {
        const geoData = await geocodeRes.json();
        if (geoData && geoData.success && geoData.lat && geoData.lng) {
          console.log(`Location geocoded successfully: "${query}" -> Lat: ${geoData.lat}, Lng: ${geoData.lng} (${geoData.displayName})`);
          const newSearched = {
            lat: geoData.lat,
            lng: geoData.lng,
            name: geoData.displayName || query
          };
          setSearchedCoords(newSearched);

          // Center map on new location immediately
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([geoData.lat, geoData.lng], 12);
          }

          // Refetch facilities around THOSE new coordinates!
          await fetchFacilities(geoData.lat, geoData.lng, '');
          return;
        }
      }
    } catch (err) {
      console.warn('Geocoding lookup notice:', err);
    }

    // Fallback: If not a geocodable place name, search facilities using active coordinates with text filter
    console.log('Searching facilities around current center with text filter:', query);
    await fetchFacilities(activeCenter.lat, activeCenter.lng, query);
  };

  const handleClearFilter = () => {
    console.log('Clearing location search filter and restoring center');
    setDistrictFilter('');
    setSearchedCoords(null);
    const baseLat = userCoords?.lat || 18.8475;
    const baseLng = userCoords?.lng || 73.9056;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([baseLat, baseLng], 11);
    }

    fetchFacilities(baseLat, baseLng, '');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Geolocation Status Bar */}
      <div className="bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl p-6 border border-[#E5E0D8] dark:border-[#26232D] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold tracking-widest text-[#B68434] dark:text-[#E0A845] uppercase">
              {t('osmInfraTitle')}
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
              {t('phcFinderHeader')}
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t('phcFinderDesc')}
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
            <span>{geoStatus === 'granted' ? t('recenterGps') : t('useLiveLocation')}</span>
          </button>

          {/* District Filter Input */}
          <form onSubmit={handleSearchDistrict} className="flex items-center space-x-2 flex-1 sm:w-72">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={districtFilter}
                onChange={(e) => {
                  console.log('Filter query changed:', e.target.value);
                  setDistrictFilter(e.target.value);
                }}
                placeholder={t('filterPlaceholder')}
                className="w-full pl-9 pr-7 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#D4A24E]"
              />
              {districtFilter && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold px-1 rounded-full cursor-pointer"
                  title="Clear filter"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 text-xs font-extrabold transition-colors shadow-sm cursor-pointer shrink-0"
            >
              {t('filterBtn')}
            </button>
          </form>
        </div>
      </div>

      {/* Searched Location Banner */}
      {searchedCoords && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs text-amber-950 dark:text-amber-100">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>{t('activeSearchLocation')}</strong> {searchedCoords.name} ({searchedCoords.lat.toFixed(4)}, {searchedCoords.lng.toFixed(4)})
            </span>
          </div>
          <button
            onClick={handleClearFilter}
            className="text-[10px] bg-amber-200 dark:bg-amber-900 hover:bg-amber-300 text-amber-900 dark:text-amber-100 px-2.5 py-1 rounded-md font-bold uppercase cursor-pointer"
          >
            {t('resetToGps')}
          </button>
        </div>
      )}

      {/* Geolocation & Fallback Status Notice Banner */}
      {geoStatus === 'granted' && userCoords && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>
              <strong>{t('gpsVerified')}</strong> Lat: {userCoords.lat.toFixed(4)}, Lng: {userCoords.lng.toFixed(4)}
            </span>
          </div>
          <span className="text-[10px] bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-md font-bold uppercase">
            Active GPS
          </span>
        </div>
      )}

      {geoStatus === 'denied' && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-start justify-between text-xs text-amber-950 dark:text-amber-100 shadow-xs">
          <div className="flex items-start space-x-2 pr-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-bold">{t('gpsAccessNotice')} ({geoError || 'Permission Denied / Signal Timeout'})</strong>
              <p className="text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed">
                {t('gpsNoticeDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={requestGeolocation}
            className="px-3.5 py-2 bg-[#D4A24E] hover:bg-[#E0A845] text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer shadow-xs shrink-0 flex items-center space-x-1.5 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>{t('useLiveGps')}</span>
          </button>
        </div>
      )}

      {dataSourceInfo.isFallback && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-400 dark:border-amber-700 flex items-center space-x-2 text-xs font-bold text-amber-950 dark:text-amber-200 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {t('sampleDataNotice')}
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
            <span>{t('osmTilesShown')} ({filteredFacilities.length})</span>
          </div>
        </div>

        {/* Facilities List & Detail Panel */}
        <div className="space-y-3 h-[520px] overflow-y-auto pr-1">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200 flex items-center justify-between">
            <span>{t('nearbyFacilitiesHeader')} ({filteredFacilities.length})</span>
            {districtFilter && (
              <button
                onClick={handleClearFilter}
                className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
              >
                {t('clearFilter')}
              </button>
            )}
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400 space-y-2 bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl border border-[#E5E0D8] dark:border-[#26232D]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D4A24E]" />
              <p>{t('fetchingFacilities')}</p>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 dark:text-stone-400 bg-[#FAFAF7] dark:bg-[#151318] rounded-2xl border border-[#E5E0D8] dark:border-[#26232D] space-y-2">
              <p>{t('noFacilitiesFound')} &quot;{districtFilter}&quot;.</p>
              <button
                onClick={handleClearFilter}
                className="px-3 py-1 bg-[#D4A24E] text-slate-950 font-bold rounded-lg text-xs cursor-pointer hover:bg-[#E0A845]"
              >
                {t('resetSearch')}
              </button>
            </div>
          ) : (
            filteredFacilities.map((fac) => {
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
                      <span>{t('hoursLabel')} {fac.openingHours}</span>
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{fac.emergencyServices ? t('emergency247') : t('govtCommHealth')}</span>
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
                        <span>{t('directions')}</span>
                      </a>

                      {fac.phone && fac.phone !== 'Not available' && (
                        <a
                          href={`tel:${fac.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-xs font-bold text-[#916323] dark:text-[#E0A845] hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{t('call')}</span>
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
