import { Link } from "react-router-dom";

export default function Visualisations() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900">
        Taswira — Data Visualisations
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/map"
          className="p-4 bg-white border rounded-lg shadow-sm hover:shadow transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">County Spending Map</h3>
          <p className="text-sm text-gray-500 mt-1">
            Interactive choropleth of spending across Kenya's 47 counties.
          </p>
        </Link>
        <Link
          to="/dashboard"
          className="p-4 bg-white border rounded-lg shadow-sm hover:shadow transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Finance Dashboard</h3>
          <p className="text-sm text-gray-500 mt-1">
            Charts and analytics for candidate spending and contributions.
          </p>
        </Link>
      </div>
    </div>
  );
}
