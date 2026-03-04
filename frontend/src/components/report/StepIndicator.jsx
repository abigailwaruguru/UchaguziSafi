import { Check } from "lucide-react";

const STEPS = [
  "Incident Type",
  "Details",
  "Evidence",
  "Contact",
  "Review",
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full
                  text-xs font-bold transition-colors
                  ${isCompleted ? "bg-[#006600] text-white" : ""}
                  ${isCurrent ? "bg-[#006600] text-white ring-2 ring-[#006600]/30" : ""}
                  ${!isCompleted && !isCurrent ? "bg-gray-200 text-gray-500" : ""}
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`
                  mt-1.5 text-[10px] font-medium
                  ${isCurrent ? "text-[#006600]" : "text-gray-400"}
                `}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`
                  mx-2 h-0.5 flex-1
                  ${isCompleted ? "bg-[#006600]" : "bg-gray-200"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}