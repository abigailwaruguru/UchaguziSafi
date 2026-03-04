/**
 * UCHAGUZI SAFI — CountyTooltip Component
 * ==========================================
 * Tooltip shown on county hover in the M2 Taswira map.
 *
 * Displays:
 *   - County name (bold, prominent)
 *   - Total spending (formatted KES)
 *   - Candidate count
 *   - Average spending per candidate
 *   - Compliance summary (compliant/warning/violation counts)
 *   - Incident count (if > 0)
 *
 * Positioned near the cursor via absolute CSS coordinates
 * passed from the parent map component.
 */

import { Shield, Users, AlertTriangle, TrendingUp } from "lucide-react";

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000_000) return `KES ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `KES ${(num / 1_000).toFixed(0)}K`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

export default function CountyTooltip({ county, x, y }) {
  if (!county) return null;

  const compliance = county.compliance_summary || {};
  const totalCompliance = (compliance.compliant || 0) +
    (compliance.warning || 0) + (compliance.violation || 0);

  return (
    <div
      className="
        pointer-events-none fixed z-50
        w-64 rounded-xl border border-gray-200 bg-white
        p-4 shadow-xl
        transition-opacity duration-150
      "
      style={{
        left: Math.min(x + 12, window.innerWidth - 280),
        top: Math.max(y - 10, 10),
      }}
    >
      {/* County name */}
      <h4 className="text-base font-extrabold text-gray-900">
        {county.county}
      </h4>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
        County Code: {county.county_code}
      </p>

      {/* Spending */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <TrendingUp className="h-3 w-3" />
            Total Spending
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatKES(county.total_spending)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            Candidates
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {county.candidate_count || 0}
          </span>
        </div>

        {county.avg_spending_per_candidate > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Avg / candidate</span>
            <span className="text-xs font-medium text-gray-600">
              {formatKES(county.avg_spending_per_candidate)}
            </span>
          </div>
        )}
      </div>

      {/* Compliance mini-bar */}
      {totalCompliance > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Compliance (ECF Act s.18)
          </p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
            {compliance.compliant > 0 && (
              <div
                className="bg-[#006600] transition-all duration-500"
                style={{ width: `${(compliance.compliant / totalCompliance) * 100}%` }}
                title={`Compliant: ${compliance.compliant}`}
              />
            )}
            {compliance.warning > 0 && (
              <div
                className="bg-[#F57F17] transition-all duration-500"
                style={{ width: `${(compliance.warning / totalCompliance) * 100}%` }}
                title={`Warning: ${compliance.warning}`}
              />
            )}
            {compliance.violation > 0 && (
              <div
                className="bg-[#BB0000] transition-all duration-500"
                style={{ width: `${(compliance.violation / totalCompliance) * 100}%` }}
                title={`Violation: ${compliance.violation}`}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[10px]">
            <span className="text-[#006600]">{compliance.compliant || 0} OK</span>
            <span className="text-[#F57F17]">{compliance.warning || 0} warn</span>
            <span className="text-[#BB0000]">{compliance.violation || 0} viol.</span>
          </div>
        </div>
      )}

      {/* Incidents */}
      {county.incident_count > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#BB0000]">
          <AlertTriangle className="h-3 w-3" />
          {county.incident_count} misuse report{county.incident_count > 1 ? "s" : ""}
        </div>
      )}

      {/* Legal ref */}
      <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-400">
        <Shield className="h-2.5 w-2.5" />
        ECF Act s.18 spending limits
      </div>
    </div>
  );
}
