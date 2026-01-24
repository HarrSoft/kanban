import * as v from "valibot";

export const Base64 = v.pipe(v.string(), v.base64(), v.brand("Base64"));
export type Base64 = v.InferOutput<typeof Base64>;

export const Base64Url = v.pipe(
  v.string(),
  v.regex(/[A-Za-z0-9-_]*/),
  v.brand("Base64Url"),
);
export type Base64Url = v.InferOutput<typeof Base64Url>;

export const Seconds = v.pipe(v.number(), v.flavor("Seconds"));
export type Seconds = v.InferOutput<typeof Seconds>;

export const Unix = v.pipe(v.number(), v.flavor("Unix"));
export type Unix = v.InferOutput<typeof Unix>;
