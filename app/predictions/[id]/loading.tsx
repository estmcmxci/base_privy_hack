export default function PredictionLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Back link */}
      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-6 w-20 animate-pulse rounded-full bg-gray-200" />
      </div>

      {/* Stats grid */}
      <section className="mb-8">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200 mb-3" />
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-1 h-3 w-10 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>

      {/* Tastemaker section */}
      <section className="mb-8">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 mb-3" />
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
      </section>
    </main>
  );
}
