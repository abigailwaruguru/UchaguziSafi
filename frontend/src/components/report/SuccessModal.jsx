/**
 * UCHAGUZI SAFI — SuccessModal Component
 * =========================================
 * Displayed after successful incident submission.
 *
 * Shows:
 *   - Success animation (checkmark)
 *   - UCH-2027-XXXX tracking number (prominent)
 *   - Copy to clipboard button
 *   - Track your report link
 *   - Submit another report button
 *
 * The tracking number format is critical — it's the
 * reporter's only way to check the status of an
 * anonymous submission.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle, Copy, ExternalLink, Plus, Shield,
} from "lucide-react";

export default function SuccessModal({ trackingNumber, onNewReport }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement("input");
      input.value = trackingNumber;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Success icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#006600]/10">
        <CheckCircle className="h-10 w-10 text-[#006600]" strokeWidth={2} />
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-gray-900">
        Report Submitted
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Thank you for helping protect the integrity of Kenya's elections.
        Your report has been recorded and will be reviewed.
      </p>

      {/* Tracking number */}
      <div className="mt-6 w-full max-w-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Your Tracking Number
        </p>
        <div className="flex items-center justify-between rounded-2xl border-2 border-[#006600] bg-[#006600]/5 p-4">
          <span className="text-2xl font-extrabold tracking-wider text-[#006600]">
            {trackingNumber}
          </span>
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
              transition-colors
              ${copied
                ? "bg-[#006600] text-white"
                : "bg-white text-[#006600] border border-[#006600]/30 hover:bg-[#006600]/10"
              }
            `}
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span>
            Save this number! You can use it to track your report's progress
            without creating an account.
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 w-full max-w-sm space-y-3">
        <Link
          to={`/track/${trackingNumber}`}
          className="
            flex w-full items-center justify-center gap-2 rounded-xl
            bg-[#006600] px-4 py-3 text-sm font-semibold text-white
            hover:bg-[#005500] transition-colors
          "
        >
          <ExternalLink className="h-4 w-4" />
          Track Your Report
        </Link>

        <button
          onClick={onNewReport}
          className="
            flex w-full items-center justify-center gap-2 rounded-xl
            border border-gray-200 bg-white px-4 py-3 text-sm font-medium
            text-gray-700 hover:bg-gray-50 transition-colors
          "
        >
          <Plus className="h-4 w-4" />
          Submit Another Report
        </button>
      </div>

      {/* Legal reference */}
      <p className="mt-6 text-[10px] text-gray-400">
        Reports processed under ECF Act s.21 — IEBC determines complaints
        within 7 days (pre-election) or 14 days (post-election).
      </p>
    </div>
  );
}
