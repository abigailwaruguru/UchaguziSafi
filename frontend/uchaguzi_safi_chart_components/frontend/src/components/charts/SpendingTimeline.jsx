/**
 * UCHAGUZI SAFI — SpendingTimeline Component
 * =============================================
 * Recharts AreaChart showing cumulative campaign spending over time.
 *
 * Displays:
 *   - Cumulative spending as a filled area with gradient
 *   - Daily spending as a subtle bar overlay (optional)
 *   - IEBC spending limit as a horizontal reference line (s.18)
 *   - Utilisation percentage at each data point
 *   - Optional: multiple candidate overlays for comparison
 *
 * Data shape (from TimelineDataPoint schema):
 *   { date: string, cumulative_spending: number, daily_spending: number,
 *     spending_limit: number, utilisation_pct: number }
 *
 * The spending limit line is the most important visual element —
 * it shows at a glance whether the candidate is trending toward
 * a s.18 violation.
 *
 * Module: M1 Fedha Dashboard, M2 Taswira
 */

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import ChartContainer from "./ChartContainer";

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toLocaleString("en-KE");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

/**
 * Gradient colours for the spending area.
 * Green when compliant, transitions to red as utilisation rises.
 */
function getGradientColour(latestPct) {
  if (latestPct >= 100) return { start: "#BB0000", end: "#BB000020" };
  if (latestPct >= 80) return { start: "#F57F17", end: "#F57F1720" };
  return { start: "#006600", end: "#00660020" };
}

export default function SpendingTimeline({
  data = [],
  spendingLimit,
  candidateName,
  overlayData,
  isLoading = false,
  isError = false,
  onRetry,
}) {
  const isEmpty = !data || data.length === 0;

  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: point.date,
      dateLabel: formatDate(point.date),
      cumulative: Number(point.cumulative_spending) || 0,
      daily: Number(point.daily_spending) || 0,
      limit: Number(point.spending_limit || spendingLimit) || 0,
      pct: point.utilisation_pct || 0,
    }));
  }, [data, spendingLimit]);

  const latestPct = chartData.length > 0
    ? chartData[chartData.length - 1].pct
    : 0;
  const gradient = getGradientColour(latestPct);
  const limitValue = Number(spendingLimit) || (chartData[0]?.limit || 0);

  // Y-axis domain: max of spending limit or highest data point, with 10% padding
  const maxValue = Math.max(
    limitValue,
    ...chartData.map((d) => d.cumulative)
  );
  const yMax = Math.ceil(maxValue * 1.1);

  return (
    <ChartContainer
      title="Spending Timeline"
      subtitle={candidateName ? `Cumulative spending — ${candidateName}` : "Cumulative campaign spending over time"}
      legalRef="ECF Act s.18 — Spending limits per election type"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={onRetry}
      exportFileName="spending-timeline"
    >
      <div className="h-72 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradient.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={gradient.end} stopOpacity={0.05} />
              </linearGradient>
              {overlayData && (
                <linearGradient id="overlayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A5276" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#1A5276" stopOpacity={0.02} />
                </linearGradient>
              )}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
              interval="preserveStartEnd"
            />

            <YAxis
              domain={[0, yMax]}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatKES(v)}
              width={55}
            />

            <Tooltip content={<TimelineTooltip />} />

            {/* IEBC spending limit reference line */}
            {limitValue > 0 && (
              <ReferenceLine
                y={limitValue}
                stroke="#BB0000"
                strokeDasharray="6 4"
                strokeWidth={2}
                label={{
                  value: `IEBC Limit: KES ${formatKES(limitValue)}`,
                  position: "insideTopRight",
                  fill: "#BB0000",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Overlay candidate (comparison mode) */}
            {overlayData && (
              <Area
                data={overlayData.map((p) => ({
                  dateLabel: formatDate(p.date),
                  overlay: Number(p.cumulative_spending) || 0,
                }))}
                type="monotone"
                dataKey="overlay"
                stroke="#1A5276"
                strokeWidth={1.5}
                fill="url(#overlayGradient)"
                strokeDasharray="4 2"
              />
            )}

            {/* Primary spending area */}
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={gradient.start}
              strokeWidth={2.5}
              fill="url(#spendingGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: gradient.start,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ backgroundColor: gradient.start }} />
          Cumulative spending
        </span>
        {limitValue > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded border-b-2 border-dashed border-[#BB0000]" />
            IEBC spending limit
          </span>
        )}
        {overlayData && (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded border-b-2 border-dashed border-[#1A5276]" />
            Comparison candidate
          </span>
        )}
      </div>
    </ChartContainer>
  );
}

function TimelineTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-xs min-w-[180px]">
      <p className="font-bold text-gray-900">{d.dateLabel}</p>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Cumulative</span>
          <span className="font-semibold text-gray-900">KES {formatKES(d.cumulative)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Daily</span>
          <span className="font-medium text-gray-700">KES {formatKES(d.daily)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Limit</span>
          <span className="text-gray-600">KES {formatKES(d.limit)}</span>
        </div>
        <div className="border-t border-gray-100 pt-1 flex justify-between">
          <span className="text-gray-500">Utilisation</span>
          <span className={`font-bold ${
            d.pct >= 100 ? "text-[#BB0000]" :
            d.pct >= 80 ? "text-[#F57F17]" :
            "text-[#006600]"
          }`}>
            {d.pct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
