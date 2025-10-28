import * as date from "date-fns";
import { z } from "zod";
import { hmac } from "@oslojs/crypto/hmac";
import { SHA256 } from "@oslojs/crypto/sha2";
import { constantTimeEqual } from "@oslojs/crypto/subtle";
import {
  PlatformRole,
  Session,
  SessionId,
  Theme,
  UserHandle,
  UserId,
} from "$types";
import { env } from "$env/dynamic/private";

const Header = z.looseObject({
  typ: z.literal("JWT"),
  alg: z.literal("HS256"),
});

const Payload = z.object({
  sub: UserId,
  exp: z.number(),
  handle: UserHandle,
  session_id: SessionId,
  session_exp: z.number(),
  platform_role: PlatformRole,
  theme: Theme,
});
type Payload = z.infer<typeof Payload>;

type ValidateResult =
  | { valid: false; error: "token" | "unsigned" | "header" | "payload" | "aud" }
  | { valid: false; error: "signature"; sessionId: SessionId }
  | { valid: true; session: Session; tokenExp: Date };

export const validateToken = (jwt: string): ValidateResult => {
  if (!env.AUTH_SECRET) {
    throw new Error("Missing AUTH_SECRET");
  }

  const [encHeader, encPayload, encSig] = jwt.split(".");
  if (!encHeader || !encPayload) {
    return { valid: false, error: "token" };
  }

  if (!encSig) {
    return { valid: false, error: "unsigned" };
  }

  // decode header
  const headerStr = Buffer.from(encHeader, "base64url").toString("utf-8");
  const headerObj = JSON.parse(headerStr);
  const headerRes = Header.safeParse(headerObj);
  if (!headerRes.success) {
    return { valid: false, error: "header" };
  }

  // decode payload
  const payloadStr = Buffer.from(encPayload, "base64url").toString("utf-8");
  const payloadObj = JSON.parse(payloadStr);
  const payloadRes = Payload.safeParse(payloadObj);
  if (!payloadRes.success) {
    return { valid: false, error: "payload" };
  }
  const payload = payloadRes.data;

  // verify signature
  const key = Buffer.from(env.AUTH_SECRET, "utf-8");
  const message = Buffer.from(encHeader + "." + encPayload, "utf-8");
  const computedMac = hmac(SHA256, key, message);
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
    userHandle: payload.handle,
    expiresAt: date.fromUnixTime(payload.session_exp),
    platformRole: payload.platform_role,
    theme: payload.theme,
  };

  return { valid: true, session, tokenExp: date.fromUnixTime(payload.exp) };
};

export const createToken = (session: Session): string => {
  if (!env.AUTH_SECRET) {
    throw new Error("Missing AUTH_SECRET");
  }

  // build and encode header
  const strHeader = JSON.stringify({
    typ: "JWT",
    alg: "HS256",
  });
  const encHeader = Buffer.from(strHeader, "utf-8").toString("base64url");

  // set token expiration
  const tokenExpiresAt = date.add(new Date(), { hours: 24 });

  // build payload
  const payload: Payload = {
    sub: session.userId,
    exp: date.getUnixTime(tokenExpiresAt),
    handle: session.userHandle,
    session_id: session.sessionId,
    session_exp: date.getUnixTime(session.expiresAt),
    platform_role: session.platformRole,
    theme: session.theme,
  };

  // encode payload
  const strPayload = JSON.stringify(payload);
  const encPayload = Buffer.from(strPayload, "utf-8").toString("base64url");

  // generate signature
  const key = Buffer.from(env.AUTH_SECRET, "utf-8");
  const message = Buffer.from(encHeader + "." + encPayload, "utf-8");
  const mac = hmac(SHA256, key, message);
  const sig = Buffer.from(mac).toString("base64url");

  const token = message + "." + sig;

  return token;
};
