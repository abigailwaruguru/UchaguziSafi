/**
 * UCHAGUZI SAFI — ShareButton Component
 * ========================================
 * Generates a WhatsApp share deep link pre-populated with
 * candidate financial summary information.
 *
 * WhatsApp is the dominant messaging platform in Kenya
 * (penetration > 94% of smartphone users). Sharing campaign
 * finance data via WhatsApp is the primary citizen-to-citizen
 * distribution mechanism for the Wananchi persona.
 *
 * The share text includes:
 *   - Candidate name, position, county
 *   - Spending vs. limit with percentage
 *   - Compliance status
 *   - Link back to the platform
 *
 * No external SDKs required — uses the wa.me deep link API.
 */

import { Share2, MessageCircle, Link2, Copy } from "lucide-react";
import { useState } from "react";

function formatKES(amount) {
  const num = Number(amount) || 0;
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  return `KES ${num.toLocaleString("en-KE")}`;
}

function buildShareText(candidate) {
  const {
    candidate_name,
    election_type,
    county,
    party_name,
    total_expenditure,
    spending_limit,
    spending_utilisation_pct,
    compliance_status,
  } = candidate;

  const statusEmoji =
    compliance_status === "COMPLIANT" ? "✅" :
    compliance_status === "WARNING" ? "⚠️" : "🚨";

  const lines = [
    `🗳️ *UCHAGUZI SAFI — Campaign Finance Report*`,
    ``,
    `👤 *${candidate_name}*`,
    `📍 ${election_type} — ${county}`,
    party_name ? `🏛️ ${party_name}` : null,
    ``,
    `💰 Spending: ${formatKES(total_expenditure)} / ${formatKES(spending_limit)}`,
    `📊 Utilisation: ${spending_utilisation_pct?.toFixed(1) || 0}%`,
    `${statusEmoji} Status: ${compliance_status}`,
    ``,
    `📱 View full details on Uchaguzi Safi:`,
    `${window.location.href}`,
    ``,
    `_Data per ECF Act Cap. 7A — Election Campaign Financing Act_`,
  ];

  return lines.filter(Boolean).join("\n");
}

export default function ShareButton({ candidate }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!candidate) return null;

  const shareText = buildShareText(candidate);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${candidate.candidate_name} — Uchaguzi Safi`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="
          flex items-center gap-2 rounded-xl border border-gray-200
          bg-white px-4 py-2.5 text-sm font-medium text-gray-700
          transition-colors hover:bg-gray-50 hover:border-[#006600]/30
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
        "
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          {/* Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#006600]/5 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              Share on WhatsApp
            </a>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Copy className="h-4 w-4 text-[#006600]" />
                  <span className="text-[#006600] font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 text-gray-400" />
                  Copy link
                </>
              )}
            </button>

            {/* Native share (mobile) */}
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={handleNativeShare}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 text-gray-400" />
                More options...
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
