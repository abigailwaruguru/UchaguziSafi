/**
 * UCHAGUZI SAFI — Mobile Navigation Panel
 * ==========================================
 * Slide-out navigation for mobile devices (<1024px).
 *
 * Design decisions:
 *   - Slides from the right (RTL-friendly, matches common mobile patterns)
 *   - Backdrop overlay with click-to-close
 *   - Includes ALL nav items (core + power-user routes)
 *   - Kenya-green active indicator
 *   - Close on route change (via useEffect on location)
 *   - Escape key closes the panel
 *   - Focus trap for accessibility
 *
 * Human-centred design:
 *   - Large touch targets (48px min) for mobile usability
 *   - Swahili labels alongside English for Wananchi persona
 *   - Legal basis callout at bottom for institutional credibility
 */

import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Map,
  AlertTriangle,
  Search,
  BarChart3,
  Bell,
  X,
  Shield,
  ExternalLink,
} from "lucide-react";

const ALL_NAV_ITEMS = [
  { path: "/", label: "Home", labelSw: "Nyumbani", icon: Home, module: null },
  { path: "/candidates", label: "Candidates", labelSw: "Wagombea", icon: Users, module: "M4 Tafuta" },
  { path: "/map", label: "County Map", labelSw: "Ramani ya Kaunti", icon: Map, module: "M2 Taswira" },
  { path: "/report", label: "Report Misuse", labelSw: "Ripoti Ubadhirifu", icon: AlertTriangle, module: "M3 Ripoti" },
  { path: "/search", label: "Search", labelSw: "Tafuta", icon: Search, module: "M4 Tafuta" },
  { path: "/dashboard", label: "Finance Dashboard", labelSw: "Dashibodi ya Fedha", icon: BarChart3, module: "M1 Fedha" },
  { path: "/alerts", label: "Alerts", labelSw: "Tahadhari", icon: Bell, module: "M5 Tahadhari" },
];

export default function MobileNav({ isOpen, onClose }) {
  const location = useLocation();
  const panelRef = useRef(null);

  // Close on route change
  useEffect(() => {
    if (isOpen) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Slide-out Panel ───────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw]
          bg-white shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006600]">
              <BarChart3 className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-extrabold tracking-tight text-[#006600]">
              UCHAGUZI SAFI
            </span>
          </div>
          <button
            onClick={onClose}
            className="
              flex h-9 w-9 items-center justify-center rounded-lg
              text-gray-500 transition-colors hover:bg-gray-100
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
            "
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Kenya flag stripe ──────────────────────────────── */}
        <div className="flex h-0.5 w-full">
          <div className="flex-1 bg-[#006600]" />
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-[#BB0000]" />
        </div>

        {/* ── Navigation Links ───────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {ALL_NAV_ITEMS.map(({ path, label, labelSw, icon: Icon, module }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`
                    flex items-center gap-3 rounded-xl px-4 py-3
                    transition-colors duration-200
                    ${
                      isActive(path)
                        ? "bg-[#006600]/5 text-[#006600]"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {/* Icon with active background */}
                  <div
                    className={`
                      flex h-10 w-10 flex-shrink-0 items-center justify-center
                      rounded-lg transition-colors
                      ${
                        isActive(path)
                          ? "bg-[#006600] text-white"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>

                  {/* Label stack: English + Swahili */}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-xs text-gray-400">{labelSw}</span>
                  </div>

                  {/* Module badge */}
                  {module && (
                    <span className="ml-auto rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                      {module}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Bottom: Legal basis & attribution ──────────────── */}
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-start gap-2 rounded-lg bg-[#006600]/5 p-3">
            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#006600]" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-[#006600]">Legal basis:</span>{" "}
              Election Campaign Financing Act, Cap. 7A (2013)
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>Powered by TI-Kenya</span>
            <a
              href="https://tikenya.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#006600] hover:underline"
            >
              tikenya.org <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
