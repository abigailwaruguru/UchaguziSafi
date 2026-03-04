/**
 * UCHAGUZI SAFI — ChartContainer Component
 * ============================================
 * Reusable wrapper for all Recharts visualisations.
 *
 * Provides:
 *   - Title and subtitle (with optional ECF Act section reference)
 *   - Loading skeleton (animated pulse)
 *   - Error state with retry
 *   - Empty data state
 *   - PNG export via canvas capture
 *   - Consistent card styling matching the Kenya design system
 *
 * Used by: ContributionPieChart, ExpenditurePieChart,
 *          SpendingTimeline, PartyComparisonBar
 */

import { useRef, useCallback } from "react";
import { Download, AlertCircle, BarChart3 } from "lucide-react";

export default function ChartContainer({
  title,
  subtitle,
  legalRef,
  children,
  isLoading = false,
  isError = false,
  isEmpty = false,
  onRetry,
  exportFileName = "uchaguzi-safi-chart",
  className = "",
}) {
  const chartRef = useRef(null);

  /** Export chart as PNG using SVG → canvas → blob pipeline. */
  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;

    const svgElement = chartRef.current.querySelector("svg");
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 2; // High-DPI export
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${exportFileName}.png`;
          link.click();
          URL.revokeObjectURL(link.href);
        }, "image/png");

        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error("Chart export failed:", err);
    }
  }, [exportFileName]);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div>
          {title && (
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
          {legalRef && (
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <span className="inline-block h-1 w-1 rounded-full bg-[#006600]" />
              {legalRef}
            </p>
          )}
        </div>
        {/* Export button — only show when chart has data */}
        {!isLoading && !isError && !isEmpty && (
          <button
            onClick={handleExport}
            className="
              flex items-center gap-1.5 rounded-lg border border-gray-200
              px-2.5 py-1.5 text-[11px] font-medium text-gray-500
              transition-colors hover:bg-gray-50 hover:text-[#006600]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
            "
            title="Download as PNG"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="px-5 pb-5">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-32 w-32 animate-pulse rounded-full bg-gray-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-[#BB0000]" />
            <p className="mt-3 text-sm font-medium text-gray-700">Failed to load chart</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 rounded-lg bg-[#006600] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#005500]"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-3 text-sm text-gray-400">No data available</p>
          </div>
        )}

        {/* Chart content */}
        {!isLoading && !isError && !isEmpty && (
          <div ref={chartRef}>{children}</div>
        )}
      </div>
    </div>
  );
}
