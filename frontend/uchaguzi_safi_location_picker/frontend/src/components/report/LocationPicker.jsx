/**
 * UCHAGUZI SAFI — LocationPicker Component
 * ===========================================
 * Reusable location input for the M3 Ripoti incident form
 * and any other component needing Kenya location selection.
 *
 * Three input modes (can be combined):
 *   1. GPS — "Use my current location" with Kenya bounds validation
 *   2. Manual — County → Constituency cascading dropdowns + landmark text
 *   3. Map — Mapbox GL mini-map with draggable marker for coordinate refinement
 *
 * GPS coordinates are validated against Kenya geographic bounds:
 *   Latitude:  -4.7 to  4.6
 *   Longitude: 33.9 to 41.9
 * (Matching backend constants in incidents.py)
 *
 * Props:
 *   county            — selected county string
 *   constituency      — selected constituency string
 *   locationDescription — landmark/address text
 *   locationLat       — latitude (float or null)
 *   locationLng       — longitude (float or null)
 *   onChange          — callback({ county, constituency, locationDescription,
 *                                   locationLat, locationLng })
 *   showMap           — whether to show the Mapbox mini-map (default true)
 *   required          — whether county is required (default true)
 *
 * Module: M3 Ripoti Ubadhirifu, reusable
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  MapPin, Crosshair, AlertCircle, ChevronDown, X, Navigation,
} from "lucide-react";

import KENYA_COUNTIES from "../../data/kenyaCounties";
import { getConstituencies } from "../../data/kenyaConstituencies";

/** Kenya geographic bounds — matches backend exactly */
const KENYA_BOUNDS = {
  latMin: -4.7, latMax: 4.6,
  lngMin: 33.9, lngMax: 41.9,
};

/** Kenya centre for default map view */
const KENYA_CENTER = { lat: 0.0236, lng: 37.9062 };

/** Mapbox token from environment */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

/** Validate coordinates are within Kenya */
function isWithinKenya(lat, lng) {
  return (
    lat >= KENYA_BOUNDS.latMin && lat <= KENYA_BOUNDS.latMax &&
    lng >= KENYA_BOUNDS.lngMin && lng <= KENYA_BOUNDS.lngMax
  );
}

/**
 * Approximate county centre coordinates for map focus.
 * Used when user selects a county manually (no GPS).
 * These are approximate centroids — good enough for map zoom.
 */
const COUNTY_CENTRES = {
  Mombasa:      { lat: -4.0435, lng: 39.6682 },
  Kwale:        { lat: -4.1816, lng: 39.4521 },
  Kilifi:       { lat: -3.5107, lng: 39.9093 },
  "Tana River": { lat: -1.8000, lng: 39.5000 },
  Lamu:         { lat: -2.2717, lng: 40.9020 },
  "Taita-Taveta":{ lat: -3.3160, lng: 38.4850 },
  Garissa:      { lat: -0.4532, lng: 39.6461 },
  Wajir:        { lat: 1.7471, lng: 40.0573 },
  Mandera:      { lat: 3.9373, lng: 41.8569 },
  Marsabit:     { lat: 2.3284, lng: 37.9910 },
  Isiolo:       { lat: 0.3546, lng: 37.5822 },
  Meru:         { lat: 0.0480, lng: 37.6559 },
  "Tharaka-Nithi":{ lat: -0.3069, lng: 37.7250 },
  Embu:         { lat: -0.5389, lng: 37.4596 },
  Kitui:        { lat: -1.3720, lng: 38.0106 },
  Machakos:     { lat: -1.5177, lng: 37.2634 },
  Makueni:      { lat: -1.8040, lng: 37.6220 },
  Nyandarua:    { lat: -0.1804, lng: 36.5236 },
  Nyeri:        { lat: -0.4197, lng: 36.9510 },
  Kirinyaga:    { lat: -0.6591, lng: 37.3827 },
  "Murang'a":   { lat: -0.7840, lng: 37.0400 },
  Kiambu:       { lat: -1.1714, lng: 36.8350 },
  Turkana:      { lat: 3.1160, lng: 35.5975 },
  "West Pokot": { lat: 1.6210, lng: 35.1195 },
  Samburu:      { lat: 1.2151, lng: 36.9541 },
  "Trans-Nzoia":{ lat: 1.0567, lng: 34.9507 },
  "Uasin Gishu":{ lat: 0.5143, lng: 35.2698 },
  "Elgeyo-Marakwet":{ lat: 0.7803, lng: 35.5123 },
  Nandi:        { lat: 0.1836, lng: 35.1269 },
  Baringo:      { lat: 0.4687, lng: 35.9651 },
  Laikipia:     { lat: 0.3606, lng: 36.7820 },
  Nakuru:       { lat: -0.3031, lng: 36.0800 },
  Narok:        { lat: -1.0875, lng: 35.8710 },
  Kajiado:      { lat: -2.0981, lng: 36.7820 },
  Kericho:      { lat: -0.3692, lng: 35.2863 },
  Bomet:        { lat: -0.7813, lng: 35.3416 },
  Kakamega:     { lat: 0.2827, lng: 34.7519 },
  Vihiga:       { lat: 0.0542, lng: 34.7232 },
  Bungoma:      { lat: 0.5635, lng: 34.5584 },
  Busia:        { lat: 0.4347, lng: 34.2422 },
  Siaya:        { lat: -0.0617, lng: 34.2422 },
  Kisumu:       { lat: -0.1022, lng: 34.7617 },
  "Homa Bay":   { lat: -0.5273, lng: 34.4571 },
  Migori:       { lat: -1.0634, lng: 34.4731 },
  Kisii:        { lat: -0.6813, lng: 34.7668 },
  Nyamira:      { lat: -0.5633, lng: 34.9347 },
  Nairobi:      { lat: -1.2864, lng: 36.8172 },
};


