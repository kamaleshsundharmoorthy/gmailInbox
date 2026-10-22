import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

function getKey() {
  const hex = process.env.APP_ENCRYPTION_KEY;

  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("APP_ENCRYPTION_KEY must be 64 hex characters");
  }

  return Buffer.from(hex, "hex");
}

export function encryptToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptToken(value: string) {
  const [ivHex, tagHex, encryptedHex] = value.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted token");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}