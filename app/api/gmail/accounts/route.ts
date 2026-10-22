import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { GmailAccount } from "@/models/GmailAccount";

// export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ownerId = request.cookies.get("gmail_owner")?.value;

  if (!ownerId) {
    return NextResponse.json({ accounts: [] });
  }

  await connectDB();

  const accounts = await GmailAccount.find({ ownerId })
    .select("email")
    .lean();

  return NextResponse.json({
    accounts: accounts.map((account) => ({
      email: account.email,
    })),
  });
}