export default function LocationPicker({
  county = "",
  constituency = "",
  locationDescription = "",
  locationLat = null,
  locationLng = null,
  onChange,
  showMap = true,
  required = true,
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  /** Emit change to parent */
  const emit = useCallback(
    (updates) => {
      if (onChange) {
        onChange({
          county,
          constituency,
          locationDescription,
          locationLat,
          locationLng,
          ...updates,
        });
      }
    },
    [onChange, county, constituency, locationDescription, locationLat, locationLng]
  );

  /** Available constituencies for the selected county */
  const constituencies = useMemo(
    () => getConstituencies(county),
    [county]
  );

  // ── GPS Capture ───────────────────────────────────────────────

  const handleGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setGpsError("Your browser does not support location services");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);
    setGpsAccuracy(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      if (!isWithinKenya(latitude, longitude)) {
        setGpsError("Location appears to be outside Kenya's boundaries");
        setGpsLoading(false);
        return;
      }

      setGpsAccuracy(accuracy);
      emit({
        locationLat: latitude,
        locationLng: longitude,
      });
    } catch (err) {
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          setGpsError("Location permission denied. Please allow access or enter location manually.");
          break;
        case 2: // POSITION_UNAVAILABLE
          setGpsError("Location unavailable. Check your device settings.");
          break;
        case 3: // TIMEOUT
          setGpsError("Location request timed out. Try again or enter manually.");
          break;
        default:
          setGpsError("Could not determine your location.");
      }
    } finally {
      setGpsLoading(false);
    }
  }, [emit]);

  /** Clear GPS coordinates */
  const clearGPS = useCallback(() => {
    setGpsAccuracy(null);
    setGpsError(null);
    emit({ locationLat: null, locationLng: null });
  }, [emit]);

  // ── County change resets constituency ─────────────────────────

  const handleCountyChange = useCallback(
    (newCounty) => {
      emit({ county: newCounty, constituency: "" });
    },
    [emit]
  );

  // ── Mapbox mini-map ───────────────────────────────────────────
  // Using vanilla mapboxgl for the small preview to avoid
  // the weight of react-map-gl for a single marker.

  useEffect(() => {
    if (!showMap || !MAPBOX_TOKEN || !mapContainerRef.current) return;

    // Dynamically import mapbox-gl to avoid SSR issues
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const centre = locationLat && locationLng
        ? { lat: locationLat, lng: locationLng }
        : COUNTY_CENTRES[county] || KENYA_CENTER;

      const zoom = locationLat ? 13 : county ? 9 : 5.5;

      // Create or update map
      if (!mapRef.current) {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [centre.lng, centre.lat],
          zoom,
          maxBounds: [
            [KENYA_BOUNDS.lngMin - 1, KENYA_BOUNDS.latMin - 1],
            [KENYA_BOUNDS.lngMax + 1, KENYA_BOUNDS.latMax + 1],
          ],
          attributionControl: false,
        });
        mapRef.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          "top-right"
        );
      } else {
        mapRef.current.flyTo({ center: [centre.lng, centre.lat], zoom, duration: 800 });
      }

      // Update or create marker
      if (locationLat && locationLng) {
        if (markerRef.current) {
          markerRef.current.setLngLat([locationLng, locationLat]);
        } else {
          markerRef.current = new mapboxgl.Marker({
            color: "#006600",
            draggable: true,
          })
            .setLngLat([locationLng, locationLat])
            .addTo(mapRef.current);

          // Drag to adjust
          markerRef.current.on("dragend", () => {
            const lngLat = markerRef.current.getLngLat();
            if (isWithinKenya(lngLat.lat, lngLat.lng)) {
              emit({ locationLat: lngLat.lat, locationLng: lngLat.lng });
            } else {
              // Snap back
              markerRef.current.setLngLat([locationLng, locationLat]);
              setGpsError("Cannot move marker outside Kenya");
              setTimeout(() => setGpsError(null), 3000);
            }
          });
        }
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    });

    return () => {
      // Cleanup only on full unmount
    };
  }, [showMap, locationLat, locationLng, county, emit]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────

  const hasCoords = locationLat != null && locationLng != null;

  return (
    <div className="space-y-4">
      {/* ── GPS Button ──────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pin your location
        </label>

        {!hasCoords ? (
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            className="
              w-full flex items-center justify-center gap-2.5 rounded-xl
              border-2 border-dashed border-gray-300 bg-gray-50
              px-4 py-3.5 text-sm font-medium text-gray-600
              transition-all duration-200
              hover:border-[#006600] hover:bg-[#006600]/5 hover:text-[#006600]
              disabled:opacity-60 disabled:cursor-wait
            "
          >
            {gpsLoading ? (
              <>
                <Crosshair className="h-4 w-4 animate-spin" />
                <span>Detecting location...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>Use my current location</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl border-2 border-[#006600] bg-[#006600]/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006600]/10">
                <MapPin className="h-4 w-4 text-[#006600]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#006600]">
                  {locationLat.toFixed(5)}, {locationLng.toFixed(5)}
                </p>
                {gpsAccuracy && (
                  <p className="text-[10px] text-gray-500">
                    ±{gpsAccuracy < 1000 ? `${Math.round(gpsAccuracy)}m` : `${(gpsAccuracy / 1000).toFixed(1)}km`} accuracy
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={clearGPS}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
              title="Clear location"
            >
              <X className="h-4 w-4 text-[#006600]" />
            </button>
          </div>
        )}

        {gpsError && (
          <div className="mt-2 flex items-start gap-2 text-xs text-[#BB0000]">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* ── County & Constituency ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* County */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            County {required && <span className="text-[#BB0000]">*</span>}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={county}
              onChange={(e) => handleCountyChange(e.target.value)}
              className="
                w-full appearance-none rounded-xl border border-gray-200 bg-white
                py-2.5 pl-10 pr-9 text-sm text-gray-900
                focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
              "
            >
              <option value="">Select county</option>
              {KENYA_COUNTIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Constituency */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Constituency
          </label>
          <div className="relative">
            <select
              value={constituency}
              onChange={(e) => emit({ constituency: e.target.value })}
              disabled={!county}
              className="
                w-full appearance-none rounded-xl border border-gray-200 bg-white
                py-2.5 pl-4 pr-9 text-sm text-gray-900
                focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
                disabled:bg-gray-50 disabled:text-gray-400
              "
            >
              <option value="">
                {county ? "Select constituency" : "Select county first"}
              </option>
              {constituencies.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {county && (
            <p className="mt-1 text-[10px] text-gray-400">
              {constituencies.length} constituencies in {county}
            </p>
          )}
        </div>
      </div>

      {/* ── Landmark / Address ──────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Landmark or address <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={locationDescription}
          onChange={(e) => emit({ locationDescription: e.target.value })}
          placeholder="e.g., Near Uhuru Park main entrance, opposite Kenyatta Avenue"
          maxLength={500}
          className="
            w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
            text-sm text-gray-900 placeholder:text-gray-400
            focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
          "
        />
      </div>

      {/* ── Map Preview ─────────────────────────────────────── */}
      {showMap && MAPBOX_TOKEN && (
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="h-44 w-full rounded-xl overflow-hidden border border-gray-200"
          />
          {hasCoords && (
            <p className="mt-1 text-[10px] text-gray-400 text-center">
              Drag the marker to adjust the exact location
            </p>
          )}
        </div>
      )}

      {/* Map unavailable fallback — no MAPBOX_TOKEN */}
      {showMap && !MAPBOX_TOKEN && hasCoords && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
          <MapPin className="h-5 w-5 text-gray-400 mx-auto" />
          <p className="mt-1 text-xs text-gray-500">
            Map preview requires VITE_MAPBOX_TOKEN
          </p>
          <p className="text-[10px] text-gray-400">
            Coordinates captured: {locationLat?.toFixed(5)}, {locationLng?.toFixed(5)}
          </p>
        </div>
      )}
    </div>
  );
}
