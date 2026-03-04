import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api/v1";

export default function TrackPage() {
  const { id } = useParams();
  const [trackingNumber, setTrackingNumber] = useState(id || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e?.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API}/incidents/${trackingNumber.trim()}/status`
      );
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Incident not found. Check the tracking number."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Track Your Report
        </h1>
        <p className="text-gray-500 mt-1">
          Enter your tracking number (UCH-2027-XXXX) to check the status of
          your incident report.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2">
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="UCH-2027-0001"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Checking..." : "Track"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{result.title}</h2>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {result.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Tracking Number</p>
              <p className="font-medium">{result.tracking_number}</p>
            </div>
            <div>
              <p className="text-gray-500">County</p>
              <p className="font-medium">{result.county}</p>
            </div>
            <div>
              <p className="text-gray-500">Date Reported</p>
              <p className="font-medium">{result.date_reported}</p>
            </div>
            <div>
              <p className="text-gray-500">Evidence Files</p>
              <p className="font-medium">{result.evidence_count}</p>
            </div>
          </div>

          {result.status_updates?.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Status History
              </h3>
              <ul className="space-y-2">
                {result.status_updates.map((update) => (
                  <li
                    key={update.id}
                    className="text-sm border-l-2 border-green-300 pl-3"
                  >
                    <span className="font-medium">{update.new_status}</span>
                    {update.notes && (
                      <span className="text-gray-500"> — {update.notes}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
