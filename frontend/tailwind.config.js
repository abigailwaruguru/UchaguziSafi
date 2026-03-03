/**
 * UCHAGUZI SAFI — Tailwind CSS Configuration
 * =============================================
 * Kenya-themed design system aligned with the project's visual identity.
 *
 * Colour palette derived from:
 *   - Kenya flag: green, red, black, white
 *   - IEBC institutional blue (used sparingly for regulatory context)
 *
 * Mobile-first breakpoints reflect Kenya's 59% mobile internet penetration.
 * The default Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px)
 * already suit this — we add an 'xs' breakpoint for small feature phones.
 *
 * Typography uses Inter (Latin + extended) for readability across devices.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      // ── Kenya-Themed Colours ──────────────────────────────────
      colors: {
        kenya: {
          green: {
            DEFAULT: "#006600",
            50: "#E8F5E9",
            100: "#C8E6C9",
            200: "#A5D6A7",
            300: "#81C784",
            400: "#66BB6A",
            500: "#006600",
            600: "#005500",
            700: "#004400",
            800: "#003300",
            900: "#002200",
          },
          red: {
            DEFAULT: "#BB0000",
            50: "#FFEBEE",
            100: "#FFCDD2",
            200: "#EF9A9A",
            300: "#E57373",
            400: "#D32F2F",
            500: "#BB0000",
            600: "#A30000",
            700: "#8B0000",
            800: "#730000",
            900: "#5B0000",
          },
          black: "#000000",
          white: "#FFFFFF",
        },
        // IEBC institutional blue — for regulatory badges and official markers
        iebc: {
          DEFAULT: "#1A5276",
          light: "#2980B9",
          dark: "#0E3A52",
        },
        // Semantic colours for campaign finance status
        status: {
          compliant: "#006600",     // Within ECF Act limits
          warning: "#F57F17",       // Approaching spending threshold (>80%)
          violation: "#BB0000",     // Exceeded limits per ECF Act s.18
          pending: "#6B7280",       // Awaiting IEBC verification
          verified: "#1A5276",      // IEBC-confirmed data
        },
      },

      // ── Typography ────────────────────────────────────────────
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── Mobile-First Breakpoints ──────────────────────────────
      screens: {
        xs: "375px", // Small smartphones (common in Kenya)
      },

      // ── Spacing for card layouts ──────────────────────────────
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },

      // ── Border radius for card components ─────────────────────
      borderRadius: {
        card: "0.75rem",
      },

      // ── Box shadows for elevation hierarchy ───────────────────
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        modal:
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
    },
  },

  plugins: [],
};
