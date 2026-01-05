import { SHA3_512 } from "@oslojs/crypto/sha3";
import { constantTimeEqual } from "@oslojs/crypto/subtle";
import { init as cuid2Init } from "@paralleldrive/cuid2";
import { Base64Url } from "$types";

export const cuid2 = cuid2Init({
  // explicitly set this because other logic depends on it,
  // even though it is the default
  length: 24,
});

const hashPasswordToBuffer = (password: string, salt: Buffer): Buffer => {
  const pwBuf = Buffer.from(password, "utf-8");

  const hash = new SHA3_512();
  hash.update(pwBuf);
  hash.update(salt);
  const digest = hash.digest();

  return Buffer.from(digest);
};

export const hashNewPassword = (password: string) => {
  // gen 16 bytes of entropy using web crypto api
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);

  const newSaltBuf = Buffer.from(saltBytes);
  const pwBuf = hashPasswordToBuffer(password, newSaltBuf);

  return {
    hash: pwBuf.toString("base64url") as Base64Url,
    salt: newSaltBuf.toString("base64url") as Base64Url,
  };
};

export const checkPassword = (
  givenPassword: string,
  passwordHash: Base64Url,
  salt: Base64Url,
): boolean => {
  const saltBuf = Buffer.from(salt, "base64url");
  const givenPwBuf = hashPasswordToBuffer(givenPassword, saltBuf);
  const hashBuf = Buffer.from(passwordHash, "base64url");

  return constantTimeEqual(givenPwBuf, hashBuf);
};
