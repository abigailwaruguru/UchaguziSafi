/**
 * UCHAGUZI SAFI — Candidate Detail Page
 * ========================================
 * Main financial dashboard for a single candidate.
 * Combines M1 Fedha (Finance Dashboard) and M4 Tafuta (Search)
 * modules into a single comprehensive view.
 *
 * Sections:
 *   A. Profile header — photo, name, party, location, status
 *   B. Compliance indicator — ECF Act s.18 spending bar
 *   C. Financial summary — 4 stat cards
 *   D. Contribution breakdown — donut chart by source type (s.11)
 *   E. Expenditure breakdown — donut chart by s.19 category
 *   F. Top contributors — table with s.12(2) flags
 *   G. Action buttons — compare, share, report
 *
 * API endpoints consumed:
 *   GET /candidates/{id}         → CandidateResponse
 *   GET /candidates/{id}/finance → CandidateFinanceSummary
 *
 * User personas:
 *   - Wananchi: Quick compliance check, WhatsApp sharing
 *   - Journalists: Deep dive into contribution sources, flags
 *   - CSOs: Category analysis, s.12(2) cap violations
 *   - IEBC: Comprehensive overview for regulatory action
 */

import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  AlertTriangle,
  Download,
  GitCompare,
  Shield,
  ExternalLink,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { useCandidate } from "../../hooks/useCandidates";
import useCandidateFinance from "../../hooks/useCandidateFinance";
import ComplianceIndicator from "../../components/dashboard/ComplianceIndicator";
import FinanceCard from "../../components/dashboard/FinanceCard";
import ShareButton from "../../components/dashboard/ShareButton";

// ── Constants ───────────────────────────────────────────────────

const ELECTION_TYPE_CONFIG = {
  PRESIDENTIAL: { label: "Presidential", bg: "bg-[#006600]", text: "text-white" },
  GOVERNOR:     { label: "Governor", bg: "bg-[#1A5276]", text: "text-white" },
  SENATOR:      { label: "Senator", bg: "bg-amber-600", text: "text-white" },
  WOMEN_REP:    { label: "Women Rep", bg: "bg-purple-600", text: "text-white" },
  MP:           { label: "MP", bg: "bg-gray-700", text: "text-white" },
  MCA:          { label: "MCA", bg: "bg-gray-500", text: "text-white" },
};

/** Colours for contribution source type donut chart */
const SOURCE_COLORS = {
  INDIVIDUAL:      "#006600",
  CORPORATE:       "#1A5276",
  HARAMBEE:        "#F57F17",
  SELF_FUNDING:    "#7B1FA2",
  POLITICAL_PARTY: "#D32F2F",
  ORGANISATION:    "#00838F",
};

/** Colours for s.19 expenditure category donut chart */
const CATEGORY_COLORS = {
  VENUE:       "#006600",
  PUBLICITY:   "#1A5276",
  ADVERTISING: "#F57F17",
  PERSONNEL:   "#7B1FA2",
  TRANSPORT:   "#D32F2F",
  OTHER:       "#6B7280",
};

/** ECF Act s.19 category labels */
const CATEGORY_LABELS = {
  VENUE:       "Venue",
  PUBLICITY:   "Publicity materials",
  ADVERTISING: "Advertising",
  PERSONNEL:   "Campaign personnel",
  TRANSPORT:   "Transportation",
  OTHER:       "Other expenses",
};

/** Election day — Kenya 2027 General Election */
const ELECTION_DATE = new Date("2027-08-10");

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `KES ${(num / 1_000).toFixed(0)}K`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

