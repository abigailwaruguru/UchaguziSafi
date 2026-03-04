/**
 * UCHAGUZI SAFI — ReviewStep Component
 * =======================================
 * Step 5: Review all entered information before submission.
 *
 * Displays a read-only summary of:
 *   - Incident type (with icon)
 *   - Date, location, description
 *   - Evidence file thumbnails
 *   - Contact info / anonymous status
 *
 * Each section has an "Edit" button linking back to the
 * relevant step. Terms checkbox required before submit.
 */

import {
  Banknote, Car, Building2, UserCheck, Flag,
  Edit3, Image as ImageIcon, Film, EyeOff, User, Shield,
} from "lucide-react";

const TYPE_ICONS = {
  STATE_FUNDS: Banknote,
  VEHICLE_EQUIPMENT: Car,
  PREMISES: Building2,
  PERSONNEL: UserCheck,
  OTHER: Flag,
};

const TYPE_LABELS = {
  STATE_FUNDS: "Government Money",
  VEHICLE_EQUIPMENT: "Government Vehicles / Equipment",
  PREMISES: "Government Buildings / Land",
  PERSONNEL: "Civil Servants Campaigning",
  OTHER: "Other Misuse",
};

export default function ReviewStep({ formData, goToStep, updateField }) {
  const TypeIcon = TYPE_ICONS[formData.incident_type] || Flag;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Review Your Report</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please verify the information before submitting.
        </p>
      </div>

      {/* Section: Incident Type */}
      <ReviewSection title="Incident Type" onEdit={() => goToStep(0)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006600]/10">
            <TypeIcon className="h-5 w-5 text-[#006600]" />
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {TYPE_LABELS[formData.incident_type] || formData.incident_type}
          </span>
        </div>
      </ReviewSection>

      {/* Section: Details */}
      <ReviewSection title="Details" onEdit={() => goToStep(1)}>
        <div className="space-y-2 text-sm">
          <ReviewRow label="Title" value={formData.title} />
          <ReviewRow label="Date" value={formData.date_occurred} />
          {formData.time_occurred && (
            <ReviewRow label="Time" value={formData.time_occurred} />
          )}
          <ReviewRow label="County" value={formData.county} />
          {formData.constituency && (
            <ReviewRow label="Constituency" value={formData.constituency} />
          )}
          {formData.location_description && (
            <ReviewRow label="Location" value={formData.location_description} />
          )}
          {formData.location_lat && (
            <ReviewRow
              label="GPS"
              value={`${formData.location_lat.toFixed(4)}, ${formData.location_lng.toFixed(4)}`}
            />
          )}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {formData.description}
            </p>
          </div>
        </div>
      </ReviewSection>

      {/* Section: Evidence */}
      <ReviewSection title={`Evidence (${formData.files.length} file${formData.files.length !== 1 ? "s" : ""})`} onEdit={() => goToStep(2)}>
        {formData.files.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {formData.files.map((item) => (
              <div key={item.id} className="h-16 w-16 rounded-lg overflow-hidden border border-gray-200">
                {item.preview ? (
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <Film className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No evidence uploaded</p>
        )}
      </ReviewSection>

      {/* Section: Contact */}
      <ReviewSection title="Contact" onEdit={() => goToStep(3)}>
        {formData.is_anonymous ? (
          <div className="flex items-center gap-2 text-sm">
            <EyeOff className="h-4 w-4 text-[#006600]" />
            <span className="font-medium text-[#006600]">Anonymous submission</span>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            {formData.reporter_name && <ReviewRow label="Name" value={formData.reporter_name} />}
            {formData.reporter_email && <ReviewRow label="Email" value={formData.reporter_email} />}
            {formData.reporter_phone && <ReviewRow label="Phone" value={formData.reporter_phone} />}
            {!formData.reporter_name && !formData.reporter_email && !formData.reporter_phone && (
              <p className="text-xs text-gray-400 italic">No contact details provided</p>
            )}
          </div>
        )}
      </ReviewSection>

      {/* Terms checkbox */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreed_to_terms}
            onChange={(e) => updateField("agreed_to_terms", e.target.checked)}
            className="
              mt-0.5 h-4 w-4 rounded border-gray-300
              text-[#006600] focus:ring-[#006600]
            "
          />
          <span className="text-xs text-gray-600">
            I confirm that the information in this report is true and accurate
            to the best of my knowledge. I understand this complaint will be
            processed under the ECF Act s.21 dispute resolution mechanism,
            and that knowingly providing false information is an offence
            under s.22(d).
          </span>
        </label>
      </div>
    </div>
  );
}


function ReviewSection({ title, onEdit, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-medium text-[#006600] hover:underline"
        >
          <Edit3 className="h-3 w-3" />
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
