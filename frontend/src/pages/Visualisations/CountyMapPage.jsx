export default function CountyMapPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-4 py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900">
        Taswira — County Spending Map
      </h1>
      <p className="text-gray-500">
        Interactive map of campaign spending across Kenya's 47 counties.
        Requires a Mapbox token to be configured.
      </p>
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
        <p className="text-gray-400">
          Map component — set VITE_MAPBOX_TOKEN to enable.
        </p>
      </div>
    </div>
  );
}
