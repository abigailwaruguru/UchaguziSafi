import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api/v1";

export default function Dashboard() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    axios
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Fedha Dashboard — M1
        </h1>
        <p className="text-gray-500 mt-1">
          Campaign finance overview across all candidates.
        </p>
      </div>

      {health && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-800">
            API Status: {health.status}
          </p>
          <p className="text-green-700 mt-1">
            {health.legal_framework?.act} — Disclosure threshold: KES{" "}
            {health.legal_framework?.disclosure_threshold_kes?.toLocaleString()}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/candidates"
          className="p-4 bg-white border rounded-lg shadow-sm hover:shadow transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Candidates</h3>
          <p className="text-sm text-gray-500 mt-1">
            Browse and search all candidates.
          </p>
        </Link>
        <Link
          to="/map"
          className="p-4 bg-white border rounded-lg shadow-sm hover:shadow transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">County Map</h3>
          <p className="text-sm text-gray-500 mt-1">
            Spending by county across Kenya.
          </p>
        </Link>
        <Link
          to="/report"
          className="p-4 bg-white border rounded-lg shadow-sm hover:shadow transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Report Misuse</h3>
          <p className="text-sm text-gray-500 mt-1">
            Submit an incident report (ECF Act s.14).
          </p>
        </Link>
      </div>
    </div>
  );
}
