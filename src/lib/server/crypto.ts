import { init as cuid2Init } from "@paralleldrive/cuid2";

export const cuid2 = cuid2Init({
  // explicitly set this because other logic depends on it,
  // even though it is the default
  length: 24,
});
