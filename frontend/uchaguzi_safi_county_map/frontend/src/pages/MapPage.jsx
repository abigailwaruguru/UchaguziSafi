/**
 * UCHAGUZI SAFI — Map Page
 * ==========================
 * Full-page interactive map view for the M2 Taswira
 * (Data Visualisation) module.
 *
 * Displays a choropleth map of Kenya's 47 counties coloured
 * by total campaign spending intensity.
 *
 * Features:
 *   - Election type filter (dropdown)
 *   - National summary stats bar
 *   - Full-viewport KenyaCountyMap
 *   - Responsive: stacks filter above map on mobile
 *   - Click county → navigate to candidates filtered by county
 *
 * Route: /map (mapped in App.jsx)
 * Module: M2 Taswira
 */

import { useState } from "react";
import {
  Map as MapIcon,
  Shield,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

import KenyaCountyMap from "../components/map/KenyaCountyMap";
import useCountySpending from "../hooks/useCountySpending";
import { ELECTION_TYPES } from "../data/kenyaCounties";

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000_000) return `KES ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

export default function MapPage() {
  const [electionType, setElectionType] = useState("");
  const { mapData, isLoading, isError } = useCountySpending(electionType);

  // Compute national stats from lookup
  const stats = {
    totalSpending: mapData.nationalTotal,
    totalCounties: Object.keys(mapData.lookup).length,
    totalCandidates: Object.values(mapData.lookup).reduce(
      (sum, c) => sum + (c.candidate_count || 0), 0
    ),
    totalIncidents: Object.values(mapData.lookup).reduce(
      (sum, c) => sum + (c.incident_count || 0), 0
    ),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">

      {/* ── Header bar ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006600]/10">
            <MapIcon className="h-5 w-5 text-[#006600]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Campaign Spending by County
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="h-3 w-3" />
              ECF Act s.18 — IEBC-gazetted spending limits
            </div>
          </div>
        </div>

        {/* Election type filter */}
        <div className="relative">
          <select
            value={electionType}
            onChange={(e) => setElectionType(e.target.value)}
            className="
              w-full appearance-none rounded-xl border border-gray-200
              bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700
              transition-colors
              focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
              sm:w-48
            "
          >
            {ELECTION_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── National summary stats ───────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatPill
          icon={TrendingUp}
          label="Total Spending"
          value={formatKES(stats.totalSpending)}
          color="text-[#006600]"
        />
        <StatPill
          icon={MapIcon}
          label="Counties"
          value={`${stats.totalCounties} / 47`}
          color="text-[#1A5276]"
        />
        <StatPill
          icon={Users}
          label="Candidates"
          value={stats.totalCandidates.toLocaleString()}
          color="text-gray-700"
        />
        <StatPill
          icon={AlertTriangle}
          label="Incidents"
          value={stats.totalIncidents.toLocaleString()}
          color="text-[#BB0000]"
        />
      </div>

      {/* ── Map container ────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {isError ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-red-200 bg-red-50">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-[#BB0000]" />
              <p className="mt-3 text-sm font-medium text-gray-700">
                Failed to load spending data
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Check your connection and try again
              </p>
            </div>
          </div>
        ) : (
          <KenyaCountyMap
            spendingLookup={mapData.lookup}
            minSpending={mapData.minSpending}
            maxSpending={mapData.maxSpending}
            nationalTotal={mapData.nationalTotal}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* ── Help text ────────────────────────────────────────── */}
      <p className="mt-2 text-center text-[10px] text-gray-400">
        Click any county to view its candidates. Hover for spending details.
        Data per ECF Act Cap. 7A.
      </p>
    </div>
  );
}


/** Compact stat pill for the national summary bar */
function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
      <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
        <p className="text-[10px] text-gray-400 truncate">{label}</p>
      </div>
    </div>
  );
}
