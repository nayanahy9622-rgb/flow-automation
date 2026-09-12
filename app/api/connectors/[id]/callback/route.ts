import {NextRequest, NextResponse} from "next/server";
import {getProvider, completeOAuth} from "@/lib/oauth";

export async function GET(req: NextRequest, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const p = getProvider(id);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = req.cookies.get("flowos_oauth_state")?.value;

  if (!p || p.mode !== "oauth" || !code) {
    return new NextResponse("Invalid OAuth callback", {status: 400});
  }
  if (saved && state !== saved) {
    return new NextResponse("OAuth state mismatch", {status: 403});
  }

  try {
    await completeOAuth(id, code);
  } catch (e) {
    return new NextResponse(`OAuth failed: ${e instanceof Error ? e.message : String(e)}`, {status: 500});
  }

  const redirect = NextResponse.redirect(new URL("/?connected=" + id, process.env.APP_URL || req.url));
  redirect.cookies.delete("flowos_oauth_state");
  return redirect;
}