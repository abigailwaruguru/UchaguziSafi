/**
 * UCHAGUZI SAFI — CandidateCard Component
 * ==========================================
 * Compact card for candidate search results in the M4 Tafuta module.
 *
 * Displays:
 *   - Candidate photo (with initials fallback)
 *   - Name and election type badge
 *   - Party affiliation with abbreviation
 *   - County / constituency location
 *   - Spending compliance indicator (ECF Act s.18):
 *       Green dot  = COMPLIANT (<80% of IEBC limit)
 *       Amber dot  = WARNING (80–99%)
 *       Red dot    = VIOLATION (≥100%)
 *   - Spending utilisation bar (visual % of limit)
 *
 * API response fields consumed (from CandidateListItem schema):
 *   id, full_name, election_type, county, constituency,
 *   status, party_name, party_abbreviation, photo_url,
 *   total_expenditure, spending_limit
 */

import { useNavigate } from "react-router-dom";
import { MapPin, Briefcase, TrendingUp } from "lucide-react";

/**
 * Election type display labels and colour tokens.
 * Maps backend enum values to human-readable badges.
 */
const ELECTION_TYPE_CONFIG = {
  PRESIDENTIAL: { label: "President", bg: "bg-[#006600]", text: "text-white" },
  GOVERNOR:     { label: "Governor", bg: "bg-[#1A5276]", text: "text-white" },
  SENATOR:      { label: "Senator", bg: "bg-amber-600", text: "text-white" },
  WOMEN_REP:    { label: "Women Rep", bg: "bg-purple-600", text: "text-white" },
  MP:           { label: "MP", bg: "bg-gray-700", text: "text-white" },
  MCA:          { label: "MCA", bg: "bg-gray-500", text: "text-white" },
};

/**
 * Derive compliance status from spending percentage.
 * Mirrors the backend CandidateResponse.compliance_status computed field.
 */
function getComplianceInfo(totalExpenditure, spendingLimit) {
  if (!spendingLimit || spendingLimit <= 0) {
    return { status: "pending", label: "No limit set", color: "bg-gray-400", pct: 0 };
  }
  const pct = (totalExpenditure / spendingLimit) * 100;
  if (pct >= 100) {
    return { status: "violation", label: "Over limit", color: "bg-[#BB0000]", pct: Math.min(pct, 100) };
  }
  if (pct >= 80) {
    return { status: "warning", label: "Near limit", color: "bg-[#F57F17]", pct };
  }
  return { status: "compliant", label: "Within limit", color: "bg-[#006600]", pct };
}

/**
 * Generate initials from full name for the photo fallback.
 * e.g., "Wanjiku Muthoni Kamau" → "WK"
 */
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CandidateCard({ candidate }) {
  const navigate = useNavigate();

  const {
    id,
    full_name,
    election_type,
    county,
    constituency,
    party_name,
    party_abbreviation,
    photo_url,
    total_expenditure = 0,
    spending_limit = 0,
  } = candidate;

  const typeConfig = ELECTION_TYPE_CONFIG[election_type] || {
    label: election_type, bg: "bg-gray-500", text: "text-white",
  };

  const compliance = getComplianceInfo(total_expenditure, spending_limit);

  const handleClick = () => navigate(`/candidates/${id}`);

  return (
    <article
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      role="button"
      tabIndex={0}
      className="
        group relative flex flex-col overflow-hidden rounded-2xl
        border border-gray-200 bg-white
        transition-all duration-300
        hover:border-[#006600]/30 hover:shadow-lg hover:shadow-[#006600]/5
        hover:-translate-y-0.5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
        cursor-pointer
      "
      aria-label={`View ${full_name}, ${typeConfig.label} candidate for ${county}`}
    >
      {/* ── Top section: Photo + election type badge ──────────── */}
      <div className="relative flex items-center gap-4 p-4 pb-3">
        {/* Photo / initials fallback */}
        <div className="relative h-14 w-14 flex-shrink-0">
          {photo_url ? (
            <img
              src={photo_url}
              alt={full_name}
              className="h-14 w-14 rounded-xl object-cover ring-2 ring-gray-100"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`
              ${photo_url ? "hidden" : "flex"}
              h-14 w-14 items-center justify-center rounded-xl
              bg-gradient-to-br from-[#006600]/10 to-[#006600]/5
              text-lg font-bold text-[#006600]
              ring-2 ring-[#006600]/10
            `}
          >
            {getInitials(full_name)}
          </div>

          {/* Compliance dot — top-right of photo */}
          <span
            className={`
              absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full
              ${compliance.color} ring-2 ring-white
            `}
            title={`${compliance.label} (${compliance.pct.toFixed(0)}%)`}
          />
        </div>

        {/* Name and metadata */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-gray-900 group-hover:text-[#006600] transition-colors">
            {full_name}
          </h3>

          {/* Party + election type */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {/* Election type badge */}
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeConfig.bg} ${typeConfig.text}`}>
              {typeConfig.label}
            </span>

            {/* Party badge */}
            {party_abbreviation && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                {party_abbreviation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Details section ───────────────────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">
            {constituency ? `${constituency}, ` : ""}{county}
          </span>
        </div>

        {/* Party full name */}
        {party_name && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{party_name}</span>
          </div>
        )}
      </div>

      {/* ── Spending bar (ECF Act s.18) ───────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1 text-gray-500">
            <TrendingUp className="h-3 w-3" />
            Spending
          </span>
          <span className={`font-semibold ${
            compliance.status === "violation" ? "text-[#BB0000]" :
            compliance.status === "warning" ? "text-[#F57F17]" :
            "text-[#006600]"
          }`}>
            {compliance.pct.toFixed(0)}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${compliance.color}`}
            style={{ width: `${Math.min(compliance.pct, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>KES {(total_expenditure / 1_000_000).toFixed(1)}M</span>
          <span>Limit: KES {(spending_limit / 1_000_000).toFixed(1)}M</span>
        </div>
      </div>
    </article>
  );
}
