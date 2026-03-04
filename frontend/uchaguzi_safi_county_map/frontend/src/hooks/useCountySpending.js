/**
 * UCHAGUZI SAFI — useCountySpending Hook
 * =========================================
 * React Query hook for fetching county-level spending data
 * from the M2 Taswira visualisation API.
 *
 * API: GET /api/v1/visualisation/county-summary
 * Response: CountySpendingList schema
 *   { counties: CountySpending[], national_total_spending, national_total_contributions }
 *
 * CountySpending fields:
 *   county, county_code, total_spending, candidate_count,
 *   avg_spending_per_candidate, total_contributions,
 *   incident_count, compliance_summary
 *
 * Transforms:
 *   1. Builds a lookup map keyed by county name (for GeoJSON join)
 *   2. Computes min/max spending for the colour scale
 *   3. Generates a normalised 0–1 intensity per county
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { visualisationAPI } from "../services/api";

export function useCountySpending(electionType = "") {
  const query = useQuery({
    queryKey: ["county-spending", electionType],
    queryFn: async () => {
      const params = {};
      if (electionType) params.election_type = electionType;
      const response = await visualisationAPI.getCountySummary(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — county data changes slowly
  });

  /** Transformed data for map consumption */
  const mapData = useMemo(() => {
    if (!query.data?.counties) {
      return {
        lookup: {},
        minSpending: 0,
        maxSpending: 0,
        nationalTotal: 0,
        nationalContributions: 0,
      };
    }

    const counties = query.data.counties;
    const lookup = {};
    let minSpending = Infinity;
    let maxSpending = 0;

    for (const county of counties) {
      const spending = Number(county.total_spending) || 0;
      if (spending < minSpending) minSpending = spending;
      if (spending > maxSpending) maxSpending = spending;

      lookup[county.county] = {
        ...county,
        total_spending: spending,
        total_contributions: Number(county.total_contributions) || 0,
        avg_spending_per_candidate: Number(county.avg_spending_per_candidate) || 0,
        // Normalised intensity (0–1) computed after the loop
        intensity: 0,
      };
    }

    // Handle edge case: all counties have same spending
    if (minSpending === Infinity) minSpending = 0;
    const range = maxSpending - minSpending;

    // Compute normalised intensity for each county
    for (const key of Object.keys(lookup)) {
      lookup[key].intensity = range > 0
        ? (lookup[key].total_spending - minSpending) / range
        : 0;
    }

    return {
      lookup,
      minSpending,
      maxSpending,
      nationalTotal: Number(query.data.national_total_spending) || 0,
      nationalContributions: Number(query.data.national_total_contributions) || 0,
    };
  }, [query.data]);

  return {
    ...query,
    mapData,
  };
}

export default useCountySpending;
