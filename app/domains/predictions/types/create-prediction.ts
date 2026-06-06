import { z } from "zod";

const ALLOWED_SC_HOSTS = [
  "soundcloud.com",
  "www.soundcloud.com",
  "m.soundcloud.com",
];

export const createPredictionSchema = z
  .object({
    url: z
      .string()
      .url("Must be a valid URL")
      .refine(
        (val) => {
          try {
            const host = new URL(val).hostname;
            return ALLOWED_SC_HOSTS.includes(host);
          } catch {
            return false;
          }
        },
        { message: "URL must be a SoundCloud link (soundcloud.com)" }
      ),
    streamThreshold: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than zero"),
    predictedOutcome: z.enum(["yes", "no"]),
    horizon: z.enum(["1w", "2w", "4w", "8w"]),
    tastemakerId: z.string().uuid("Must be a valid UUID").optional(),
    walletAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address")
      .optional(),
  })
  .refine((data) => data.tastemakerId || data.walletAddress, {
    message: "Either tastemakerId or walletAddress is required",
    path: ["tastemakerId"],
  });

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;
