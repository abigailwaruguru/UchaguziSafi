/**
 * UCHAGUZI SAFI — ContributionPieChart Component
 * =================================================
 * Donut chart showing contribution breakdown by source type,
 * as defined in ECF Act s.11 (Sources of campaign finances).
 *
 * Source types (from ContributionSourceType enum):
 *   INDIVIDUAL      — Person contributing from personal funds
 *   CORPORATE       — Business entity contribution
 *   HARAMBEE        — Public collection per s.16(2)
 *   SELF_FUNDING    — Candidate's own funds (exempt from s.12(2) cap)
 *   POLITICAL_PARTY — Party funding to candidate
 *   ORGANISATION    — Registered organisation per s.15
 *
 * Data shape (from CategoryBreakdown schema):
 *   { category: string, total_amount: number, percentage_of_total: number, transaction_count: number }
 *
 * ECF Act s.12(2) flag:
 *   Any source exceeding 20% of total is visually flagged.
 *
 * Module: M1 Fedha Dashboard, M2 Taswira
 */

import { useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector,
} from "recharts";
import ChartContainer from "./ChartContainer";

/** Colour palette for contribution source types */
const SOURCE_COLORS = {
  SELF_FUNDING:    "#1F4E79",
  CORPORATE:       "#28A745",
  INDIVIDUAL:      "#FFC107",
  HARAMBEE:        "#DC3545",
  POLITICAL_PARTY: "#6C757D",
  ORGANISATION:    "#00838F",
};

/** Human-readable labels */
const SOURCE_LABELS = {
  INDIVIDUAL:      "Individual",
  CORPORATE:       "Corporate",
  HARAMBEE:        "Harambee",
  SELF_FUNDING:    "Self-funding",
  POLITICAL_PARTY: "Political Party",
  ORGANISATION:    "Organisation",
};

/** Format KES amount */
function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `KES ${(num / 1_000).toFixed(0)}K`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

/** Section 12(2) single-source cap threshold */
const SINGLE_SOURCE_CAP_PCT = 20;

/**
 * Active shape renderer for hover interaction.
 * Expands the hovered segment outward for emphasis.
 */
function ActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent,
  } = props;

  return (
    <g>
      {/* Expanded segment */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
      {/* Centre label */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#111827" fontSize={14} fontWeight={700}>
        {formatKES(payload.value)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize={11}>
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
}

export default function ContributionPieChart({
  data = [],
  totalContributions = 0,
  isLoading = false,
  isError = false,
  onRetry,
  onSegmentClick,
}) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const chartData = data.map((item) => ({
    name: item.category,
    label: SOURCE_LABELS[item.category] || item.category,
    value: Number(item.total_amount) || 0,
    pct: item.percentage_of_total || 0,
    count: item.transaction_count || 0,
    exceedsCap: item.percentage_of_total > SINGLE_SOURCE_CAP_PCT,
  }));

  const isEmpty = chartData.length === 0 || chartData.every((d) => d.value === 0);

  const handleMouseEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  const handleClick = useCallback(
    (entry) => {
      if (onSegmentClick) onSegmentClick(entry.name);
    },
    [onSegmentClick]
  );

  return (
    <ChartContainer
      title="Contribution Sources"
      subtitle="Breakdown by funding source type"
      legalRef="ECF Act s.11 — Sources of campaign finances"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={onRetry}
      exportFileName="contribution-sources"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* Donut chart */}
        <div className="h-56 w-full lg:h-64 lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                activeIndex={activeIndex}
                activeShape={ActiveShape}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(_, index) => handleClick(chartData[index])}
                style={{ cursor: onSegmentClick ? "pointer" : "default" }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SOURCE_COLORS[entry.name] || "#6B7280"}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ outline: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex-1 space-y-2.5 lg:mt-0">
          {chartData.map((item) => (
            <div
              key={item.name}
              className={`
                flex items-center justify-between rounded-lg px-3 py-2
                text-sm transition-colors
                ${onSegmentClick ? "cursor-pointer hover:bg-gray-50" : ""}
                ${item.exceedsCap ? "bg-[#BB0000]/3" : ""}
              `}
              onClick={() => onSegmentClick && onSegmentClick(item.name)}
              onMouseEnter={() => setActiveIndex(chartData.indexOf(item))}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SOURCE_COLORS[item.name] || "#6B7280" }}
                />
                <span className="text-gray-700 font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{formatKES(item.value)}</span>
                <span className="text-xs text-gray-400 w-12 text-right">{item.pct.toFixed(1)}%</span>
                {item.exceedsCap && (
                  <span className="rounded bg-[#BB0000]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#BB0000]">
                    &gt;20%
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="border-t border-gray-100 pt-2 flex items-center justify-between px-3 text-sm">
            <span className="font-semibold text-gray-600">Total</span>
            <span className="font-bold text-gray-900">{formatKES(totalContributions)}</span>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}

/** Custom tooltip with Kenya formatting */
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const { label, value, pct, count, exceedsCap } = payload[0].payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-bold text-gray-900">{label}</p>
      <p className="mt-1 text-gray-600">{formatKES(value)} ({pct.toFixed(1)}%)</p>
      <p className="text-gray-400">{count} transaction{count !== 1 ? "s" : ""}</p>
      {exceedsCap && (
        <p className="mt-1 font-semibold text-[#BB0000]">
          Exceeds s.12(2) 20% cap
        </p>
      )}
    </div>
  );
}
