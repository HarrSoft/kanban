import * as df from "date-fns";
import * as v from "valibot";
import { hmac } from "@oslojs/crypto/hmac";
import { SHA256 } from "@oslojs/crypto/sha2";
import { constantTimeEqual } from "@oslojs/crypto/subtle";
import {
  Base64Url,
  PlatformRole,
  Session,
  SessionId,
  Unix,
  UserId,
} from "$types";

import { env } from "$env/dynamic/private";

const Header = v.looseObject({
  typ: v.literal("JWT"),
  alg: v.literal("HS256"),
});

const Payload = v.object({
  sub: UserId,
  exp: Unix,
  email: v.pipe(v.string(), v.email()),
  session_id: SessionId,
  session_exp: Unix,
  platform_role: PlatformRole,
});
type Payload = v.InferOutput<typeof Payload>;

type ValidateResult =
  | { valid: false; error: "token" | "unsigned" | "header" | "payload" | "aud" }
  | { valid: false; error: "signature"; sessionId: SessionId }
  | { valid: true; session: Session; tokenExp: Unix };

export const validateToken = (jwt: string): ValidateResult => {
  const [encHeader, encPayload, encSig] = jwt.split(".");
  if (!encHeader || !encPayload) {
    return { valid: false, error: "token" };
  }

  if (!encSig) {
    return { valid: false, error: "unsigned" };
  }

  // decode header
  try {
    const headerStr = Buffer.from(encHeader, "base64url").toString("utf-8");
    const headerObj = JSON.parse(headerStr);
    v.parse(Header, headerObj);
  } catch {
    return { valid: false, error: "header" };
  }

  // decode payload
  let payload: Payload;
  try {
    const payloadJson = Buffer.from(encPayload, "base64url").toString("utf-8");
    const payloadObj = JSON.parse(payloadJson);
    payload = v.parse(Payload, payloadObj);
  } catch {
    return { valid: false, error: "payload" };
  }

  // verify signature
  const computedMac = getMac(encHeader as Base64Url, encPayload as Base64Url);
  const decodedMac = Buffer.from(encSig, "base64url");
  const validSig = constantTimeEqual(computedMac, decodedMac);
  if (!validSig) {
    return {
      valid: false,
      error: "signature",
      sessionId: payload.session_id,
    };
  }

  const session: Session = {
    sessionId: payload.session_id,
    userId: payload.sub,
    userEmail: payload.email,
    expiresAt: payload.session_exp,
    platformRole: payload.platform_role,
  };

  return { valid: true, session, tokenExp: payload.exp };
};

export const createToken = (session: Session): string => {
  // build and encode header
  const strHeader = JSON.stringify({
    typ: "JWT",
    alg: "HS256",
  });
  const encHeader = Buffer.from(strHeader, "utf-8").toString(
    "base64url",
  ) as Base64Url;

  // set token expiration
  const tokenExpiresAt = df.add(new Date(), { hours: 24 });

  // build payload
  const payload: Payload = {
    sub: session.userId,
    exp: df.getUnixTime(tokenExpiresAt),
    email: session.userEmail,
    session_id: session.sessionId,
    session_exp: session.expiresAt,
    platform_role: session.platformRole,
  };

  // encode payload
  const strPayload = JSON.stringify(payload);
  const encPayload = Buffer.from(strPayload, "utf-8").toString(
    "base64url",
  ) as Base64Url;

  // generate signature
  const mac = getMac(encHeader, encPayload);
  const signature = Buffer.from(mac).toString("base64url");

  return [encHeader, encPayload, signature].join(".");
};

const getMac = (header: Base64Url, payload: Base64Url): Buffer => {
  if (!env.AUTH_SECRET) throw new Error("Missing AUTH_SECRET");
  const key = Buffer.from(env.AUTH_SECRET, "utf-8");
  const message = Buffer.from(header + "." + payload, "utf-8");
  const mac = hmac(SHA256, key, message);
  return Buffer.from(mac);
};
