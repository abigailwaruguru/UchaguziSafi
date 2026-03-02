/**
 * UCHAGUZI SAFI — API Service Layer
 * ====================================
 * Axios instance pre-configured for the FastAPI backend.
 * All endpoints route through /api/v1/ matching the backend router
 * structure defined in backend/app/main.py.
 *
 * Module-to-Endpoint Mapping:
 *   M1 Fedha Dashboard   → /contributions, /expenditures
 *   M2 Taswira           → /visualisation
 *   M3 Ripoti Ubadhirifu → /incidents
 *   M4 Tafuta            → /candidates, /search
 *   M5 Tahadhari         → /alerts
 *   M6 Usimamizi         → /auth
 *
 * Auth tokens are attached automatically via interceptors.
 * Monetary values returned from the API are in KES (Kenyan Shillings)
 * as required by the ECF Act.
 */

import axios from "axios";

// ── Base Instance ───────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeout: 15000, // 15s timeout — accounts for slower mobile connections
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request Interceptor: Attach Auth Token ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("uchaguzi_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle Common Errors ──────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // 401: Token expired or invalid — redirect to login
      if (status === 401) {
        localStorage.removeItem("uchaguzi_token");
        window.location.href = "/";
      }

      // 403: Insufficient permissions (e.g., non-IEBC user
      //       attempting admin actions per M6 Usimamizi)
      if (status === 403) {
        console.warn("Uchaguzi Safi: Insufficient permissions");
      }

      // 429: Rate limit — protect the API from abuse
      if (status === 429) {
        console.warn("Uchaguzi Safi: Rate limit reached. Please wait.");
      }
    }

    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════
// MODULE API FUNCTIONS
// Each section corresponds to an Uchaguzi Safi module.
// ═══════════════════════════════════════════════════════════════════

// ── M6 Usimamizi: Authentication ────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/me"),
};

// ── M4 Tafuta: Candidate Search & Registry ──────────────────────
// Candidates registered per ECF Act s.6 (authorised persons)
export const candidatesAPI = {
  getAll: (params) => api.get("/candidates", { params }),
  getById: (id) => api.get(`/candidates/${id}`),
  search: (query) => api.get("/candidates/search", { params: { q: query } }),
  getByCounty: (countyCode) =>
    api.get("/candidates", { params: { county: countyCode } }),
};

// ── M1 Fedha Dashboard: Contributions ───────────────────────────
// Contributions regulated under ECF Act Part IV (s.11–17)
export const contributionsAPI = {
  getByCandidateId: (candidateId) =>
    api.get(`/contributions`, { params: { candidate_id: candidateId } }),
  getByPartyId: (partyId) =>
    api.get(`/contributions`, { params: { party_id: partyId } }),
  getSummary: () => api.get("/contributions/summary"),
  // ECF Act s.12(2): Flag single-source contributions exceeding 20%
  getComplianceFlags: () => api.get("/contributions/compliance"),
};

// ── M1 Fedha Dashboard: Expenditures ────────────────────────────
// Expenditures regulated under ECF Act Part III (s.5–10)
// Authorised categories per ECF Act s.19: venue, publicity,
// advertising, personnel, transportation
export const expendituresAPI = {
  getByCandidateId: (candidateId) =>
    api.get(`/expenditures`, { params: { candidate_id: candidateId } }),
  getByCategory: (category) =>
    api.get(`/expenditures`, { params: { category } }),
  getSummary: () => api.get("/expenditures/summary"),
  // ECF Act s.18: Check against IEBC-gazetted spending limits
  getSpendingLimits: () => api.get("/expenditures/limits"),
};

// ── M3 Ripoti Ubadhirifu: Incident Reporting ────────────────────
// Tracks misuse of public resources per ECF Act s.14(2)
export const incidentsAPI = {
  submit: (incidentData) => api.post("/incidents", incidentData),
  track: (trackingId) => api.get(`/incidents/track/${trackingId}`),
  getRecent: (params) => api.get("/incidents", { params }),
  getByCounty: (countyCode) =>
    api.get("/incidents", { params: { county: countyCode } }),
};

// ── M2 Taswira: Visualisation Data ──────────────────────────────
export const visualisationAPI = {
  getCountySummary: () => api.get("/visualisation/county-summary"),
  getSpendingTimeline: () => api.get("/visualisation/spending-timeline"),
  getPartyComparison: () => api.get("/visualisation/party-comparison"),
  getCategoryBreakdown: () => api.get("/visualisation/category-breakdown"),
};

// ── M5 Tahadhari: Alerts ────────────────────────────────────────
// Triggered when thresholds from ECF Act s.12 and s.18 are breached
export const alertsAPI = {
  getRecent: (params) => api.get("/alerts", { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  subscribe: (preferences) => api.post("/alerts/subscribe", preferences),
};

// ── System ──────────────────────────────────────────────────────
export const systemAPI = {
  healthCheck: () => api.get("/health"),
};

export default api;
