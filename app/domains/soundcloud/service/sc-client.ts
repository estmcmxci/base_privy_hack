import { ScUserSchema, type ScUser } from "../types/sc-user";
import { ScTrackSchema, type ScTrack } from "../types/sc-track";

const TOKEN_TTL_MS = 3500 * 1000;

export class ScNotFoundError extends Error {
  readonly code = "sc_not_found" as const;
  constructor(path: string, body: string) {
    super(`SC API ${path} returned 404: ${body}`);
    this.name = "ScNotFoundError";
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://secure.soundcloud.com/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json; charset=utf-8",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`SC token request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };

  return cachedToken.value;
}

async function scFetch(
  path: string,
  token: string
): Promise<unknown> {
  const res = await fetch(`https://api.soundcloud.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json; charset=utf-8",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 404) {
      throw new ScNotFoundError(path, body);
    }
    throw new Error(`SC API ${path} failed: ${res.status} ${body}`);
  }

  return res.json();
}

export function createScClient(clientId: string, clientSecret: string) {
  async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
    return fn(await getToken(clientId, clientSecret));
  }

  return {
    async resolve(url: string): Promise<ScUser> {
      return withToken(async (token) => {
        const encoded = encodeURIComponent(url);
        const data = await scFetch(`/resolve?url=${encoded}`, token);
        const obj = data as Record<string, unknown>;

        // If resolve returns a track, extract the user
        if (obj.kind === "track" && obj.user) {
          const user = obj.user as Record<string, unknown>;
          return ScUserSchema.parse(
            await scFetch(`/users/${user.id}`, token)
          );
        }

        return ScUserSchema.parse(data);
      });
    },

    async resolveUrl(
      url: string
    ): Promise<{ kind: "user" | "track"; user: ScUser; track?: ScTrack }> {
      return withToken(async (token) => {
        const encoded = encodeURIComponent(url);
        const data = await scFetch(`/resolve?url=${encoded}`, token);
        const obj = data as Record<string, unknown>;

        if (obj.kind === "track") {
          const track = ScTrackSchema.parse(data);
          const embeddedUser = obj.user as Record<string, unknown> | undefined;
          if (!embeddedUser?.id) {
            throw new Error("Track response missing embedded user data");
          }
          const user = ScUserSchema.parse(
            await scFetch(`/users/${embeddedUser.id}`, token)
          );
          return { kind: "track", user, track };
        }

        const user = ScUserSchema.parse(data);
        return { kind: "user", user };
      });
    },

    async getTrack(id: number): Promise<ScTrack> {
      return withToken(async (token) => {
        const data = await scFetch(`/tracks/${id}`, token);
        return ScTrackSchema.parse(data);
      });
    },

    async getUser(id: number): Promise<ScUser> {
      return withToken(async (token) => {
        const data = await scFetch(`/users/${id}`, token);
        return ScUserSchema.parse(data);
      });
    },

    async getUserTracks(id: number, limit = 50): Promise<ScTrack[]> {
      return withToken(async (token) => {
        const data = await scFetch(`/users/${id}/tracks?limit=${limit}`, token);

        // SC API may return array or { collection: [...] }
        const items = Array.isArray(data)
          ? data
          : (data as { collection?: unknown[] }).collection ?? [];

        return items.map((item) => ScTrackSchema.parse(item));
      });
    },
  };
}
