import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createGoogleOAuthClient } from "@/lib/google";

// export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const oauth = createGoogleOAuthClient();

  // Temporary browser profile for this local prototype.
  const ownerId =
    request.cookies.get("gmail_owner")?.value ||
    randomBytes(32).toString("hex");

  const state = randomBytes(32).toString("hex");

  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: true,
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
    state,
  });

  const response = NextResponse.redirect(url);

  response.cookies.set("gmail_owner", ownerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}