function getDaysToElection() {
  const now = new Date();
  const diff = ELECTION_DATE - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: candidate, isLoading: profileLoading, isError: profileError } = useCandidate(id);
  const { data: finance, isLoading: financeLoading } = useCandidateFinance(id);

  const daysToElection = useMemo(() => getDaysToElection(), []);
  const isLoading = profileLoading || financeLoading;

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return <DetailSkeleton />;
  }

  // ── Error state ───────────────────────────────────────────────
  if (profileError || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-[#BB0000]" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">Candidate not found</h2>
        <p className="mt-2 text-sm text-gray-500">This candidate profile could not be loaded.</p>
        <button
          onClick={() => navigate("/candidates")}
          className="mt-4 rounded-lg bg-[#006600] px-4 py-2 text-sm font-medium text-white hover:bg-[#005500]"
        >
          Back to candidates
        </button>
      </div>
    );
  }

  const typeConfig = ELECTION_TYPE_CONFIG[candidate.election_type] || {
    label: candidate.election_type, bg: "bg-gray-500", text: "text-white",
  };

  return (
    <div className="space-y-6">

      {/* ── A. PROFILE HEADER ──────────────────────────────────── */}
      <section>
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#006600] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to candidates
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Photo */}
            <div className="relative h-24 w-24 flex-shrink-0 sm:h-28 sm:w-28">
              {candidate.photo_url ? (
                <img
                  src={candidate.photo_url}
                  alt={candidate.full_name}
                  className="h-full w-full rounded-2xl object-cover ring-4 ring-gray-100"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#006600]/10 to-[#006600]/5 ring-4 ring-[#006600]/10 text-3xl font-bold text-[#006600]">
                  {getInitials(candidate.full_name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900 lg:text-3xl">
                  {candidate.full_name}
                </h1>
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${typeConfig.bg} ${typeConfig.text}`}>
                  {typeConfig.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {candidate.constituency ? `${candidate.constituency}, ` : ""}
                  {candidate.county}
                </span>
                {candidate.party_name && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    {candidate.party_name}
                    {candidate.party_abbreviation && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                        {candidate.party_abbreviation}
                      </span>
                    )}
                  </span>
                )}
                {candidate.iebc_registration_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    IEBC Registered: {new Date(candidate.iebc_registration_date).toLocaleDateString("en-KE")}
                  </span>
                )}
              </div>

              {/* Legal reference */}
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400">
                <Shield className="h-3 w-3" />
                ECF Act s.6 — Authorised person registered by IEBC
              </div>
            </div>

            {/* Action buttons (desktop) */}
            <div className="hidden sm:flex flex-col gap-2">
              <ShareButton candidate={finance || candidate} />
            </div>
          </div>
        </div>
      </section>


      {/* ── B. COMPLIANCE INDICATOR ────────────────────────────── */}
      <section>
        <ComplianceIndicator
          totalExpenditure={finance?.total_expenditure || candidate.total_expenditure}
          spendingLimit={finance?.spending_limit || candidate.spending_limit}
          complianceStatus={finance?.compliance_status}
        />
      </section>


      {/* ── C. FINANCIAL SUMMARY CARDS ─────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <FinanceCard
          label="Total Contributions"
          value={formatKES(finance?.total_contributions || 0)}
          subtext={`${finance?.contribution_count || 0} transactions`}
          icon={DollarSign}
          variant="accent"
        />
        <FinanceCard
          label="Total Expenditure"
          value={formatKES(finance?.total_expenditure || 0)}
          subtext={`${finance?.expenditure_count || 0} transactions`}
          icon={TrendingUp}
          variant={finance?.compliance_status === "VIOLATION" ? "alert" : "default"}
        />
        <FinanceCard
          label="Remaining Budget"
          value={formatKES(finance?.remaining_budget || 0)}
          subtext="Spending limit minus expenditure"
          icon={Wallet}
        />
        <FinanceCard
          label="Days to Election"
          value={daysToElection.toLocaleString()}
          subtext="10 August 2027"
          icon={Calendar}
        />
      </section>


      {/* ── Anonymous contribution warning (s.13) ──────────────── */}
      {finance && finance.anonymous_contribution_count > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#BB0000]/20 bg-[#BB0000]/5 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#BB0000] mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#BB0000]">
              Anonymous Contributions Detected
            </p>
            <p className="mt-1 text-xs text-gray-600">
              This candidate has received {finance.anonymous_contribution_count} anonymous
              contribution{finance.anonymous_contribution_count > 1 ? "s" : ""} totalling{" "}
              {formatKES(finance.anonymous_contribution_total)}.
              Under ECF Act s.13(1), anonymous contributions must be reported to
              IEBC within 14 days.
            </p>
          </div>
        </div>
      )}


      {/* ── D & E. BREAKDOWN CHARTS (side-by-side on desktop) ──── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* D. Contribution breakdown by source type (s.11) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-bold text-gray-900">Contribution Sources</h2>
          <p className="text-xs text-gray-400 mt-0.5">ECF Act s.11 — Sources of campaign finances</p>

          {finance?.top_contributors?.length > 0 ? (
            <div className="mt-4">
              <DonutChart
                data={(finance.expenditure_by_category || []).length > 0
                  ? buildSourceData(finance)
                  : []
                }
                colors={SOURCE_COLORS}
                total={Number(finance.total_contributions) || 0}
              />
              {/* Source legend */}
              <div className="mt-4 space-y-2">
                {buildSourceData(finance).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: SOURCE_COLORS[item.name] || "#6B7280" }}
                      />
                      <span className="text-gray-600">{formatSourceLabel(item.name)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{formatKES(item.value)}</span>
                      <span className="ml-2 text-xs text-gray-400">{item.pct.toFixed(1)}%</span>
                      {item.pct > 20 && (
                        <span className="ml-1.5 rounded bg-[#BB0000]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#BB0000]">
                          &gt;20%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChartState message="No contribution data available" />
          )}
        </div>

        {/* E. Expenditure breakdown by s.19 category */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-bold text-gray-900">Expenditure Categories</h2>
          <p className="text-xs text-gray-400 mt-0.5">ECF Act s.19 — Authorised campaign expenses</p>

          {finance?.expenditure_by_category?.length > 0 ? (
            <div className="mt-4">
              <DonutChart
                data={finance.expenditure_by_category.map((c) => ({
                  name: c.category,
                  value: Number(c.total_amount),
                  pct: c.percentage_of_total,
                }))}
                colors={CATEGORY_COLORS}
                total={Number(finance.total_expenditure) || 0}
              />
              {/* Category legend */}
              <div className="mt-4 space-y-2">
                {finance.expenditure_by_category.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[c.category] || "#6B7280" }}
                      />
                      <span className="text-gray-600">{CATEGORY_LABELS[c.category] || c.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{formatKES(c.total_amount)}</span>
                      <span className="ml-2 text-xs text-gray-400">{c.percentage_of_total.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChartState message="No expenditure data available" />
          )}
        </div>
      </section>


      {/* ── F. TOP CONTRIBUTORS TABLE ──────────────────────────── */}
      {finance?.top_contributors?.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Top Contributors</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                ECF Act s.12(2) — Single source must not exceed 20% of total
              </p>
            </div>
            <button
              onClick={() => {
                // CSV export
                const csv = [
                  "Contributor,Type,Amount (KES),% of Total,Exceeds Cap",
                  ...finance.top_contributors.map((c) =>
                    `"${c.contributor_name}",${c.source_type},${c.total_amount},${c.percentage_of_total},${c.exceeds_single_source_cap}`
                  ),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${candidate.full_name.replace(/\s+/g, "_")}_contributors.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Contributor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">% of Total</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">s.12(2)</th>
                </tr>
              </thead>
              <tbody>
                {finance.top_contributors.map((c, i) => (
                  <tr
                    key={c.contributor_name}
                    className={`border-b border-gray-50 ${
                      c.exceeds_single_source_cap ? "bg-[#BB0000]/3" : ""
                    }`}
                  >
                    <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{c.contributor_name}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {formatSourceLabel(c.source_type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatKES(c.total_amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${c.percentage_of_total > 20 ? "text-[#BB0000]" : "text-gray-600"}`}>
                        {c.percentage_of_total.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {c.exceeds_single_source_cap ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#BB0000]/10 px-2 py-0.5 text-[10px] font-bold text-[#BB0000]">
                          <AlertTriangle className="h-3 w-3" />
                          FLAGGED
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* View all link */}
          <div className="border-t border-gray-100 px-5 py-3">
            <Link
              to={`/candidates/${id}#contributions`}
              className="flex items-center gap-1 text-sm font-medium text-[#006600] hover:underline"
            >
              View all contributions
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}


      {/* ── G. ACTION BUTTONS ──────────────────────────────────── */}
      <section className="flex flex-wrap gap-3">
        <Link
          to={`/candidates/${id}#compare`}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-[#006600]/30 transition-colors"
        >
          <GitCompare className="h-4 w-4 text-[#006600]" />
          Compare candidates
        </Link>

        {/* Mobile share */}
        <div className="sm:hidden">
          <ShareButton candidate={finance || candidate} />
        </div>

        <Link
          to="/report"
          className="flex items-center gap-2 rounded-xl border border-[#BB0000]/20 bg-[#BB0000]/5 px-4 py-2.5 text-sm font-medium text-[#BB0000] hover:bg-[#BB0000]/10 transition-colors"
        >
          <AlertTriangle className="h-4 w-4" />
          Report concern
        </Link>

        <a
          href={`https://www.iebc.or.ke`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="h-4 w-4 text-gray-400" />
          View on IEBC
        </a>
      </section>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Recharts donut chart for contribution/expenditure breakdown.
 */
function DonutChart({ data, colors, total }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={colors[entry.name] || "#6B7280"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatKES(value)}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Build source-type chart data from the finance summary.
 * Groups contributions by top_contributors source_type.
 */
function buildSourceData(finance) {
  if (!finance?.top_contributors) return [];
  const map = {};
  for (const c of finance.top_contributors) {
    const key = c.source_type;
    if (!map[key]) map[key] = { name: key, value: 0, pct: 0 };
    map[key].value += Number(c.total_amount);
  }
  const total = Number(finance.total_contributions) || 1;
  return Object.values(map).map((d) => ({
    ...d,
    pct: (d.value / total) * 100,
  }));
}

function formatSourceLabel(type) {
  const labels = {
    INDIVIDUAL: "Individual",
    CORPORATE: "Corporate",
    HARAMBEE: "Harambee",
    SELF_FUNDING: "Self-funding",
    POLITICAL_PARTY: "Party",
    ORGANISATION: "Organisation",
  };
  return labels[type] || type;
}

function EmptyChartState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
        <TrendingDown className="h-6 w-6 text-gray-400" />
      </div>
      <p className="mt-3 text-sm text-gray-400">{message}</p>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Back link */}
      <div className="h-4 w-32 rounded bg-gray-200" />

      {/* Profile header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex gap-5">
          <div className="h-28 w-28 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-3 w-1/3 rounded bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Compliance bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex justify-between">
          <div className="h-10 w-10 rounded-xl bg-gray-200" />
          <div className="h-8 w-16 rounded bg-gray-200" />
        </div>
        <div className="mt-4 h-3 w-full rounded-full bg-gray-200" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="h-10 w-10 rounded-xl bg-gray-200" />
            <div className="mt-3 h-7 w-3/4 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="mt-4 mx-auto h-48 w-48 rounded-full bg-gray-100" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="mt-4 mx-auto h-48 w-48 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
