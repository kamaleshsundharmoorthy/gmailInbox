import { google } from "googleapis";
import { connectDB } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { GmailAccount } from "@/models/GmailAccount";
import { createGoogleOAuthClient } from "@/lib/google";

export async function getGmailClient(
  ownerId: string,
  email: string,
) {
  await connectDB();

  const account = await GmailAccount.findOne({
    ownerId,
    email: email.toLowerCase(),
  }).lean();

  if (!account) {
    throw new Error("Gmail account not found");
  }

  const oauth = createGoogleOAuthClient();

  oauth.setCredentials({
    refresh_token: decryptToken(account.encryptedRefreshToken),
  });

  return google.gmail({ version: "v1", auth: oauth });
}