import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>

      <div className="mt-6">
        <Link
          href="/"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Back to feed
        </Link>
      </div>
    </main>
  );
}
