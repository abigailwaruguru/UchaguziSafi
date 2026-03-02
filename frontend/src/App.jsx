/**
 * UCHAGUZI SAFI — Root Application Component
 * =============================================
 * Routes mapped to the 6 platform modules:
 *
 *   Route                 Module                     User Persona Focus
 *   ─────────────────────────────────────────────────────────────────────
 *   /                     Home / Landing             All (Wananchi entry)
 *   /dashboard            M1 Fedha Dashboard         Journalists, CSOs
 *   /candidates           M4 Tafuta — Registry       Wananchi, Journalists
 *   /candidates/:id       M4 Tafuta — Detail         Wananchi, Journalists
 *   /map                  M2 Taswira — County Map    All personas
 *   /report               M3 Ripoti — Submit         Wananchi, CSOs
 *   /track/:id            M3 Ripoti — Track          Wananchi
 *   /search               M4 Tafuta — Search         Journalists, CSOs
 *   /alerts               M5 Tahadhari — Alerts      Journalists, IEBC
 *
 * Navigation is mobile-first with a bottom tab bar on small screens
 * (reflecting Kenya's 59% mobile internet penetration) and a top
 * navbar on desktop.
 *
 * Legal basis: Election Campaign Financing Act, Cap. 7A (2013)
 */

import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// ── Layout Components (loaded eagerly — small bundles) ──────────
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";

// ── Page Components (code-split for mobile performance) ─────────
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CandidateList = lazy(() => import("./pages/CandidateList"));
const CandidateDetail = lazy(() => import("./pages/CandidateDetail"));
const CountyMap = lazy(() => import("./pages/CountyMap"));
const ReportIncident = lazy(() => import("./pages/ReportIncident"));
const TrackIncident = lazy(() => import("./pages/TrackIncident"));
const Search = lazy(() => import("./pages/Search"));
const Alerts = lazy(() => import("./pages/Alerts"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* ── Landing / Home ─────────────────────────────────── */}
          <Route path="/" element={<Home />} />

          {/* ── M1 Fedha Dashboard ─────────────────────────────── */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ── M4 Tafuta: Search & Candidate Registry ─────────── */}
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/search" element={<Search />} />

          {/* ── M2 Taswira: County Spending Map ────────────────── */}
          <Route path="/map" element={<CountyMap />} />

          {/* ── M3 Ripoti Ubadhirifu: Incident Reporting ───────── */}
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/track/:id" element={<TrackIncident />} />

          {/* ── M5 Tahadhari: Alert Feed ───────────────────────── */}
          <Route path="/alerts" element={<Alerts />} />

          {/* ── 404 ────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
