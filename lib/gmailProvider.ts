import { ConnectorAuth } from "./connectorStore";

type GmailHeader = { name?: string; value?: string };

async function gmailJson(url: string, token: string) {
  const response = await fetch(url, {
    headers: { authorization: "Bearer " + token, accept: "application/json" },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error?.message === "string" ? body.error.message : "Gmail API request failed";
    throw new Error("Gmail API (" + response.status + "): " + message);
  }
  return body;
}

export async function gmailData(auth: ConnectorAuth) {
  if (!auth.accessToken) throw new Error("Gmail access token is missing");
  const base = "https://gmail.googleapis.com/gmail/v1/users/me";
  const [profile, listing] = await Promise.all([
    gmailJson(base + "/profile", auth.accessToken),
    gmailJson(base + "/messages?maxResults=20", auth.accessToken),
  ]);
  const messages = Array.isArray(listing.messages) ? listing.messages : [];
  const items = await Promise.all(messages.map(async (message: { id?: string; threadId?: string }) => {
    if (!message.id) return null;
    const params = new URLSearchParams({ format: "metadata" });
    params.append("metadataHeaders", "From");
    params.append("metadataHeaders", "To");
    params.append("metadataHeaders", "Subject");
    params.append("metadataHeaders", "Date");
    const detail = await gmailJson(base + "/messages/" + encodeURIComponent(message.id) + "?" + params.toString(), auth.accessToken);
    const headers: GmailHeader[] = Array.isArray(detail.payload?.headers) ? detail.payload.headers : [];
    const header = (name: string) => headers.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value || "";
    return {
      id: detail.id || message.id,
      threadId: detail.threadId || message.threadId || null,
      from: header("From"),
      to: header("To"),
      subject: header("Subject"),
      date: header("Date"),
      internalDate: detail.internalDate || null,
      snippet: typeof detail.snippet === "string" ? detail.snippet : "",
      labelIds: Array.isArray(detail.labelIds) ? detail.labelIds : [],
    };
  }));
  return {
    source: "Gmail API",
    emailAddress: profile.emailAddress || null,
    messagesTotal: Number(profile.messagesTotal || 0),
    threadsTotal: Number(profile.threadsTotal || 0),
    messages: items.filter(Boolean),
  };
}
