/**
 * UCHAGUZI SAFI — IncidentTypeStep Component
 * =============================================
 * Step 1: Select the type of public resource misuse.
 *
 * Maps directly to ECF Act s.2 definition of "public resource":
 *   (a) Monies intended for public use → STATE_FUNDS
 *   (b) State-owned vehicles/equipment → VEHICLE_EQUIPMENT
 *   (c) State-owned/occupied premises → PREMISES
 *   + s.14(2) public officers → PERSONNEL
 *   + Other → OTHER
 */

import {
  Banknote, Car, Building2, UserCheck, Flag,
} from "lucide-react";

const INCIDENT_TYPES = [
  {
    value: "STATE_FUNDS",
    label: "Government Money",
    description: "CDF, county funds, or other public money used for campaign activities",
    legal: "ECF Act s.2(a) — Monies intended for public use",
    icon: Banknote,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    activeBg: "bg-[#006600]/5",
    activeBorder: "border-[#006600]",
  },
  {
    value: "VEHICLE_EQUIPMENT",
    label: "Government Vehicles / Equipment",
    description: "State vehicles at rallies, government equipment used for campaigns",
    legal: "ECF Act s.2(b) — State-owned vehicles or equipment",
    icon: Car,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-[#1A5276]/5",
    activeBorder: "border-[#1A5276]",
  },
  {
    value: "PREMISES",
    label: "Government Buildings / Land",
    description: "Schools, government offices, or public land used for campaign events",
    legal: "ECF Act s.2(c) — State-owned or occupied premises",
    icon: Building2,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-[#F57F17]/5",
    activeBorder: "border-[#F57F17]",
  },
  {
    value: "PERSONNEL",
    label: "Civil Servants Campaigning",
    description: "Public officers campaigning during working hours or using their positions",
    legal: "ECF Act s.14(2) — Public officer shall not use public resource to campaign",
    icon: UserCheck,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    activeBg: "bg-purple-500/5",
    activeBorder: "border-purple-500",
  },
  {
    value: "OTHER",
    label: "Other Misuse",
    description: "Other forms of public resource misuse not covered above",
    legal: "ECF Act s.14(1) — General prohibition on public resource use",
    icon: Flag,
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
    activeBg: "bg-gray-500/5",
    activeBorder: "border-gray-500",
  },
];

export default function IncidentTypeStep({ value, onChange }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900">
        What type of misuse did you witness?
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Select the category that best describes the incident.
      </p>

      <div className="mt-6 space-y-3">
        {INCIDENT_TYPES.map((type) => {
          const isSelected = value === type.value;
          const Icon = type.icon;

          return (
            <button
              key={type.value}
              onClick={() => onChange(type.value)}
              className={`
                w-full rounded-2xl border-2 p-4 text-left
                transition-all duration-200
                ${isSelected
                  ? `${type.activeBg} ${type.activeBorder} shadow-sm`
                  : `bg-white border-gray-200 hover:${type.bg} hover:${type.border}`
                }
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl
                  ${isSelected ? type.activeBg : type.bg}
                `}>
                  <Icon className={`h-6 w-6 ${type.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900">
                      {type.label}
                    </h3>
                    <div className={`
                      h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      transition-all duration-200
                      ${isSelected
                        ? "border-[#006600] bg-[#006600]"
                        : "border-gray-300"
                      }
                    `}>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{type.description}</p>
                  <p className="mt-1.5 text-[10px] text-gray-400">{type.legal}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
