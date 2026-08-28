import "server-only";
import jwt from "jsonwebtoken";

// Bevestigd via developer.apple.com: ES256, kid=Key ID, iss=Issuer ID,
// aud=appstoreconnect-v1, max. 20 minuten geldig.
export function generateAppStoreConnectToken(issuerId: string, keyId: string, privateKey: string): string {
  return jwt.sign({}, privateKey, {
    algorithm: "ES256",
    keyid: keyId,
    issuer: issuerId,
    audience: "appstoreconnect-v1",
    expiresIn: "19m",
  });
}
