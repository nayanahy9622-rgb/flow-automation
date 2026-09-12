import {randomBytes} from "crypto";
import {NextResponse} from "next/server";
import {connectorCallback} from "@/lib/oauth";
import {GMAIL_SCOPES} from "@/lib/gmail";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return new NextResponse("Gmail OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.", {status:503});

  const state = randomBytes(32).toString("base64url");
  const redirectUri = connectorCallback("gmail");
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", GMAIL_SCOPES);
  authorize.searchParams.set("access_type", "offline");
  authorize.searchParams.set("prompt", "consent");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize);
  response.cookies.set("flowos_oauth_state", state, {
    httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", path:"/", maxAge:600,
  });
  return response;
}
