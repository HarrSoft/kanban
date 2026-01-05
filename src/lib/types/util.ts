import { z } from "zod";

export const Base64Url = z.base64url().brand<"Base64Url">();
export type Base64Url = z.infer<typeof Base64Url>;
