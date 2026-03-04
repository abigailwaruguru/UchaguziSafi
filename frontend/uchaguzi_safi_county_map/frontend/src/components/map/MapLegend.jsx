/**
 * UCHAGUZI SAFI — MapLegend Component
 * ======================================
 * Gradient legend for the M2 Taswira county choropleth map.
 *
 * Shows:
 *   - Colour gradient bar (light yellow → dark red)
 *   - Min and max spending values
 *   - National total
 *   - Positioned bottom-left of map viewport
 *
 * The colour scale uses the same interpolation as the
 * choropleth fill: a linear blend from #FFFFCC (low) to
 * #BB0000 (high / Kenya-red).
 */

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000_000) return `KES ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `KES ${(num / 1_000).toFixed(0)}K`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

export default function MapLegend({
  minSpending = 0,
  maxSpending = 0,
  nationalTotal = 0,
}) {
  return (
    <div className="
      absolute bottom-4 left-4 z-10
      w-56 rounded-xl border border-gray-200/80 bg-white/95
      backdrop-blur-sm p-3 shadow-lg
    ">
      {/* Title */}
      <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
        Campaign Spending
      </p>

      {/* Gradient bar */}
      <div className="mt-2 h-3 w-full rounded-full overflow-hidden"
        style={{
          background: "linear-gradient(to right, #FFFFCC, #FED976, #FD8D3C, #E31A1C, #BB0000)",
        }}
      />

      {/* Min / Max labels */}
      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
        <span>{formatKES(minSpending)}</span>
        <span>{formatKES(maxSpending)}</span>
      </div>

      {/* National total */}
      {nationalTotal > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2 flex justify-between items-center">
          <span className="text-[10px] text-gray-500">National total</span>
          <span className="text-xs font-bold text-gray-900">
            {formatKES(nationalTotal)}
          </span>
        </div>
      )}
    </div>
  );
}
