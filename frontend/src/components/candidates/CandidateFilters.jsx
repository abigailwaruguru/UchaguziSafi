/**
 * UCHAGUZI SAFI — CandidateFilters Component
 * ==============================================
 * Filter controls for the M4 Tafuta candidate search module.
 *
 * Filters:
 *   1. Search input — full_name partial match (min 2 chars)
 *   2. Election type tabs — maps to ElectionType enum
 *   3. County dropdown — Kenya's 47 counties
 *   4. Clear all button — resets to defaults
 *
 * Responsive behaviour:
 *   Mobile (<768px):  Collapsible panel behind "Filters" toggle
 *   Desktop (≥768px): Always-visible horizontal bar
 *
 * All filters update parent state via onFilterChange callback.
 * The parent (CandidatesPage) passes filter values as props
 * to maintain single source of truth.
 */

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  MapPin,
} from "lucide-react";
import KENYA_COUNTIES, { ELECTION_TYPES } from "../../data/kenyaCounties";

export default function CandidateFilters({
  filters,
  onFilterChange,
  resultCount = 0,
  isLoading = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { search = "", election_type = "", county = "" } = filters;

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      election_type: "",
      county: "",
      page: 1,
      per_page: 12,
    });
  };

  const hasActiveFilters = search || election_type || county;

  return (
    <div className="space-y-4">
      {/* ── Top bar: Search + mobile toggle ─────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search candidates by name..."
            value={search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="
              w-full rounded-xl border border-gray-200 bg-white
              py-2.5 pl-10 pr-4 text-sm text-gray-900
              placeholder:text-gray-400
              transition-colors
              focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
            "
          />
          {search && (
            <button
              onClick={() => handleChange("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex md:hidden items-center gap-2 rounded-xl border
            px-4 py-2.5 text-sm font-medium transition-colors
            ${hasActiveFilters
              ? "border-[#006600] bg-[#006600]/5 text-[#006600]"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }
          `}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006600] text-[10px] font-bold text-white">
              {[search, election_type, county].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {/* Result count + clear */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {isLoading ? "Loading..." : `${resultCount} candidates`}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="
                flex items-center gap-1 rounded-lg px-2.5 py-1.5
                text-xs font-medium text-[#BB0000] transition-colors
                hover:bg-[#BB0000]/5
              "
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Expandable filter panel ─────────────────────────── */}
      <div
        className={`
          space-y-4
          md:block
          ${isExpanded ? "block" : "hidden"}
        `}
      >
        {/* Election type tabs */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Position
          </label>
          <div className="flex flex-wrap gap-2">
            {ELECTION_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleChange("election_type", value)}
                className={`
                  rounded-lg px-3 py-1.5 text-sm font-medium
                  transition-all duration-200
                  ${election_type === value
                    ? "bg-[#006600] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* County dropdown */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            County
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={county}
              onChange={(e) => handleChange("county", e.target.value)}
              className="
                w-full appearance-none rounded-xl border border-gray-200
                bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900
                transition-colors
                focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
              "
            >
              <option value="">All 47 Counties</option>
              {KENYA_COUNTIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Mobile: result count + clear */}
        <div className="flex items-center justify-between md:hidden">
          <span className="text-sm text-gray-400">
            {isLoading ? "Loading..." : `${resultCount} candidates`}
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => { clearFilters(); setIsExpanded(false); }}
              className="
                flex items-center gap-1 rounded-lg px-3 py-1.5
                text-xs font-medium text-[#BB0000]
                hover:bg-[#BB0000]/5
              "
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
