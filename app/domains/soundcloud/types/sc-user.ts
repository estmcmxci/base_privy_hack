import { z } from "zod";

export const ScUserSchema = z.object({
  id: z.number(),
  kind: z.string().optional(),
  username: z.string(),
  permalink_url: z.string(),
  followers_count: z.number(),
  track_count: z.number(),
  avatar_url: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
});

export type ScUser = z.infer<typeof ScUserSchema>;
