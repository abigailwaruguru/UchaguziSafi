/**
 * UCHAGUZI SAFI — useCandidateFinance Hook
 * ===========================================
 * React Query hook for the candidate financial summary endpoint.
 *
 * API: GET /api/v1/candidates/{id}/finance
 * Response: CandidateFinanceSummary schema
 *
 * Fields consumed:
 *   candidate_id, candidate_name, election_type, county, party_name,
 *   spending_limit, total_contributions, total_expenditure,
 *   remaining_budget, spending_utilisation_pct, compliance_status,
 *   contribution_count, top_contributors[],
 *   anonymous_contribution_count, anonymous_contribution_total,
 *   expenditure_count, expenditure_by_category[]
 *
 * Module: M1 Fedha Dashboard
 */

import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export function useCandidateFinance(candidateId) {
  return useQuery({
    queryKey: ["candidate-finance", candidateId],
    queryFn: async () => {
      const response = await api.get(`/candidates/${candidateId}/finance`);
      return response.data;
    },
    enabled: !!candidateId,
    staleTime: 2 * 60 * 1000,
  });
}

export default useCandidateFinance;
