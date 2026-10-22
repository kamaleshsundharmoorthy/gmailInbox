import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createGoogleOAuthClient } from "@/lib/google";
import { connectDB } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { GmailAccount } from "@/models/GmailAccount";

// export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const savedState = request.cookies.get("gmail_oauth_state")?.value;
  const ownerId = request.cookies.get("gmail_owner")?.value;

  if (!code || !state || !savedState || state !== savedState || !ownerId) {
    return NextResponse.json(
      { error: "Invalid or expired OAuth state. Please try again." },
      { status: 400 },
    );
  }

  try {
    const oauth = createGoogleOAuthClient();

    const { tokens } = await oauth.getToken(code);

    oauth.setCredentials(tokens);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          error:
            "Google did not return a refresh token. Revoke this app's access in your Google Account and reconnect.",
        },
        { status: 400 },
      );
    }

    const googleApi = google.oauth2({
      version: "v2",
      auth: oauth,
    });

    const { data: profile } = await googleApi.userinfo.get();

    if (!profile.email || !profile.id) {
      throw new Error("Google did not return the account identity");
    }

    await connectDB();

    await GmailAccount.findOneAndUpdate(
      { ownerId, email: profile.email.toLowerCase() },
      {
        $set: {
          googleSub: profile.id,
          encryptedRefreshToken: encryptToken(tokens.refresh_token),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    const response = NextResponse.redirect(
      new URL("/", request.url),
    );

    response.cookies.set("gmail_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Gmail OAuth callback failed:", error);

    return NextResponse.json(
      { error: "Could not connect this Gmail account." },
      { status: 500 },
    );
  }
}