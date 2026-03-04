import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Uchaguzi Safi</h1>
        <p className="text-xl text-gray-600">
          Campaign Finance Transparency Tool — Kenya 2027 Elections
        </p>
        <p className="text-sm text-gray-500">
          Election Campaign Financing Act, Cap. 7A (2013)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/dashboard"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
        >
          <h2 className="text-lg font-semibold text-gray-900">Fedha Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track campaign spending and contributions across all candidates.
          </p>
        </Link>

        <Link
          to="/candidates"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
        >
          <h2 className="text-lg font-semibold text-gray-900">Tafuta — Search</h2>
          <p className="text-sm text-gray-500 mt-1">
            Search and compare candidates contesting in the 2027 elections.
          </p>
        </Link>

        <Link
          to="/map"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
        >
          <h2 className="text-lg font-semibold text-gray-900">Taswira — Map</h2>
          <p className="text-sm text-gray-500 mt-1">
            Interactive county map showing campaign spending across Kenya.
          </p>
        </Link>

        <Link
          to="/report"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
        >
          <h2 className="text-lg font-semibold text-gray-900">Ripoti — Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            Report misuse of public resources during the campaign period.
          </p>
        </Link>

        <Link
          to="/alerts"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
        >
          <h2 className="text-lg font-semibold text-gray-900">Tahadhari — Alerts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Get notified about compliance breaches and spending anomalies.
          </p>
        </Link>
      </div>
    </div>
  );
}
