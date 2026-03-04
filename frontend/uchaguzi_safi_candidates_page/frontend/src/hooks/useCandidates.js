/**
 * UCHAGUZI SAFI — useCandidates Hook
 * =====================================
 * React Query hook for fetching candidates from the API
 * with filtering, pagination, and caching.
 *
 * Wraps the candidatesAPI.getAll() service method and
 * manages query keys for automatic refetching when
 * filter parameters change.
 *
 * Caching strategy:
 *   - staleTime: 2 min (from QueryClient config in main.jsx)
 *   - Filters are part of the query key → changing any filter
 *     triggers a new fetch automatically
 *   - keepPreviousData: true → smooth transition between pages
 */

import { useQuery } from "@tanstack/react-query";
import { candidatesAPI } from "../services/api";

/**
 * @param {Object} filters
 * @param {string} [filters.county]        - County name filter
 * @param {string} [filters.election_type] - ElectionType enum value
 * @param {string} [filters.party_id]      - Party UUID filter
 * @param {string} [filters.search]        - Name search (partial match)
 * @param {string} [filters.status]        - CandidateStatus enum value
 * @param {number} [filters.page]          - Page number (1-indexed)
 * @param {number} [filters.per_page]      - Items per page (default 12)
 */
export function useCandidates(filters = {}) {
  const {
    county = "",
    election_type = "",
    party_id = "",
    search = "",
    status = "",
    page = 1,
    per_page = 12,
  } = filters;

  // Build clean params — only send non-empty values
  const params = {};
  if (county) params.county = county;
  if (election_type) params.election_type = election_type;
  if (party_id) params.party_id = party_id;
  if (search && search.length >= 2) params.search = search;
  if (status) params.status = status;
  params.page = page;
  params.per_page = per_page;

  return useQuery({
    queryKey: ["candidates", params],
    queryFn: async () => {
      const response = await candidatesAPI.getAll(params);
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching a single candidate by ID.
 * Used on the CandidateDetail page (M4 Tafuta).
 */
export function useCandidate(candidateId) {
  return useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: async () => {
      const response = await candidatesAPI.getById(candidateId);
      return response.data;
    },
    enabled: !!candidateId,
  });
}

export default useCandidates;
