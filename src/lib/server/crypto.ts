import { init as cuid2Init } from "@paralleldrive/cuid2";

export const webCrypto = globalThis.crypto;

// cryptographically secure version of Math.random
export const secureRandom = () => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  // Convert to float between 0 and 1
  return buffer[0] / (0xffffffff + 1);
};

export const cuid2 = cuid2Init({
  // explicitly set this because other logic depends on it,
  // even though it is the default
  length: 24,
  random: secureRandom,
});
