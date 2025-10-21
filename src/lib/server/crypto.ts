import { init as cuid2Init } from "@paralleldrive/cuid2";

export const webCrypto = new Crypto();

// cryptographically secure version of Math.random
export const secureRandom = () => {
  const floatBox = new Float64Array(1);
  crypto.getRandomValues(floatBox);
  const float = floatBox[0];
  if (float === 1) {
    return 0.0;
  } else if (float > 1) {
    return 1 / float;
  } else {
    return float;
  }
};

export const cuid2 = cuid2Init({
  // explicitly set this because other logic depends on it,
  // even though it is the default
  length: 24,
  random: secureRandom,
});
