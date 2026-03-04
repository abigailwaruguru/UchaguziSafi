/**
 * UCHAGUZI SAFI — DetailsStep Component
 * ========================================
 * Step 2: When, where, and what happened.
 *
 * Fields:
 *   - date_occurred (required) — Date of the incident
 *   - time_occurred (optional) — Approximate time
 *   - county (required) — Kenya county dropdown
 *   - constituency (optional) — Text input
 *   - location_description (optional) — Landmark/address
 *   - GPS capture (optional) — "Use my location" button
 *   - title (required, min 5 chars) — Brief summary
 *   - description (required, min 20 chars) — Detailed account
 *   - candidate_id (optional) — Autocomplete (future)
 *   - party_id (optional) — Dropdown (future)
 *
 * ECF Act alignment:
 *   - Description supports s.21(1) complaint filing
 *   - GPS validates against Kenya bounds per backend
 */

import { useState } from "react";
import { MapPin, Crosshair, AlertCircle, Info } from "lucide-react";
import KENYA_COUNTIES from "../../data/kenyaCounties";

export default function DetailsStep({ formData, updateField, captureGPS }) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const handleGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const { latitude, longitude } = await captureGPS();
      updateField("location_lat", latitude);
      updateField("location_lng", longitude);
    } catch (err) {
      setGpsError(
        err.message === "Location outside Kenya"
          ? "Location appears to be outside Kenya"
          : "Could not get your location. Please enter it manually."
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Incident Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Provide as much detail as you can. This supports your complaint under ECF Act s.21(1).
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Brief title <span className="text-[#BB0000]">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g., Government vehicle used at campaign rally"
          maxLength={500}
          className="
            w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
            text-sm text-gray-900 placeholder:text-gray-400
            focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
          "
        />
        <p className="mt-1 text-[10px] text-gray-400">
          {formData.title.length}/500 characters (minimum 5)
        </p>
      </div>

      {/* Date and Time row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Date of incident <span className="text-[#BB0000]">*</span>
          </label>
          <input
            type="date"
            value={formData.date_occurred}
            onChange={(e) => updateField("date_occurred", e.target.value)}
            max={today}
            className="
              w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
              text-sm text-gray-900
              focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
            "
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Approximate time <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="time"
            value={formData.time_occurred}
            onChange={(e) => updateField("time_occurred", e.target.value)}
            className="
              w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
              text-sm text-gray-900
              focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
            "
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Location <span className="text-[#BB0000]">*</span>
        </label>

        {/* GPS button */}
        <button
          onClick={handleGPS}
          disabled={gpsLoading}
          className={`
            w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed
            px-4 py-3 text-sm font-medium transition-colors
            ${formData.location_lat
              ? "border-[#006600] bg-[#006600]/5 text-[#006600]"
              : "border-gray-300 text-gray-600 hover:border-[#006600] hover:bg-[#006600]/5"
            }
            disabled:opacity-50
          `}
        >
          <Crosshair className={`h-4 w-4 ${gpsLoading ? "animate-spin" : ""}`} />
          {gpsLoading
            ? "Getting location..."
            : formData.location_lat
              ? `📍 ${formData.location_lat.toFixed(4)}, ${formData.location_lng.toFixed(4)}`
              : "Use my current location"
          }
        </button>

        {gpsError && (
          <div className="flex items-center gap-2 text-xs text-[#BB0000]">
            <AlertCircle className="h-3 w-3" />
            {gpsError}
          </div>
        )}

        {/* County dropdown */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={formData.county}
              onChange={(e) => updateField("county", e.target.value)}
              className="
                w-full appearance-none rounded-xl border border-gray-200 bg-white
                py-2.5 pl-10 pr-4 text-sm text-gray-900
                focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
              "
            >
              <option value="">Select county *</option>
              {KENYA_COUNTIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={formData.constituency}
            onChange={(e) => updateField("constituency", e.target.value)}
            placeholder="Constituency (optional)"
            className="
              w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
              text-sm text-gray-900 placeholder:text-gray-400
              focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
            "
          />
        </div>

        <input
          type="text"
          value={formData.location_description}
          onChange={(e) => updateField("location_description", e.target.value)}
          placeholder="Landmark or address (e.g., Near Uhuru Park entrance)"
          maxLength={500}
          className="
            w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
            text-sm text-gray-900 placeholder:text-gray-400
            focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
          "
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          What happened? <span className="text-[#BB0000]">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Describe what you witnessed in detail — include names, vehicle plates, times, and any other specifics that could help verify the incident..."
          rows={5}
          className="
            w-full rounded-xl border border-gray-200 bg-white px-4 py-3
            text-sm text-gray-900 placeholder:text-gray-400 resize-none
            focus:border-[#006600] focus:outline-none focus:ring-2 focus:ring-[#006600]/10
          "
        />
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className={`${formData.description.length < 20 ? "text-[#BB0000]" : "text-gray-400"}`}>
            {formData.description.length} characters (minimum 20)
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Info className="h-2.5 w-2.5" />
            Supports your s.21(1) complaint
          </span>
        </div>
      </div>
    </div>
  );
}
