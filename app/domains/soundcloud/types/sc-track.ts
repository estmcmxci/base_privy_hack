import { z } from "zod";

export const ScTrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  permalink_url: z.string().optional(),
  playback_count: z.number().nullable().default(0),
  likes_count: z.number().nullable().default(0),
  reposts_count: z.number().nullable().default(0),
  comment_count: z.number().nullable().default(0),
  genre: z.string().nullable().optional(),
  artwork_url: z.string().nullable().optional(),
  created_at: z.string().optional(),
  user: z
    .object({
      id: z.number(),
      username: z.string(),
    })
    .optional(),
});

export type ScTrack = z.infer<typeof ScTrackSchema>;
