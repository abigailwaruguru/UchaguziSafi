/**
 * UCHAGUZI SAFI — ComplianceIndicator Component
 * =================================================
 * Prominent visual indicator showing a candidate's spending
 * against their IEBC-gazetted limit (ECF Act s.18).
 *
 * Three display modes:
 *   "bar"     — Full-width progress bar with labels (default)
 *   "compact" — Inline dot + percentage text
 *   "badge"   — Coloured pill badge
 *
 * Compliance thresholds (mirroring backend computed field):
 *   < 80%  → COMPLIANT  → Kenya-green (#006600)
 *   80–99% → WARNING    → Amber (#F57F17)
 *   ≥ 100% → VIOLATION  → Kenya-red (#BB0000)
 *
 * Used in:
 *   - CandidateDetailPage profile header (bar mode)
 *   - CandidateCard (compact mode, via getComplianceInfo)
 *   - Comparison table (badge mode)
 */

import { Shield, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

const STATUS_CONFIG = {
  COMPLIANT: {
    color: "bg-[#006600]",
    textColor: "text-[#006600]",
    bgLight: "bg-[#006600]/5",
    borderColor: "border-[#006600]/20",
    icon: CheckCircle,
    label: "Within ECF Act Limits",
    description: "Spending is within IEBC-gazetted limits under Section 18.",
  },
  WARNING: {
    color: "bg-[#F57F17]",
    textColor: "text-[#F57F17]",
    bgLight: "bg-[#F57F17]/5",
    borderColor: "border-[#F57F17]/20",
    icon: AlertTriangle,
    label: "Approaching Limit",
    description: "Spending exceeds 80% of limit. Section 18(6) report may be required.",
  },
  VIOLATION: {
    color: "bg-[#BB0000]",
    textColor: "text-[#BB0000]",
    bgLight: "bg-[#BB0000]/5",
    borderColor: "border-[#BB0000]/20",
    icon: XCircle,
    label: "Limit Exceeded",
    description: "Spending exceeds IEBC limit. Potential Section 23 offence.",
  },
};

/**
 * Format KES amount for display.
 * - Under 1M: "KES 750,000"
 * - 1M+: "KES 28.5M"
 */
function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000) {
    return `KES ${(num / 1_000_000).toFixed(1)}M`;
  }
  return `KES ${num.toLocaleString("en-KE")}`;
}

export default function ComplianceIndicator({
  totalExpenditure = 0,
  spendingLimit = 0,
  complianceStatus,
  mode = "bar",
}) {
  const expenditure = Number(totalExpenditure) || 0;
  const limit = Number(spendingLimit) || 0;
  const pct = limit > 0 ? (expenditure / limit) * 100 : 0;

  // Derive status from percentage if not provided
  const status =
    complianceStatus ||
    (pct >= 100 ? "VIOLATION" : pct >= 80 ? "WARNING" : "COMPLIANT");

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.COMPLIANT;
  const StatusIcon = config.icon;

  // ── Badge mode ────────────────────────────────────────────
  if (mode === "badge") {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5 rounded-full border px-3 py-1
          text-xs font-semibold
          ${config.bgLight} ${config.textColor} ${config.borderColor}
        `}
      >
        <StatusIcon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  }

  // ── Compact mode ──────────────────────────────────────────
  if (mode === "compact") {
    return (
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
    );
  }

  // ── Bar mode (default) ────────────────────────────────────
  return (
    <div className={`rounded-2xl border p-5 ${config.bgLight} ${config.borderColor}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.color}`}>
            <StatusIcon className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${config.textColor}`}>
              {config.label}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-2xl font-extrabold ${config.textColor}`}>
            {pct.toFixed(1)}%
          </span>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">
            of IEBC limit
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${config.color}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Spent: <span className="font-semibold text-gray-700">{formatKES(expenditure)}</span>
          </span>
          <span className="text-gray-500">
            Limit: <span className="font-semibold text-gray-700">{formatKES(limit)}</span>
          </span>
        </div>
      </div>

      {/* Legal reference */}
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400">
        <Shield className="h-3 w-3" />
        ECF Act s.18 — IEBC-gazetted spending limits
      </div>
    </div>
  );
}
