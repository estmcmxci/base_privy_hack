"use client";

import { useState, useEffect } from "react";

type ArtistData = {
  artist: {
    username: string;
    permalinkUrl: string;
    avatarUrl: string | null;
    city: string | null;
    countryCode: string | null;
    followersCount: number;
    trackCount: number;
  };
  totals: {
    plays: number;
    likes: number;
    reposts: number;
    comments: number;
    tracksFetched: number;
  };
};

type Props = {
  url: string;
};

export function ArtistPreview({ url }: Props) {
  const [data, setData] = useState<ArtistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    fetch("/api/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const details = body?.details;
          const message =
            typeof details === "string"
              ? details
              : details && typeof details === "object"
                ? Object.values(details).flat().join(", ")
                : body?.error ?? "Failed to fetch artist";
          throw new Error(message);
        }
        return res.json();
      })
      .then((json) => {
        if (!controller.signal.aborted) setData(json);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [url]);

  if (!url) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-200" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { artist, totals } = data;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        {artist.avatarUrl && (
          <img
            src={artist.avatarUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        )}
        <div>
          <p className="text-base font-semibold text-gray-900">
            {artist.username}
          </p>
          {artist.city && (
            <p className="text-sm text-gray-500">{artist.city}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="Followers" value={artist.followersCount} />
        <Stat label="Tracks" value={artist.trackCount} />
        <Stat label="Total plays" value={totals.plays} />
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Data from{" "}
        <a
          href={artist.permalinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          {artist.username} on SoundCloud
        </a>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-gray-50 px-3 py-2">
      <p className="text-lg font-semibold text-gray-900">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
