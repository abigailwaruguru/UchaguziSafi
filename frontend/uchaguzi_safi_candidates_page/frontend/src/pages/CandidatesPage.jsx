/**
 * UCHAGUZI SAFI — Candidates Page
 * ==================================
 * Main listing page for the M4 Tafuta (Search & Registry) module.
 *
 * Displays a searchable, filterable grid of candidates registered
 * under ECF Act s.6 as authorised persons for the election.
 *
 * Architecture:
 *   CandidatesPage (this file)
 *     └── CandidateFilters — search, county, election type
 *     └── CandidateCard[] — responsive card grid
 *     └── Pagination — page controls
 *     └── Loading skeletons / empty state
 *
 * Data flow:
 *   URL params → filter state → useCandidates(filters) → render
 *   Filter changes → update state + reset to page 1
 *
 * API endpoint: GET /api/v1/candidates
 * Response shape: PaginatedResponse[CandidateListItem]
 *   { items: [...], total, page, per_page, total_pages }
 *
 * User personas served:
 *   - Wananchi (citizens): Browse candidates by county
 *   - Journalists: Filter by election type, compare spending
 *   - CSOs: Monitor compliance status across regions
 */

import { useState, useCallback } from "react";
import {
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SearchX,
  Shield,
} from "lucide-react";
import { useCandidates } from "../hooks/useCandidates";
import CandidateCard from "../components/candidates/CandidateCard";
import CandidateFilters from "../components/candidates/CandidateFilters";

/** Default filter state */
const DEFAULT_FILTERS = {
  search: "",
  election_type: "",
  county: "",
  page: 1,
  per_page: 12,
};

export default function CandidatesPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { data, isLoading, isError, error, isFetching } = useCandidates(filters);

  const candidates = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const currentPage = filters.page;

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006600]/10">
            <Users className="h-5 w-5 text-[#006600]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
            <p className="text-sm text-gray-500">
              Registered candidates for Kenya&apos;s 2027 General Elections
            </p>
          </div>
        </div>
        {/* Legal basis note */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Shield className="h-3 w-3" />
          ECF Act s.6 — Authorised persons registered by IEBC
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <CandidateFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={total}
        isLoading={isLoading || isFetching}
      />

      {/* ── Loading State ────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────── */}
      {isError && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-16 px-4 text-center">
          <AlertCircle className="h-10 w-10 text-[#BB0000]" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Failed to load candidates
          </h3>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            {error?.message || "An error occurred while fetching candidate data. Please try again."}
          </p>
          <button
            onClick={() => setFilters({ ...filters })}
            className="mt-4 rounded-lg bg-[#006600] px-4 py-2 text-sm font-medium text-white hover:bg-[#005500] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────── */}
      {!isLoading && !isError && candidates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <SearchX className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No candidates found
          </h3>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            No candidates match your current filters. Try broadening
            your search or clearing the filters.
          </p>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Candidate Grid ───────────────────────────────────── */}
      {!isLoading && !isError && candidates.length > 0 && (
        <>
          <div
            className={`
              grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3
              transition-opacity duration-300
              ${isFetching ? "opacity-60" : "opacity-100"}
            `}
          >
            {candidates.map((candidate, index) => (
              <div
                key={candidate.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CandidateCard candidate={candidate} />
              </div>
            ))}
          </div>

          {/* ── Pagination ─────────────────────────────────────── */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              perPage={filters.per_page}
              onPageChange={goToPage}
            />
          )}
        </>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
 * PAGINATION COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */

function Pagination({ currentPage, totalPages, total, perPage, onPageChange }) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  /**
   * Generate page numbers with ellipsis.
   * Always shows: first, last, current, and ±1 around current.
   */
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      {/* Result range text */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-900">{startItem}</span>
        –<span className="font-medium text-gray-900">{endItem}</span>{" "}
        of <span className="font-medium text-gray-900">{total}</span> candidates
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            flex h-9 w-9 items-center justify-center rounded-lg
            border border-gray-200 text-gray-500 transition-colors
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
          "
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg
                text-sm font-medium transition-all duration-200
                ${
                  page === currentPage
                    ? "bg-[#006600] text-white shadow-sm"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }
              `}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            flex h-9 w-9 items-center justify-center rounded-lg
            border border-gray-200 text-gray-500 transition-colors
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
          "
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
 * SKELETON LOADING CARD
 * ═══════════════════════════════════════════════════════════════════ */

function SkeletonCard({ index }) {
  return (
    <div
      className="animate-pulse rounded-2xl border border-gray-200 bg-white overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Top section */}
      <div className="flex items-center gap-4 p-4 pb-3">
        <div className="h-14 w-14 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-md bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-md bg-gray-200" />
            <div className="h-5 w-10 rounded-md bg-gray-100" />
          </div>
        </div>
      </div>
      {/* Details */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2">
        <div className="h-3.5 w-1/2 rounded bg-gray-100" />
        <div className="h-3.5 w-2/3 rounded bg-gray-100" />
      </div>
      {/* Spending bar */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex justify-between mb-1.5">
          <div className="h-3 w-16 rounded bg-gray-100" />
          <div className="h-3 w-8 rounded bg-gray-100" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100" />
        <div className="mt-1 flex justify-between">
          <div className="h-2.5 w-20 rounded bg-gray-50" />
          <div className="h-2.5 w-24 rounded bg-gray-50" />
        </div>
      </div>
    </div>
  );
}
