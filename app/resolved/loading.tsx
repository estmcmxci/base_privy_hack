export default function ResolvedLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-5 w-72 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Card skeletons */}
      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          </li>
        ))}
      </ul>
    </main>
  );
}
