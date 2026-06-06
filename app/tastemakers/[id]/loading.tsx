export default function TastemakerLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Profile header */}
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-5 w-40 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-3 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto h-7 w-12 animate-pulse rounded bg-gray-200" />
            <div className="mx-auto mt-1 h-3 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Predictions list */}
      <div className="h-5 w-28 animate-pulse rounded bg-gray-200 mb-4" />
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          </li>
        ))}
      </ul>
    </main>
  );
}
