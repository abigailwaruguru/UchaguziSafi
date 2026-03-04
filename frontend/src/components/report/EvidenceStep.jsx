/**
 * UCHAGUZI SAFI — EvidenceStep Component
 * =========================================
 * Step 3: Upload supporting evidence.
 *
 * Supports:
 *   - Images: JPEG, PNG, WebP (max 10MB each)
 *   - Videos: MP4, MOV (max 50MB each)
 *   - Drag-and-drop or click to browse
 *   - Multiple files allowed
 *   - Preview thumbnails with remove button
 *
 * Evidence is optional but strengthens the complaint
 * under ECF Act s.21 investigation procedures.
 */

import { useState, useRef, useCallback } from "react";
import {
  Upload, X, Image as ImageIcon, Film, AlertCircle, Info,
} from "lucide-react";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB
const ACCEPTED_TYPES = {
  "image/jpeg": MAX_IMAGE_SIZE,
  "image/png": MAX_IMAGE_SIZE,
  "image/webp": MAX_IMAGE_SIZE,
  "video/mp4": MAX_VIDEO_SIZE,
  "video/quicktime": MAX_VIDEO_SIZE,
};
const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(",");

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function EvidenceStep({ files = [], addFiles, removeFile }) {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);

  const validateAndAdd = useCallback((fileList) => {
    const valid = [];
    const errs = [];

    for (const file of fileList) {
      const maxSize = ACCEPTED_TYPES[file.type];
      if (!maxSize) {
        errs.push(`${file.name}: Unsupported file type`);
        continue;
      }
      if (file.size > maxSize) {
        errs.push(`${file.name}: Exceeds ${formatFileSize(maxSize)} limit`);
        continue;
      }
      valid.push(file);
    }

    setErrors(errs);
    if (valid.length > 0) addFiles(valid);
  }, [addFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndAdd(Array.from(e.dataTransfer.files));
    }
  }, [validateAndAdd]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    if (e.target.files.length > 0) {
      validateAndAdd(Array.from(e.target.files));
      e.target.value = "";
    }
  }, [validateAndAdd]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Upload Evidence</h2>
        <p className="mt-1 text-sm text-gray-500">
          Photos and videos strengthen your report. This step is optional.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center
          rounded-2xl border-2 border-dashed p-8
          cursor-pointer transition-all duration-200
          ${dragActive
            ? "border-[#006600] bg-[#006600]/5"
            : "border-gray-300 bg-gray-50 hover:border-[#006600] hover:bg-[#006600]/5"
          }
        `}
      >
        <Upload className={`h-8 w-8 mb-3 ${dragActive ? "text-[#006600]" : "text-gray-400"}`} />
        <p className="text-sm font-medium text-gray-700">
          Drag files here or <span className="text-[#006600] underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Images (JPEG, PNG) up to 10MB • Videos (MP4) up to 50MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#BB0000]">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              {/* Preview */}
              {item.preview ? (
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-gray-100">
                  <Film className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                className="
                  absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center
                  rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100
                  transition-opacity
                "
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* File info */}
              <div className="px-2.5 py-2">
                <p className="text-[10px] font-medium text-gray-700 truncate">
                  {item.file.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.file.type.startsWith("image/") ? (
                    <ImageIcon className="h-2.5 w-2.5 text-gray-400" />
                  ) : (
                    <Film className="h-2.5 w-2.5 text-gray-400" />
                  )}
                  <span className="text-[9px] text-gray-400">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      <div className="flex items-start gap-2 rounded-xl bg-[#006600]/5 p-3">
        <Info className="h-4 w-4 flex-shrink-0 text-[#006600] mt-0.5" />
        <div className="text-xs text-gray-600">
          <p className="font-semibold text-[#006600]">Evidence strengthens your report</p>
          <p className="mt-0.5">
            Photos of vehicle plates, videos of events, or screenshots of
            communications help IEBC investigators verify your complaint
            under Section 21.
          </p>
        </div>
      </div>
    </div>
  );
}
