import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api/v1";

export default function ResultsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/candidates`, {
        params: { search: query.trim(), per_page: 20 },
      });
      setResults(res.data.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tafuta — Search Candidates
        </h1>
        <p className="text-gray-500 mt-1">
          Search by name, county, or party across all registered candidates.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search candidates..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((c) => (
            <Link
              key={c.id}
              to={`/candidates/${c.id}`}
              className="block p-4 bg-white border rounded-lg hover:shadow transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{c.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {c.county} &middot; {c.election_type}{" "}
                    {c.party_abbreviation && `(${c.party_abbreviation})`}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {c.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <p className="text-gray-500 text-sm">No candidates found.</p>
      )}
    </div>
  );
}
