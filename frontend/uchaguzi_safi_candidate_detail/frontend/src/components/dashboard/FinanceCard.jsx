/**
 * UCHAGUZI SAFI — FinanceCard Component
 * ========================================
 * Reusable stat card for displaying a single financial metric
 * on the M1 Fedha Dashboard.
 *
 * Variants:
 *   "default" — Standard metric (contributions, expenditure)
 *   "accent"  — Highlighted metric with coloured left border
 *   "alert"   — Warning/violation state with red emphasis
 *
 * Used in CandidateDetailPage section C (financial summary row).
 */

export default function FinanceCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "default",
  trend,
}) {
  const borderClass =
    variant === "accent"
      ? "border-l-4 border-l-[#006600]"
      : variant === "alert"
        ? "border-l-4 border-l-[#BB0000]"
        : "";

  const iconBg =
    variant === "accent"
      ? "bg-[#006600]/10 text-[#006600]"
      : variant === "alert"
        ? "bg-[#BB0000]/10 text-[#BB0000]"
        : "bg-gray-100 text-gray-500";

  return (
    <div
      className={`
        rounded-2xl border border-gray-200 bg-white p-4 lg:p-5
        transition-shadow hover:shadow-md
        ${borderClass}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        )}
        {/* Trend indicator */}
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend > 0 ? "text-[#006600]" : "text-[#BB0000]"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p className="mt-3 text-2xl font-extrabold text-gray-900 tracking-tight">
        {value}
      </p>

      {/* Label */}
      <p className="mt-1 text-sm text-gray-500">{label}</p>

      {/* Subtext */}
      {subtext && (
        <p className="mt-1.5 text-xs text-gray-400">{subtext}</p>
      )}
    </div>
  );
}
