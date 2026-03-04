/**
 * UCHAGUZI SAFI — PartyComparisonBar Component
 * ================================================
 * Horizontal bar chart comparing total spending across
 * political parties registered under the Political Parties Act (Cap. 7D).
 *
 * Data shape (from PartyComparison schema):
 *   { party_name: string, party_abbreviation: string,
 *     total_spending: number, total_contributions: number,
 *     candidate_count: number, avg_spending_per_candidate: number,
 *     counties_represented: number, compliance_rate_pct: number,
 *     incident_count: number }
 *
 * Features:
 *   - Horizontal bars sorted by total spending (highest first)
 *   - Party abbreviation labels on Y-axis
 *   - Dual bars: spending (green) vs. contributions (blue)
 *   - Compliance rate badge per party
 *   - Tooltip with full party detail
 *
 * Module: M2 Taswira (Visualisation), M1 Fedha Dashboard
 */

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import ChartContainer from "./ChartContainer";

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000_000) return `KES ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `KES ${(num / 1_000).toFixed(0)}K`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

/**
 * Assign distinct colours to parties.
 * Uses a curated palette that avoids the Kenya flag colours
 * (those are reserved for compliance status indicators).
 */
const PARTY_PALETTE = [
  "#1A5276", "#2E86AB", "#006600", "#00838F",
  "#F57F17", "#D32F2F", "#7B1FA2", "#455A64",
  "#E65100", "#2E7D32", "#1565C0", "#6A1B9A",
];

function getPartyColor(index) {
  return PARTY_PALETTE[index % PARTY_PALETTE.length];
}

export default function PartyComparisonBar({
  data = [],
  showContributions = true,
  isLoading = false,
  isError = false,
  onRetry,
  onBarClick,
}) {
  const isEmpty = !data || data.length === 0;

  // Sort by total spending descending
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => Number(b.total_spending) - Number(a.total_spending))
      .map((party, i) => ({
        name: party.party_abbreviation || party.party_name,
        fullName: party.party_name,
        spending: Number(party.total_spending) || 0,
        contributions: Number(party.total_contributions) || 0,
        candidateCount: party.candidate_count || 0,
        avgSpending: Number(party.avg_spending_per_candidate) || 0,
        counties: party.counties_represented || 0,
        complianceRate: party.compliance_rate_pct || 0,
        incidents: party.incident_count || 0,
        color: getPartyColor(i),
      }));
  }, [data]);

  // Dynamic height based on party count (min 250, 50px per party)
  const chartHeight = Math.max(250, chartData.length * 50 + 60);

  return (
    <ChartContainer
      title="Party Spending Comparison"
      subtitle="Total campaign expenditure by political party"
      legalRef="ECF Act s.18 — Spending limits; Political Parties Act Cap. 7D"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={onRetry}
      exportFileName="party-comparison"
    >
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              horizontal={false}
            />

            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
              tickFormatter={(v) => formatKES(v)}
            />

            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />

            <Tooltip content={<PartyTooltip />} />

            <Legend
              verticalAlign="top"
              height={28}
              wrapperStyle={{ fontSize: 12 }}
            />

            {/* Spending bar */}
            <Bar
              dataKey="spending"
              name="Expenditure"
              radius={[0, 6, 6, 0]}
              onClick={(entry) => onBarClick && onBarClick(entry)}
              style={{ cursor: onBarClick ? "pointer" : "default" }}
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>

            {/* Contributions bar (optional) */}
            {showContributions && (
              <Bar
                dataKey="contributions"
                name="Contributions"
                radius={[0, 6, 6, 0]}
                opacity={0.35}
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table below chart */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2 text-left font-semibold text-gray-500">Party</th>
              <th className="pb-2 text-right font-semibold text-gray-500">Candidates</th>
              <th className="pb-2 text-right font-semibold text-gray-500">Counties</th>
              <th className="pb-2 text-right font-semibold text-gray-500">Avg/Candidate</th>
              <th className="pb-2 text-right font-semibold text-gray-500">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((party) => (
              <tr key={party.name} className="border-b border-gray-50">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: party.color }}
                    />
                    <span className="font-medium text-gray-700" title={party.fullName}>
                      {party.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-right text-gray-600">{party.candidateCount}</td>
                <td className="py-2 text-right text-gray-600">{party.counties}/47</td>
                <td className="py-2 text-right text-gray-600">{formatKES(party.avgSpending)}</td>
                <td className="py-2 text-right">
                  <span className={`font-semibold ${
                    party.complianceRate >= 90 ? "text-[#006600]" :
                    party.complianceRate >= 70 ? "text-[#F57F17]" :
                    "text-[#BB0000]"
                  }`}>
                    {party.complianceRate.toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartContainer>
  );
}

function PartyTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const p = payload[0].payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-xs min-w-[200px]">
      <p className="font-bold text-gray-900">{p.fullName}</p>
      <p className="text-gray-400">{p.name}</p>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Spending</span>
          <span className="font-semibold text-gray-900">{formatKES(p.spending)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Contributions</span>
          <span className="text-gray-700">{formatKES(p.contributions)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Candidates</span>
          <span className="text-gray-700">{p.candidateCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Counties</span>
          <span className="text-gray-700">{p.counties}/47</span>
        </div>
        <div className="border-t border-gray-100 pt-1 flex justify-between">
          <span className="text-gray-500">Compliance</span>
          <span className={`font-bold ${
            p.complianceRate >= 90 ? "text-[#006600]" :
            p.complianceRate >= 70 ? "text-[#F57F17]" : "text-[#BB0000]"
          }`}>
            {p.complianceRate.toFixed(0)}%
          </span>
        </div>
        {p.incidents > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Incidents</span>
            <span className="font-semibold text-[#BB0000]">{p.incidents}</span>
          </div>
        )}
      </div>
    </div>
  );
}
