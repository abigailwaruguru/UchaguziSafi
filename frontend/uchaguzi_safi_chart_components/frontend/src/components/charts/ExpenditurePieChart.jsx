/**
 * UCHAGUZI SAFI — ExpenditurePieChart Component
 * =================================================
 * Donut chart showing expenditure breakdown by the 6 authorised
 * categories defined in ECF Act s.19(a)-(f).
 *
 * Categories (from ExpenditureCategory enum):
 *   VENUE       — s.19(a) Venue where campaign activities may be undertaken
 *   PUBLICITY   — s.19(b) Publicity material for campaigns
 *   ADVERTISING — s.19(c) Advertising for the campaigns
 *   PERSONNEL   — s.19(d) Campaign personnel
 *   TRANSPORT   — s.19(e) Transportation in respect of campaign activities
 *   OTHER       — s.19(f) Any other justifiable expenses
 *
 * Data shape (from CategoryBreakdown schema):
 *   { category: string, total_amount: number, percentage_of_total: number, transaction_count: number }
 *
 * Module: M1 Fedha Dashboard, M2 Taswira
 */

import { useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector,
} from "recharts";
import ChartContainer from "./ChartContainer";

/** Colour palette — 6 distinct colours for s.19 categories */
const CATEGORY_COLORS = {
  VENUE:       "#006600",
  PUBLICITY:   "#1A5276",
  ADVERTISING: "#F57F17",
  PERSONNEL:   "#7B1FA2",
  TRANSPORT:   "#D32F2F",
  OTHER:       "#6B7280",
};

/** ECF Act s.19 exact wording mapped to short labels */
const CATEGORY_LABELS = {
  VENUE:       "Venue",
  PUBLICITY:   "Publicity materials",
  ADVERTISING: "Advertising",
  PERSONNEL:   "Campaign personnel",
  TRANSPORT:   "Transportation",
  OTHER:       "Other expenses",
};

/** Full statutory wording for tooltips */
const CATEGORY_LEGAL = {
  VENUE:       "s.19(a) — Venue where campaign activities may be undertaken",
  PUBLICITY:   "s.19(b) — Publicity material for campaigns",
  ADVERTISING: "s.19(c) — Advertising for the campaigns",
  PERSONNEL:   "s.19(d) — Campaign personnel",
  TRANSPORT:   "s.19(e) — Transportation in respect of campaign activities",
  OTHER:       "s.19(f) — Any other justifiable expenses",
};

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `KES ${(num / 1_000).toFixed(0)}K`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

function ActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#111827" fontSize={14} fontWeight={700}>
        {formatKES(payload.value)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize={11}>
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
}

export default function ExpenditurePieChart({
  data = [],
  totalExpenditure = 0,
  isLoading = false,
  isError = false,
  onRetry,
  onSegmentClick,
}) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const chartData = data.map((item) => ({
    name: item.category,
    label: CATEGORY_LABELS[item.category] || item.category,
    legal: CATEGORY_LEGAL[item.category] || "",
    value: Number(item.total_amount) || 0,
    pct: item.percentage_of_total || 0,
    count: item.transaction_count || 0,
  }));

  const isEmpty = chartData.length === 0 || chartData.every((d) => d.value === 0);

  return (
    <ChartContainer
      title="Expenditure Categories"
      subtitle="Spending by authorised campaign expense type"
      legalRef="ECF Act s.19(a)-(f) — Authorised expenditures"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={onRetry}
      exportFileName="expenditure-categories"
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
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={(_, index) => onSegmentClick && onSegmentClick(chartData[index].name)}
                style={{ cursor: onSegmentClick ? "pointer" : "default" }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] || "#6B7280"}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CategoryTooltip />}
                wrapperStyle={{ outline: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with statutory labels */}
        <div className="mt-4 flex-1 space-y-2 lg:mt-0">
          {chartData.map((item, i) => (
            <div
              key={item.name}
              className={`
                flex items-center justify-between rounded-lg px-3 py-2
                text-sm transition-colors
                ${activeIndex === i ? "bg-gray-50" : ""}
                ${onSegmentClick ? "cursor-pointer hover:bg-gray-50" : ""}
              `}
              onClick={() => onSegmentClick && onSegmentClick(item.name)}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[item.name] || "#6B7280" }}
                />
                <div className="min-w-0">
                  <span className="text-gray-700 font-medium block truncate">{item.label}</span>
                  <span className="text-[10px] text-gray-400 block truncate">{item.legal}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="font-semibold text-gray-900">{formatKES(item.value)}</span>
                <span className="text-xs text-gray-400 w-12 text-right">{item.pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}

          <div className="border-t border-gray-100 pt-2 flex items-center justify-between px-3 text-sm">
            <span className="font-semibold text-gray-600">Total</span>
            <span className="font-bold text-gray-900">{formatKES(totalExpenditure)}</span>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const { label, legal, value, pct, count } = payload[0].payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-xs max-w-[220px]">
      <p className="font-bold text-gray-900">{label}</p>
      <p className="mt-0.5 text-[10px] text-gray-400">{legal}</p>
      <p className="mt-1.5 text-gray-600">{formatKES(value)} ({pct.toFixed(1)}%)</p>
      <p className="text-gray-400">{count} transaction{count !== 1 ? "s" : ""}</p>
    </div>
  );
}
