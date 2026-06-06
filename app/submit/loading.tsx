export default function SubmitLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-5 w-80 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Form fields */}
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-10 w-full animate-pulse rounded-md bg-gray-200" />
          </div>
        ))}

        {/* Submit button */}
        <div className="h-11 w-full animate-pulse rounded-md bg-gray-200" />
      </div>
    </main>
  );
}
