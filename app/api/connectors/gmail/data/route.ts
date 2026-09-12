import {NextResponse} from "next/server";
import {getConnector, setConnector} from "@/lib/connectorStore";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailFetch(path: string, accessToken: string) {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    cache: "no-store",
    headers: {authorization: `Bearer ${accessToken}`},
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return json;
}

async function refresh(auth: ReturnType<typeof getConnector>) {
  if (!auth?.refreshToken || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return auth;
  if (!auth.expiresAt || auth.expiresAt > Date.now() + 60_000) return auth;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: auth.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error("Google token refresh failed");

  const next = {
    ...auth,
    accessToken: String(json.access_token),
    expiresAt: json.expires_in ? Date.now() + Number(json.expires_in) * 1000 : auth.expiresAt,
    connectedAt: auth.connectedAt,
  };
  setConnector("gmail", next);
  return next;
}

function headerValue(headers: any[], name: string) {
  return headers?.find((h) => String(h?.name || "").toLowerCase() === name)?.value || "";
}

export async function GET() {
  let auth = getConnector("gmail");
  if (!auth) return NextResponse.json({ok: false, error: "gmail_not_connected"}, {status: 404});

  try {
    auth = await refresh(auth);
    if (!auth) throw new Error("gmail_not_connected");

    const [profile, listed] = await Promise.all([
      gmailFetch("/profile", auth.accessToken),
      gmailFetch("/messages?maxResults=20&labelIds=INBOX", auth.accessToken),
    ]);

    const ids = Array.isArray(listed.messages) ? listed.messages : [];
    const messages = await Promise.all(ids.map(async ({id}: {id: string}) => {
      const m = await gmailFetch(`/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, auth!.accessToken);
      return {
        id: m.id,
        threadId: m.threadId,
        snippet: m.snippet || "",
        date: headerValue(m.payload?.headers, "date"),
        from: headerValue(m.payload?.headers, "from"),
        subject: headerValue(m.payload?.headers, "subject"),
        labelIds: m.labelIds || [],
      };
    }));

    return NextResponse.json({
      ok: true,
      data: {
        profile,
        messages,
        fetchedAt: new Date().toISOString(),
      },
    }, {headers: {"cache-control": "no-store"}});
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "gmail_data_failed",
    }, {status: 502, headers: {"cache-control": "no-store"}});
  }
}
