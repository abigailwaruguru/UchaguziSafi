/**
 * UCHAGUZI SAFI — Report Page
 * ==============================
 * Multi-step wizard for submitting public resource misuse
 * reports under ECF Act s.14 and s.21.
 *
 * Steps:
 *   0: Incident type (s.2 definitions)
 *   1: Details (when, where, what)
 *   2: Evidence upload (optional)
 *   3: Contact information / anonymous toggle
 *   4: Review and submit
 *
 * After submission:
 *   Success modal with UCH-2027-XXXX tracking number
 *
 * Module: M3 Ripoti Ubadhirifu (Public Resource Misuse Tracker)
 * Route: /report
 *
 * User personas:
 *   - Wananchi (citizens): Primary users, mobile-first
 *   - Journalists: Detailed reports with evidence
 *   - CSOs: Systematic documentation
 */

import { useState } from "react";
import {
  AlertTriangle, Shield, ChevronLeft, ChevronRight,
  Send, Loader2,
} from "lucide-react";

import useIncidentReport from "../../hooks/useIncidentReport";
import StepIndicator from "../../components/report/StepIndicator";
import IncidentTypeStep from "../../components/report/IncidentTypeStep";
import DetailsStep from "../../components/report/DetailsStep";
import EvidenceStep from "../../components/report/EvidenceStep";
import ContactStep from "../../components/report/ContactStep";
import ReviewStep from "../../components/report/ReviewStep";
import SuccessModal from "../../components/report/SuccessModal";

export default function ReportPage() {
  const {
    formData,
    currentStep,
    trackingNumber,
    submitError,
    isSubmitting,
    updateField,
    updateFields,
    nextStep,
    prevStep,
    goToStep,
    addFiles,
    removeFile,
    captureGPS,
    validateStep,
    submit,
    resetForm,
  } = useIncidentReport();

  const [errors, setErrors] = useState([]);

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    nextStep();
  };

  const handleSubmit = () => {
    const stepErrors = validateStep(4);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    submit();
  };

  // ── Success state ─────────────────────────────────────────────
  if (trackingNumber) {
    return (
      <div className="mx-auto max-w-lg">
        <SuccessModal
          trackingNumber={trackingNumber}
          onNewReport={resetForm}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Page header ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BB0000]/10">
            <AlertTriangle className="h-5 w-5 text-[#BB0000]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Report Public Resource Misuse
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="h-3 w-3" />
              ECF Act s.14 — Prohibition on use of public resources
            </div>
          </div>
        </div>
      </div>

      {/* ── Step indicator ───────────────────────────────────── */}
      <StepIndicator currentStep={currentStep} />

      {/* ── Step content ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        {currentStep === 0 && (
          <IncidentTypeStep
            value={formData.incident_type}
            onChange={(v) => updateField("incident_type", v)}
          />
        )}
        {currentStep === 1 && (
          <DetailsStep
            formData={formData}
            updateField={updateField}
            captureGPS={captureGPS}
          />
        )}
        {currentStep === 2 && (
          <EvidenceStep
            files={formData.files}
            addFiles={addFiles}
            removeFile={removeFile}
          />
        )}
        {currentStep === 3 && (
          <ContactStep
            formData={formData}
            updateField={updateField}
          />
        )}
        {currentStep === 4 && (
          <ReviewStep
            formData={formData}
            goToStep={goToStep}
            updateField={updateField}
          />
        )}
      </div>

      {/* ── Validation errors ────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-[#BB0000]/20 bg-[#BB0000]/5 p-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-[#BB0000] flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#BB0000] flex-shrink-0" />
              {err}
            </p>
          ))}
        </div>
      )}

      {/* ── Submit error ─────────────────────────────────────── */}
      {submitError && (
        <div className="rounded-xl border border-[#BB0000]/20 bg-[#BB0000]/5 p-3">
          <p className="text-xs text-[#BB0000] font-semibold">Submission failed</p>
          <p className="text-xs text-[#BB0000] mt-0.5">{submitError}</p>
        </div>
      )}

      {/* ── Navigation buttons ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setErrors([]); prevStep(); }}
          disabled={currentStep === 0}
          className="
            flex items-center gap-1.5 rounded-xl border border-gray-200
            px-4 py-2.5 text-sm font-medium text-gray-600
            transition-colors hover:bg-gray-50
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            className="
              flex items-center gap-1.5 rounded-xl
              bg-[#006600] px-5 py-2.5 text-sm font-semibold text-white
              transition-colors hover:bg-[#005500]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
            "
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.agreed_to_terms}
            className="
              flex items-center gap-2 rounded-xl
              bg-[#006600] px-5 py-2.5 text-sm font-semibold text-white
              transition-colors hover:bg-[#005500]
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006600]/40
            "
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Report
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
