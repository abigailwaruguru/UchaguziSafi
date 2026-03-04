/**
 * UCHAGUZI SAFI — Layout Component
 * ===================================
 * Root layout shell combining all navigation components:
 *   - Header (sticky top bar with Kenya branding)
 *   - MobileNav (slide-out panel on mobile)
 *   - Main content area (React Router Outlet)
 *   - Bottom tab bar (mobile — 5 Wananchi actions)
 *   - Footer (desktop — institutional links & attribution)
 *
 * Architecture:
 *   App.jsx → <Layout> wraps all routes via <Outlet />
 *   The Layout manages the MobileNav open/close state
 *   and coordinates between header hamburger → panel toggle.
 *
 * Mobile-first responsive strategy:
 *   <768px:  Header (simplified) + bottom tabs + MobileNav
 *   ≥768px:  Header (full nav) + footer (no bottom tabs)
 *
 * This reflects Kenya's 59% mobile internet penetration —
 * the mobile experience is the PRIMARY experience.
 */

import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Map,
  AlertTriangle,
  Search,
} from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";

/**
 * Bottom tab bar items for mobile — optimised for the Wananchi
 * (citizen) user persona. Limited to 5 core actions to avoid
 * cognitive overload on small screens.
 *
 * Labels in Swahili for accessibility (code-switching is common
 * in urban Kenya — most users recognise both EN and SW).
 */
const MOBILE_TABS = [
  { path: "/", icon: Home, label: "Nyumbani" },
  { path: "/candidates", icon: Users, label: "Wagombea" },
  { path: "/map", icon: Map, label: "Ramani" },
  { path: "/report", icon: AlertTriangle, label: "Ripoti" },
  { path: "/search", icon: Search, label: "Tafuta" },
];

export default function Layout({ children }) {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* ── Sticky Header ────────────────────────────────────── */}
      <Header onMenuOpen={() => setMobileNavOpen(true)} />

      {/* ── Mobile Slide-out Nav ─────────────────────────────── */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* ── Desktop Footer ───────────────────────────────────── */}
      <Footer />

      {/* ── Mobile Bottom Tab Bar ────────────────────────────── */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-40
          flex md:hidden
          border-t border-gray-200 bg-white
          safe-area-pb
        "
        aria-label="Mobile navigation"
      >
        {MOBILE_TABS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`
                flex flex-1 flex-col items-center justify-center
                py-2.5 transition-colors duration-200
                ${active ? "text-[#006600]" : "text-gray-400"}
              `}
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator dot */}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${active ? "text-[#006600]" : "text-gray-400"}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                {active && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[#BB0000]" />
                )}
              </div>
              <span
                className={`
                  mt-1 text-[10px] font-medium
                  ${active ? "text-[#006600] font-bold" : "text-gray-400"}
                `}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
