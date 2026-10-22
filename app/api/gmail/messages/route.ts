import { NextRequest, NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail";

// export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ownerId = request.cookies.get("gmail_owner")?.value;
  const email = request.nextUrl.searchParams.get("account");

  if (!ownerId || !email) {
    return NextResponse.json(
      { error: "Select a connected Gmail account" },
      { status: 400 },
    );
  }

  try {
    const gmail = await getGmailClient(ownerId, email);

    const result = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 25,
    });

    const messages = await Promise.all(
      (result.data.messages ?? []).map(async (message) => {
        if (!message.id) return null;

        const detail = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        const headers = detail.data.payload?.headers ?? [];
        const header = (name: string) =>
          headers.find(
            (item) => item.name?.toLowerCase() === name.toLowerCase(),
          )?.value ?? "";

        const images: {
          partId: string;
          filename: string;
          mimeType: string;
        }[] = [];

        function inspectParts(
          parts: typeof detail.data.payload.parts,
        ) {
          for (const part of parts ?? []) {
            const isImage = part.mimeType?.startsWith("image/");

            if (isImage && part.partId) {
              images.push({
                partId: part.partId,
                filename: part.filename || "image",
                mimeType: part.mimeType || "application/octet-stream",
              });
            }

            inspectParts(part.parts);
          }
        }

        inspectParts(detail.data.payload?.parts);

        return {
          id: message.id,
          subject: header("Subject") || "(No subject)",
          from: header("From"),
          date: header("Date"),
          snippet: detail.data.snippet ?? "",
          images,
        };
      }),
    );

    return NextResponse.json({
      messages: messages.filter(Boolean),
    });
  }  catch (error) {
  console.error("Inbox retrieval failed:", error);

  return NextResponse.json(
    {
      error: "Could not load this inbox.",
      details:
        error instanceof Error
          ? error.message
          : String(error),
    },
    { status: 500 },
  );
}
}