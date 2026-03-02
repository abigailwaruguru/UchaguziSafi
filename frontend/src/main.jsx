/**
 * UCHAGUZI SAFI — Application Entry Point
 * ==========================================
 * React 18 root with:
 *   - React Query (TanStack Query v5) for server-state caching
 *   - React Router v6 for client-side navigation
 *   - StrictMode for development warnings
 *
 * React Query is configured with stale times appropriate for
 * campaign finance data — contributions and expenditures update
 * throughout the campaign period (ECF Act "expenditure period"),
 * so a 2-minute stale time balances freshness with mobile data costs.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import "./index.css";

// ── React Query Client ──────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 minutes — balances data freshness with mobile bandwidth
      staleTime: 2 * 60 * 1000,
      // Cache for 10 minutes before garbage collection
      gcTime: 10 * 60 * 1000,
      // Retry once on failure (mobile connections can be flaky)
      retry: 1,
      // Don't refetch when window regains focus on mobile
      // (prevents unnecessary data usage for Kenyan users)
      refetchOnWindowFocus: false,
    },
  },
});

// ── Render Application ──────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
