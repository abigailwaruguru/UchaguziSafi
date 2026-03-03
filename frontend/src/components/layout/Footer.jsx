/**
 * UCHAGUZI SAFI — Footer Component
 * ===================================
 * Institutional footer providing legal context, attribution,
 * and credibility signals for the platform.
 *
 * Design decisions:
 *   - ECF Act legal basis prominently displayed — this is a
 *     compliance tool, and legal grounding builds trust
 *   - TI-Kenya attribution as required by hackathon guidelines
 *   - Social media placeholders for future campaign connectivity
 *   - Hidden on mobile to maximise screen real estate for data
 *     (the bottom tab bar provides navigation on mobile)
 *   - Kenya flag stripe as a visual anchor
 *
 * The footer is intentionally understated — the focus is on
 * the data and the dashboard, not the chrome.
 */

import { Link } from "react-router-dom";
import {
  Shield,
  ExternalLink,
  Twitter,
  Facebook,
  Github,
  Mail,
} from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Platform",
    links: [
      { label: "Home", to: "/" },
      { label: "Candidates", to: "/candidates" },
      { label: "County Map", to: "/map" },
      { label: "Report Misuse", to: "/report" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "About Uchaguzi Safi", to: "#about" },
      { label: "Data Sources", to: "#data" },
      { label: "ECF Act (Cap. 7A)", href: "http://www.kenyalaw.org" },
      { label: "IEBC Portal", href: "https://www.iebc.or.ke" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "#privacy" },
      { label: "Terms of Use", to: "#terms" },
      { label: "Data Protection", to: "#data-protection" },
      { label: "Contact Us", to: "#contact" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Twitter, href: "#", label: "Twitter / X" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "mailto:info@uchaguzi.ke", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="hidden md:block bg-gray-50 border-t border-gray-200">
      {/* ── Main footer content ─────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* ── Brand column ────────────────────────────────── */}
          <div className="col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006600]">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-extrabold tracking-tight text-[#006600]">
                  UCHAGUZI SAFI
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BB0000]">
                  Clean Elections
                </span>
              </div>
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Campaign finance transparency platform for Kenya&apos;s 2027
              General Elections. Empowering citizens to hold candidates
              accountable under the Election Campaign Financing Act.
            </p>

            {/* Social links */}
            <div className="mt-5 flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="
                    flex h-9 w-9 items-center justify-center rounded-lg
                    bg-white border border-gray-200 text-gray-400
                    transition-colors hover:border-[#006600] hover:text-[#006600]
                  "
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Link columns ────────────────────────────────── */}
          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title} className="col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map(({ label, to, href }) => (
                  <li key={label}>
                    {to ? (
                      <Link
                        to={to}
                        className="
                          text-sm text-gray-500 transition-colors
                          hover:text-[#006600]
                        "
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex items-center gap-1 text-sm text-gray-500
                          transition-colors hover:text-[#006600]
                        "
                      >
                        {label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Legal basis bar ──────────────────────────────────── */}
      <div className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-gray-400 sm:flex-row lg:px-6">
          <div className="flex items-center gap-4">
            <span>&copy; 2027 Uchaguzi Safi. All rights reserved.</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="hidden sm:inline">
              Built for TI-Kenya Campaign Finance Watch Tool Hackathon 2026
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#006600]">
            <Shield className="h-3 w-3" />
            <span className="font-medium">
              ECF Act Cap. 7A (2013)
            </span>
          </div>
        </div>
      </div>

      {/* ── Kenya flag stripe ────────────────────────────────── */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-[#006600]" />
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-[#BB0000]" />
      </div>
    </footer>
  );
}
