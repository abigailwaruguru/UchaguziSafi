/**
 * UCHAGUZI SAFI — KenyaCountyMap Component
 * ============================================
 * Interactive choropleth map of Kenya's 47 counties showing
 * campaign spending intensity for the M2 Taswira module.
 *
 * Technology:
 *   react-map-gl (v7) wrapping Mapbox GL JS (v3)
 *   GeoJSON county boundaries loaded from /data/kenya-counties.geojson
 *
 * Choropleth colour scale:
 *   Light yellow (#FFFFCC) → Orange (#FD8D3C) → Dark red (#BB0000)
 *   Computed from normalised spending intensity (0–1)
 *
 * Interactions:
 *   - Hover: Highlight county border + show CountyTooltip
 *   - Click: Navigate to candidates filtered by county
 *   - Touch: Tap to select county (mobile)
 *
 * Mapbox token:
 *   Uses VITE_MAPBOX_TOKEN env variable.
 *   Fallback: renders a static SVG map if no token is set.
 *
 * Module: M2 Taswira (Data Visualisation)
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MapGL, { Source, Layer, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import CountyTooltip from "./CountyTooltip";
import MapLegend from "./MapLegend";

/** Mapbox token from environment */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

/** Kenya centre (Nairobi) and default zoom */
const KENYA_CENTER = { latitude: 0.0236, longitude: 37.9062 };
const DEFAULT_ZOOM = 5.8;

/**
 * 5-step colour scale matching MapLegend gradient.
 * Used for Mapbox GL fill-color interpolation.
 */
const COLOUR_STOPS = [
  [0.0, "#FFFFCC"],
  [0.25, "#FED976"],
  [0.5, "#FD8D3C"],
  [0.75, "#E31A1C"],
  [1.0, "#BB0000"],
];

/**
 * Interpolate colour from normalised intensity (0–1).
 * Used for the GeoJSON source feature-state approach.
 */
function interpolateColor(intensity) {
  const t = Math.max(0, Math.min(1, intensity));
  // Simple 5-stop linear interpolation
  for (let i = 0; i < COLOUR_STOPS.length - 1; i++) {
    const [t0, c0] = COLOUR_STOPS[i];
    const [t1, c1] = COLOUR_STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return lerpHex(c0, c1, f);
    }
  }
  return COLOUR_STOPS[COLOUR_STOPS.length - 1][1];
}

function lerpHex(hex1, hex2, t) {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function KenyaCountyMap({
  spendingLookup = {},
  minSpending = 0,
  maxSpending = 0,
  nationalTotal = 0,
  isLoading = false,
}) {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [viewState, setViewState] = useState({
    ...KENYA_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [geojson, setGeojson] = useState(null);
  const [geojsonError, setGeojsonError] = useState(false);

  // ── Load GeoJSON ──────────────────────────────────────────────
  useEffect(() => {
    fetch("/data/kenya-counties.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("GeoJSON not found");
        return res.json();
      })
      .then((data) => setGeojson(data))
      .catch(() => setGeojsonError(true));
  }, []);

  // ── Inject spending data into GeoJSON properties ──────────────
  const enrichedGeojson = useMemo(() => {
    if (!geojson || !geojson.features) return null;

    return {
      ...geojson,
      features: geojson.features.map((feature) => {
        const countyName = feature.properties?.county_name
          || feature.properties?.COUNTY_NAM
          || feature.properties?.NAME_1
          || feature.properties?.name
          || "";

        const spending = spendingLookup[countyName] || null;
        const intensity = spending?.intensity || 0;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            county_name: countyName,
            fill_color: interpolateColor(intensity),
            spending_amount: spending?.total_spending || 0,
            candidate_count: spending?.candidate_count || 0,
            has_data: !!spending,
          },
        };
      }),
    };
  }, [geojson, spendingLookup]);

  // ── Hover handler ─────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (event) => {
      setCursorPos({ x: event.point.x, y: event.point.y });

      const feature = event.features && event.features[0];
      if (feature) {
        const countyName = feature.properties?.county_name || "";
        const data = spendingLookup[countyName] || null;
        setHoveredCounty(
          data
            ? data
            : { county: countyName, county_code: "—", total_spending: 0, candidate_count: 0 }
        );
      } else {
        setHoveredCounty(null);
      }
    },
    [spendingLookup]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCounty(null);
  }, []);

  // ── Click handler — navigate to candidate list filtered by county ──
  const handleClick = useCallback(
    (event) => {
      const feature = event.features && event.features[0];
      if (feature) {
        const countyName = feature.properties?.county_name || "";
        if (countyName) {
          navigate(`/candidates?county=${encodeURIComponent(countyName)}`);
        }
      }
    },
    [navigate]
  );

  // ── Fallback: No Mapbox token or GeoJSON error ────────────────
  if (!MAPBOX_TOKEN || geojsonError) {
    return (
      <div className="relative h-full w-full rounded-2xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h3 className="text-lg font-bold text-gray-900">Map Unavailable</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md">
          {!MAPBOX_TOKEN
            ? "Set VITE_MAPBOX_TOKEN in your .env file to enable the interactive map. You can get a free token at mapbox.com."
            : "Kenya county boundaries file could not be loaded. Place kenya-counties.geojson in the /public/data/ directory."
          }
        </p>
        {!MAPBOX_TOKEN && (
          <code className="mt-3 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
            VITE_MAPBOX_TOKEN=pk.eyJ1Ij...
          </code>
        )}
        {/* Still show legend with spending data */}
        <MapLegend
          minSpending={minSpending}
          maxSpending={maxSpending}
          nationalTotal={nationalTotal}
        />
      </div>
    );
  }

  // ── Layer styles ──────────────────────────────────────────────
  const fillLayer = {
    id: "county-fill",
    type: "fill",
    paint: {
      "fill-color": ["get", "fill_color"],
      "fill-opacity": [
        "case",
        ["boolean", ["get", "has_data"], false],
        0.7,
        0.15,
      ],
    },
  };

  const outlineLayer = {
    id: "county-outline",
    type: "line",
    paint: {
      "line-color": "#FFFFFF",
      "line-width": 1,
    },
  };

  const hoverOutlineLayer = {
    id: "county-hover-outline",
    type: "line",
    paint: {
      "line-color": "#006600",
      "line-width": 2.5,
    },
    filter: hoveredCounty
      ? ["==", ["get", "county_name"], hoveredCounty.county]
      : ["==", ["get", "county_name"], ""],
  };

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-gray-200">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#006600]" />
            <p className="text-sm text-gray-500">Loading county data...</p>
          </div>
        </div>
      )}

      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={["county-fill"]}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        cursor={hoveredCounty ? "pointer" : "grab"}
        maxBounds={[
          [33.0, -5.5],  // SW corner
          [42.5, 5.5],   // NE corner
        ]}
      >
        {/* Navigation controls */}
        <NavigationControl position="top-right" />

        {/* County GeoJSON layer */}
        {enrichedGeojson && (
          <Source id="kenya-counties" type="geojson" data={enrichedGeojson}>
            <Layer {...fillLayer} />
            <Layer {...outlineLayer} />
            <Layer {...hoverOutlineLayer} />
          </Source>
        )}
      </MapGL>

      {/* Tooltip */}
      {hoveredCounty && (
        <CountyTooltip
          county={hoveredCounty}
          x={cursorPos.x}
          y={cursorPos.y}
        />
      )}

      {/* Legend */}
      <MapLegend
        minSpending={minSpending}
        maxSpending={maxSpending}
        nationalTotal={nationalTotal}
      />
    </div>
  );
}
