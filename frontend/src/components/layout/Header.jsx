/**
 * UCHAGUZI SAFI — Header Component
 * ===================================
 * Sticky responsive header with Kenya flag colour branding.
 *
 * Design decisions:
 *   - Sticky on scroll: Keeps navigation accessible during long
 *     candidate lists and financial dashboards (M1 Fedha, M4 Tafuta)
 *   - Mobile hamburger → MobileNav slide-out panel
 *   - Language toggle (EN/SW): UI scaffold for future i18n.
 *     Swahili labels already used in the bottom tab bar for
 *     Wananchi (citizen) accessibility
 *   - Active route indicator: Kenya-green underline on desktop,
 *     matching the bottom tab highlight on mobile
 *
 * Route-to-module mapping (desktop nav):
 *   /           → Home (Landing)
 *   /candidates → M4 Tafuta (Candidate Search)
 *   /map        → M2 Taswira (County Spending Map)
 *   /report     → M3 Ripoti Ubadhirifu (Incident Reporting)
 *   /search     → M4 Tafuta (Advanced Search)
 *   /dashboard  → M1 Fedha (Financial Dashboard) — desktop only
 *   /alerts     → M5 Tahadhari (Alert Feed) — desktop only
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Map,
  AlertTriangle,
  Search,
  BarChart3,
  Bell,
  Menu,
  Globe,
} from "lucide-react";

/**
 * Navigation items — ordered by priority for the primary
 * user personas (Wananchi first, then journalists/CSOs).
 */
const NAV_ITEMS = [
  { path: "/", label: "Home", labelSw: "Nyumbani", icon: Home },
  { path: "/candidates", label: "Candidates", labelSw: "Wagombea", icon: Users },
  { path: "/map", label: "County Map", labelSw: "Ramani", icon: Map },
  { path: "/report", label: "Report Misuse", labelSw: "Ripoti", icon: AlertTriangle },
  { path: "/search", label: "Search", labelSw: "Tafuta", icon: Search },
];

/** Desktop-only nav items for power users (journalists, IEBC officers) */
const DESKTOP_EXTRA_ITEMS = [
  { path: "/dashboard", label: "Dashboard", labelSw: "Fedha", icon: BarChart3 },
  { path: "/alerts", label: "Alerts", labelSw: "Tahadhari", icon: Bell },
];

export default function Header({ onMenuOpen }) {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [lang, setLang] = useState("EN");

  // Track scroll position for shadow effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLang = () => setLang((prev) => (prev === "EN" ? "SW" : "EN"));

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`
        sticky top-0 z-50 w-full bg-white
        transition-shadow duration-300
        ${isScrolled ? "shadow-md" : "border-b border-gray-100"}
      `}
    >
      {/* ── Kenya flag accent stripe (green-black-red) ──────────── */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-[#006600]" />
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-[#BB0000]" />
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* ── Logo / Brand ───────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {/* Shield icon — stylised from Kenya coat of arms concept */}
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#006600] transition-transform group-hover:scale-105">
            <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
            {/* Small red accent dot */}
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#BB0000]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-[#006600]">
              UCHAGUZI
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BB0000]">
              SAFI
            </span>
          </div>
        </Link>

        {/* ── Desktop Navigation ─────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-1">
          {[...NAV_ITEMS, ...DESKTOP_EXTRA_ITEMS].map(({ path, label, labelSw, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`
                relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                rounded-lg transition-colors duration-200
                ${
                  isActive(path)
                    ? "text-[#006600] bg-[#006600]/5"
                    : "text-gray-600 hover:text-[#006600] hover:bg-gray-50"
                }
              `}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              <span>{lang === "SW" ? labelSw : label}</span>
              {/* Active indicator bar */}
              {isActive(path) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#006600]" />
              )}
            </Link>
          ))}
        </nav>

        {/* ── Right actions ──────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="
              flex items-center gap-1 rounded-lg border border-gray-200
              px-2.5 py-1.5 text-xs font-semibold text-gray-600
              transition-colors hover:border-[#006600] hover:text-[#006600]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
            "
            aria-label={`Switch language to ${lang === "EN" ? "Swahili" : "English"}`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{lang === "EN" ? "SW" : "EN"}</span>
          </button>

          {/* Alerts bell — visible on tablet+ */}
          <Link
            to="/alerts"
            className="
              hidden md:flex items-center justify-center h-9 w-9
              rounded-lg text-gray-500 transition-colors
              hover:bg-gray-50 hover:text-[#006600]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
            "
            aria-label="Alerts"
          >
            <Bell className="h-5 w-5" />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={onMenuOpen}
            className="
              flex lg:hidden items-center justify-center h-9 w-9
              rounded-lg text-gray-700 transition-colors
              hover:bg-gray-50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
            "
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
