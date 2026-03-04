/**
 * UCHAGUZI SAFI — useIncidentReport Hook
 * =========================================
 * Multi-step form state management for the M3 Ripoti
 * incident reporting wizard.
 *
 * Manages:
 *   - Form data across all 5 steps
 *   - File upload queue with client-side compression
 *   - Submit mutation (POST /incidents + POST /evidence)
 *   - Validation per step
 *   - GPS coordinate capture
 *
 * API endpoints:
 *   POST /api/v1/incidents                    → IncidentResponse
 *   POST /api/v1/incidents/{tracking}/evidence → EvidenceItem
 *
 * ECF Act alignment:
 *   - incident_type maps to s.2 public resource definitions
 *   - description supports s.21(1) complaint
 *   - is_anonymous protects reporter identity
 *   - evidence files strengthen IEBC investigation
 */

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { incidentsAPI } from "../services/api";
import api from "../services/api";

/** Kenya geographic bounds for GPS validation */
const KENYA_BOUNDS = {
  latMin: -4.7, latMax: 4.6,
  lngMin: 33.9, lngMax: 41.9,
};

/** Initial form state */
const INITIAL_STATE = {
  // Step 1
  incident_type: "",
  // Step 2
  title: "",
  description: "",
  date_occurred: "",
  time_occurred: "",
  county: "",
  constituency: "",
  location_description: "",
  location_lat: null,
  location_lng: null,
  candidate_id: null,
  party_id: null,
  // Step 3
  files: [], // { file: File, preview: string, id: string }
  // Step 4
  is_anonymous: false,
  reporter_name: "",
  reporter_email: "",
  reporter_phone: "",
  // Step 5
  agreed_to_terms: false,
};

export function useIncidentReport() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [trackingNumber, setTrackingNumber] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  /** Update a single field */
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /** Update multiple fields at once */
  const updateFields = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  /** Navigation */
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(Math.max(0, Math.min(step, 4)));
  }, []);

  /** Add file to upload queue with preview */
  const addFiles = useCallback((newFiles) => {
    setFormData((prev) => ({
      ...prev,
      files: [
        ...prev.files,
        ...newFiles.map((file) => ({
          file,
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        })),
      ],
    }));
  }, []);

  /** Remove file from queue */
  const removeFile = useCallback((fileId) => {
    setFormData((prev) => {
      const removed = prev.files.find((f) => f.id === fileId);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return { ...prev, files: prev.files.filter((f) => f.id !== fileId) };
    });
  }, []);

  /** Capture GPS coordinates */
  const captureGPS = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Validate Kenya bounds
          if (
            latitude < KENYA_BOUNDS.latMin || latitude > KENYA_BOUNDS.latMax ||
            longitude < KENYA_BOUNDS.lngMin || longitude > KENYA_BOUNDS.lngMax
          ) {
            reject(new Error("Location outside Kenya"));
            return;
          }
          setFormData((prev) => ({
            ...prev,
            location_lat: latitude,
            location_lng: longitude,
          }));
          resolve({ latitude, longitude });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  /** Validate current step */
  const validateStep = useCallback(
    (step) => {
      const errors = [];
      switch (step) {
        case 0: // Incident type
          if (!formData.incident_type) errors.push("Select an incident type");
          break;
        case 1: // Details
          if (!formData.title || formData.title.length < 5)
            errors.push("Title must be at least 5 characters");
          if (!formData.description || formData.description.length < 20)
            errors.push("Description must be at least 20 characters");
          if (!formData.date_occurred)
            errors.push("Date is required");
          if (!formData.county) errors.push("County is required");
          break;
        case 2: // Evidence (optional)
          break;
        case 3: // Contact
          if (!formData.is_anonymous) {
            if (formData.reporter_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reporter_email))
              errors.push("Invalid email format");
            if (formData.reporter_phone && !/^(\+254|0)\d{9}$/.test(formData.reporter_phone))
              errors.push("Phone must be +254XXXXXXXXX or 0XXXXXXXXX");
          }
          break;
        case 4: // Review
          if (!formData.agreed_to_terms)
            errors.push("You must agree to the terms");
          break;
      }
      return errors;
    },
    [formData]
  );

  /** Submit mutation — 2-phase: create incident, then upload evidence */
  const submitMutation = useMutation({
    mutationFn: async () => {
      setSubmitError(null);

      // Phase 1: Create incident
      const payload = {
        incident_type: formData.incident_type,
        title: formData.title,
        description: formData.description,
        date_occurred: formData.date_occurred,
        county: formData.county,
        constituency: formData.constituency || undefined,
        location_description: formData.location_description || undefined,
        location_lat: formData.location_lat || undefined,
        location_lng: formData.location_lng || undefined,
        candidate_id: formData.candidate_id || undefined,
        party_id: formData.party_id || undefined,
        is_anonymous: formData.is_anonymous,
        reporter_name: formData.is_anonymous ? undefined : formData.reporter_name || undefined,
        reporter_email: formData.is_anonymous ? undefined : formData.reporter_email || undefined,
        reporter_phone: formData.is_anonymous ? undefined : formData.reporter_phone || undefined,
      };

      const incidentRes = await incidentsAPI.submit(payload);
      const tracking = incidentRes.data.tracking_number;

      // Phase 2: Upload evidence files (if any)
      for (const { file } of formData.files) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/incidents/${tracking}/evidence`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      return { tracking_number: tracking };
    },
    onSuccess: (data) => {
      setTrackingNumber(data.tracking_number);
    },
    onError: (error) => {
      setSubmitError(
        error.response?.data?.detail || error.message || "Submission failed"
      );
    },
  });

  /** Reset form */
  const resetForm = useCallback(() => {
    // Clean up preview URLs
    formData.files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFormData(INITIAL_STATE);
    setCurrentStep(0);
    setTrackingNumber(null);
    setSubmitError(null);
  }, [formData.files]);

  return {
    formData,
    currentStep,
    trackingNumber,
    submitError,
    isSubmitting: submitMutation.isPending,
    updateField,
    updateFields,
    nextStep,
    prevStep,
    goToStep,
    addFiles,
    removeFile,
    captureGPS,
    validateStep,
    submit: submitMutation.mutate,
    resetForm,
  };
}

export default useIncidentReport;
