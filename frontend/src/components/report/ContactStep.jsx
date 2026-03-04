/**
 * UCHAGUZI SAFI — ContactStep Component
 * ========================================
 * Step 4: Reporter contact information.
 *
 * Features:
 *   - Anonymous toggle (default: OFF)
 *   - Name, email, phone fields (shown only if not anonymous)
 *   - Kenya phone format validation (+254XXXXXXXXX)
 *   - Privacy notice explaining data protection
 *
 * Reporter safety is architectural:
 *   When is_anonymous=True, the backend IncidentCreate validator
 *   zeroes out reporter fields BEFORE database write. The API
 *   NEVER returns reporter details in any response.
 */

import { Shield, Eye, EyeOff, Mail, Phone, User } from "lucide-react";

export default function ContactStep({ formData, updateField }) {
  const isAnon = formData.is_anonymous;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Optional. Providing contact details allows IEBC to follow up if needed.
        </p>
      </div>

      {/* Anonymous toggle */}
      <button
        onClick={() => updateField("is_anonymous", !isAnon)}
        className={`
          w-full flex items-center justify-between rounded-2xl border-2 p-4
          transition-all duration-200
          ${isAnon
            ? "border-[#006600] bg-[#006600]/5"
            : "border-gray-200 bg-white hover:border-gray-300"
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            flex h-10 w-10 items-center justify-center rounded-xl
            ${isAnon ? "bg-[#006600]/10" : "bg-gray-100"}
          `}>
            {isAnon ? (
              <EyeOff className="h-5 w-5 text-[#006600]" />
            ) : (
              <Eye className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">
              {isAnon ? "Reporting Anonymously" : "Submit with your details"}
            </p>
            <p className="text-xs text-gray-500">
              {isAnon
                ? "Your identity will not be recorded"
                : "Your details help IEBC follow up"
              }
            </p>
          </div>
        </div>
        {/* Toggle switch */}
        <div className={`
          relative h-6 w-11 rounded-full transition-colors
          ${isAnon ? "bg-[#006600]" : "bg-gray-300"}
        `}>
          <div className={`
            absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
            ${isAnon ? "translate-x-5" : "translate-x-0.5"}
          `} />
        </div>
      </button>

      {/* Contact fields — hidden when anonymous */}
      {!isAnon && (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              Your name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.reporter_name}
              onChange={(e) => updateField("reporter_name", e.target.value)}
              placeholder="Full name"
              className="
                w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
                text-sm text-gray-900 placeholder:text-gray-400
                focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
              "
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              Email <span className="text-gray-400 font-normal">(recommended)</span>
            </label>
            <input
              type="email"
              value={formData.reporter_email}
              onChange={(e) => updateField("reporter_email", e.target.value)}
              placeholder="you@example.com"
              className="
                w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
                text-sm text-gray-900 placeholder:text-gray-400
                focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
              "
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.reporter_phone}
              onChange={(e) => updateField("reporter_phone", e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="
                w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
                text-sm text-gray-900 placeholder:text-gray-400
                focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
              "
            />
          </div>
        </div>
      )}

      {/* Privacy notice */}
      <div className="rounded-2xl border border-[#006600]/20 bg-[#006600]/5 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 flex-shrink-0 text-[#006600] mt-0.5" />
          <div className="text-xs text-gray-600 space-y-1.5">
            <p className="font-bold text-[#006600]">Your identity is protected</p>
            <p>
              Reporter details are <strong>never</strong> included in public responses
              or shared with candidates, parties, or third parties.
            </p>
            <p>
              When anonymous mode is enabled, your contact information is
              cleared before being saved — it cannot be recovered even by
              system administrators.
            </p>
            <p className="text-[10px] text-gray-400">
              ECF Act s.16(5) — Disclosure of funds shall be confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
