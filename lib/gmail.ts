import {ConnectorAuth, setConnector} from "./connectorStore";

export const GMAIL_SCOPES = "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly";

async function gmailFetch(url: string, token: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {authorization: `Bearer ${token}`, accept: "application/json", ...(init.headers || {})},
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return json;
}

export async function refreshGoogleAuth(auth: ConnectorAuth): Promise<ConnectorAuth> {
  if (!auth.refreshToken || !auth.expiresAt || auth.expiresAt > Date.now() + 60_000) return auth;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: auth.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error("Google token refresh failed");
  const refreshed: ConnectorAuth = {
    ...auth,
    accessToken: String(json.access_token),
    refreshToken: json.refresh_token ? String(json.refresh_token) : auth.refreshToken,
    expiresAt: json.expires_in ? Date.now() + Number(json.expires_in) * 1000 : auth.expiresAt,
  };
  setConnector("gmail", refreshed);
  return refreshed;
}

function headerValue(headers: Array<{name?: string; value?: string}> | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

export async function getGmailData(input: ConnectorAuth) {
  const auth = await refreshGoogleAuth(input);
  const profile = await gmailFetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", auth.accessToken);
  const list = await gmailFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:anywhere", auth.accessToken);
  const ids = Array.isArray(list.messages) ? list.messages.map((m: {id?: string}) => m.id).filter(Boolean) : [];
  const messages = await Promise.all(ids.map((id: string) => gmailFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, auth.accessToken)));
  return {
    profile: {emailAddress: profile.emailAddress, messagesTotal: profile.messagesTotal, threadsTotal: profile.threadsTotal},
    messages: messages.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      snippet: m.snippet || "",
      subject: headerValue(m.payload?.headers, "Subject"),
      from: headerValue(m.payload?.headers, "From"),
      to: headerValue(m.payload?.headers, "To"),
      date: headerValue(m.payload?.headers, "Date"),
      labelIds: m.labelIds || [],
    })),
    fetchedAt: new Date().toISOString(),
  };
}
