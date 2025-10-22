import { z } from "zod";

export const Theme = z.enum([
  "auto",
  "burning-love",
  "oceanside",
  "ribbit-dark",
  "ribbit-light",
]);
export type Theme = z.infer<typeof Theme>;
