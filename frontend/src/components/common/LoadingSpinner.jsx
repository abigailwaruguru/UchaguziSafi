/**
 * UCHAGUZI SAFI — Loading Spinner
 * Displays during lazy-loaded page transitions.
 * Kenya-green colour matches the platform branding.
 */

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-kenya-green-100 border-t-kenya-green rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Inapakia…</p>
      </div>
    </div>
  );
}
